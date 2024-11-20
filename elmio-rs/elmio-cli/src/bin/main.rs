use std::{path::PathBuf, process};

use clap::{command, Parser, Subcommand};
use elmio_cli::{
    builders::{
        backlog_builder::{self, BacklogBuilder},
        rust_builder::{self, RustBuilder},
        web_builder::{self, WebBuilder},
    },
    commands::{
        build::{Env, Runner},
        cleaner::{self, Cleaner},
        script_runner::{self, ScriptRunner},
        serve, watch,
    },
    project::{self, Project},
    utils::{
        asset_hasher::{self, AssetHasher},
        project_info::ProjectInfo,
    },
};

#[derive(Debug, Parser)]
#[command(about, author, version, long_about = None)]
#[command(propagate_version = true)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    /// Create a new project with the specified name.
    #[command(arg_required_else_help = true)]
    New {
        /// Name of the project to create.
        name: String,
    },

    /// Add a new resource to the project.
    Add {
        /// Type of resource to add (e.g., page, component).
        #[command(subcommand)]
        command: AddCommand,
    },

    /// Build the project with optional configurations.
    #[clap(arg_required_else_help = false)]
    Build {
        /// Build in release mode (optimized for production).
        #[arg(long)]
        release: bool,

        /// Append a file hash to the filenames of assets for cache busting.
        #[arg(long)]
        hash_assets: bool,

        /// Specify a script to run after the build process completes.
        #[arg(long)]
        script: Option<String>,
    },

    /// Watch for file changes and rebuild automatically.
    #[command(arg_required_else_help = false)]
    Watch {
        /// Specify a script to run after each rebuild.
        #[arg(long)]
        script: Option<String>,
    },

    /// Serve static files, routes, and headers for local development or testing.
    Serve {
        /// Directory path to serve static files from.
        #[arg(long, value_name = "PATH")]
        static_: Option<PathBuf>,

        /// File path to load route definitions.
        #[arg(long, value_name = "PATH")]
        routes: Option<PathBuf>,

        /// Additional HTTP response headers to include (format: 'key=value').
        #[arg(long, value_name = "HEADER")]
        header: Vec<String>,
    },
}

#[derive(Debug, Subcommand)]
enum AddCommand {
    /// Add a new page to the project.
    #[command(arg_required_else_help = true)]
    Page {
        /// Name of the page to add.
        name: String,
    },
}

fn main() {
    let args = Cli::parse();

    match args.command {
        Commands::New { name } => {
            let current_dir = get_current_dir();
            let project = Project::new(project::Config {
                current_dir,
                name: name.clone(),
                template: project::Template::CounterTailwind,
            });

            let res = project.create();
            println!("{:?}", res);
        }

        Commands::Add { command } => match command {
            AddCommand::Page { name } => {
                let current_dir = get_current_dir();
                let project_info = ProjectInfo::from_dir(&current_dir).unwrap();
                let project = Project::new(project::Config {
                    current_dir: current_dir.clone(),
                    name: project_info.project_name.clone(),
                    template: project::Template::CounterTailwind,
                });
                let res = project.add_page(&project_info, &name);
                println!("{:?}", res);
            }
        },

        Commands::Build {
            script,
            release,
            hash_assets,
        } => {
            let env = if release { Env::Release } else { Env::Dev };
            let current_dir = get_current_dir();
            let project_info = ProjectInfo::from_dir(&current_dir).unwrap();

            print_project_info(&project_info);

            let cleaner = Cleaner::new(cleaner::Config::from_project_info(&project_info));

            let rust_builder =
                RustBuilder::new(rust_builder::Config::from_project_info(&env, &project_info));

            let web_builder =
                WebBuilder::new(web_builder::Config::from_project_info(&env, &project_info));

            cleaner.run().expect("Cleaner failed");

            if let Err(err) = rust_builder.run() {
                eprintln!("Rust build failed: {}", err);
                process::exit(1);
            }

            if let Err(err) = web_builder.run() {
                eprintln!("Web build failed: {}", err);
                process::exit(1);
            }

            if let Some(script_name) = &script {
                let script_path = current_dir.join(script_name);
                let script_runner = ScriptRunner::new(script_path, &env);
                script_runner
                    .run(script_runner::Event::BeforeAssetHash)
                    .expect("Post build runner failed");
            }

            if hash_assets {
                let asset_hasher =
                    AssetHasher::new(asset_hasher::Config::from_project_info(&project_info));

                hash_assets_helper(
                    &asset_hasher,
                    &rust_builder,
                    &web_builder,
                    &script,
                    &current_dir,
                    &env,
                );

                // Hash again now that assets contains the correct hash
                hash_assets_helper(
                    &asset_hasher,
                    &rust_builder,
                    &web_builder,
                    &script,
                    &current_dir,
                    &env,
                );
            }
        }

        Commands::Watch { script } => {
            let env = Env::Dev;
            let current_dir = get_current_dir();
            let project_info = ProjectInfo::from_dir(&current_dir).unwrap();

            print_project_info(&project_info);

            let cleaner = Cleaner::new(cleaner::Config::from_project_info(&project_info));

            let rust_builder = rust_builder::RustBuilder::new(
                rust_builder::Config::from_project_info(&env, &project_info),
            );

            let web_builder = web_builder::WebBuilder::new(web_builder::Config::from_project_info(
                &env,
                &project_info,
            ));

            let post_build_runner = if let Some(script_name) = script {
                let script_path = current_dir.join(script_name);
                if script_path.exists() {
                    Some(ScriptRunner::new(script_path, &env))
                } else {
                    eprintln!("Could not find script: {}", script_path.display());
                    None
                }
            } else {
                None
            };

            // Do initial build
            cleaner.run().expect("Cleaner failed");

            if let Err(err) = rust_builder.run() {
                eprintln!("Rust build failed: {}", err);
                process::exit(1);
            }

            if let Err(err) = web_builder.run() {
                eprintln!("Web build failed: {}", err);
                process::exit(1);
            }

            post_build_runner.as_ref().map(|runner| {
                runner
                    .run(script_runner::Event::BeforeAssetHash)
                    .expect("Post build runner failed")
            });

            let builder = BacklogBuilder::new(backlog_builder::Config {
                rust_builder,
                web_builder,
                post_build_runner,
            });

            println!("Watching for changes...");
            let watcher_config = watch::Config::new(&current_dir, builder);
            watch::watch(watcher_config);
        }

        Commands::Serve {
            static_,
            routes,
            header,
        } => {
            let default_path = get_current_dir().join("dist");
            let static_base_path = static_.unwrap_or(default_path);
            let parsed_routes = routes
                .map(|path| serve::read_routes(&path))
                .unwrap_or_default();

            let config = serve::Config {
                static_base_path,
                routes: parsed_routes,
                response_headers: header,
            };

            if let Err(err) = serve::start(&config) {
                eprintln!("Error: {:?}", err);
            }
        }
    }
}

fn hash_assets_helper(
    asset_hasher: &AssetHasher,
    rust_builder: &RustBuilder,
    web_builder: &WebBuilder,
    script: &Option<String>,
    current_dir: &PathBuf,
    env: &Env,
) {
    let assets = asset_hasher.collect_hashed_dist_assets().unwrap();
    asset_hasher
        .replace_checksum_in_source_files(&assets)
        .unwrap();

    rust_builder.run().expect("Rust build failed");
    web_builder.run().expect("Web build failed");

    if let Some(script_name) = &script {
        let script_path = current_dir.join(script_name);
        let script_runner = ScriptRunner::new(script_path, &env);
        script_runner
            .run(script_runner::Event::AfterAssetHash)
            .expect("Post build runner failed");
    }
}

fn get_current_dir() -> PathBuf {
    std::env::current_dir().unwrap()
}

fn print_project_info(info: &ProjectInfo) {
    println!("[Project name] {}", info.project_name);
    println!("[Dist dir] {}", info.dist_path.display());
    println!("[Web project dir] {}", info.web_project_path.display());
    println!("[Core project dir] {}", info.core_project_path.display());
    println!("[Wasm project dir] {}", info.wasm_project_path.display());
    println!(
        "[Cloudflare project dir] {}",
        info.cloudflare_project_path.display()
    );
    println!("");
}
