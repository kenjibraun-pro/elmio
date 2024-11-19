use std::{
    collections::HashSet,
    fmt,
    sync::{atomic::AtomicBool, Arc, Mutex},
};

use crate::commands::{
    build::Runner,
    script_runner::{self, ScriptRunner},
};

use super::{
    rust_builder::{self, RustBuilder},
    web_builder::{self, WebBuilder},
};

#[derive(Debug, PartialEq, Eq, Hash)]
pub enum ChangeType {
    Rust,
    TypeScript,
    Css,
}

#[derive(Debug)]
pub enum Error {
    BacklogLock(String),
}

#[derive(Debug)]
pub enum BuildError {
    RustBuild(rust_builder::Error),
    WebBuild(web_builder::Error),
    PostBuildRunner(script_runner::Error),
}

impl fmt::Display for BuildError {
    fn fmt(&self, f: &mut fmt::Formatter) -> Result<(), fmt::Error> {
        match self {
            BuildError::RustBuild(err) => write!(f, "---Rust build failed: {}", err),
            BuildError::WebBuild(err) => write!(f, "Web build failed: {}", err),
            BuildError::PostBuildRunner(err) => write!(f, "Post build runner failed: {}", err),
        }
    }
}

#[derive(Debug, Clone)]
pub struct BacklogBuilder {
    config: Config,
    state: Arc<State>,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub rust_builder: RustBuilder,
    pub web_builder: WebBuilder,
    pub post_build_runner: Option<ScriptRunner>,
}

impl BacklogBuilder {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            state: Arc::new(State::new()),
        }
    }

    pub fn run(&mut self, change: ChangeType) -> Result<(), Error> {
        self.state
            .backlog
            .lock()
            .map_err(|err| Error::BacklogLock(err.to_string()))?
            .insert(change);

        if self.is_running() {
            Ok(())
        } else {
            build(self.config.clone(), self.state.clone())
        }
    }

    fn is_running(&self) -> bool {
        self.state
            .is_running
            .load(std::sync::atomic::Ordering::Relaxed)
    }
}

fn build(config: Config, state: Arc<State>) -> Result<(), Error> {
    let backlog_length = state
        .backlog
        .lock()
        .map_err(|err| Error::BacklogLock(err.to_string()))?
        .len();

    if backlog_length > 0 {
        state
            .is_running
            .store(true, std::sync::atomic::Ordering::Relaxed);

        let changes: HashSet<ChangeType> = state
            .backlog
            .lock()
            .map_err(|err| Error::BacklogLock(err.to_string()))?
            .drain()
            .collect();

        let build_type = BuildType::from_changes(changes);

        std::thread::spawn(move || {
            if let Err(err) = run_script(build_type, &config) {
                println!("{}", err);
            };

            state
                .is_running
                .store(false, std::sync::atomic::Ordering::Relaxed);

            if let Err(err) = build(config, state) {
                handle_error(err);
            }
        });

        Ok(())
    } else {
        Ok(())
    }
}

pub fn handle_error(err: Error) {
    match err {
        Error::BacklogLock(err) => {
            println!("Failed to get a lock on backlog: {}", err);
        }
    }
}

#[derive(Debug)]
pub struct State {
    is_running: AtomicBool,
    backlog: Mutex<HashSet<ChangeType>>,
}

impl State {
    pub fn new() -> Self {
        Self {
            is_running: AtomicBool::new(false),
            backlog: Mutex::new(HashSet::new()),
        }
    }
}

fn run_script(build_type: BuildType, config: &Config) -> Result<(), BuildError> {
    println!("\nStarting build of {:?}", build_type);

    match build_type {
        BuildType::All => {
            config.rust_builder.run().map_err(BuildError::RustBuild)?;
            config.web_builder.run().map_err(BuildError::WebBuild)?;
        }

        BuildType::OnlyWeb => {
            config.web_builder.run().map_err(BuildError::WebBuild)?;
        }
    }

    if let Some(post_build_runner) = &config.post_build_runner {
        post_build_runner
            .run(script_runner::Event::BeforeAssetHash)
            .map_err(BuildError::PostBuildRunner)?;
    }

    println!("Completed build of {:?}", build_type);

    Ok(())
}

#[derive(Debug)]
enum BuildType {
    All,
    OnlyWeb,
}

impl BuildType {
    fn from_changes(changes: HashSet<ChangeType>) -> BuildType {
        let only_typescript = HashSet::from([ChangeType::TypeScript]);
        let only_css = HashSet::from([ChangeType::Css]);

        if changes == only_typescript {
            BuildType::OnlyWeb
        } else if changes == only_css {
            BuildType::OnlyWeb
        } else {
            BuildType::All
        }
    }
}
