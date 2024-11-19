use std::{fmt, fs, io, path::PathBuf};

use crate::{
    commands::{
        build::{Env, Runner},
        exec,
    },
    utils::project_info::ProjectInfo,
};

#[derive(Debug, Clone)]
pub struct Config {
    pub env: Env,
    pub project_name: String,
    pub frontend_dist_path: PathBuf,
    pub backend_dist_path: PathBuf,
    pub web_project_path: PathBuf,
    pub wasm_project_path: PathBuf,
    pub cloudflare_project_path: PathBuf,
}

impl Config {
    pub fn from_project_info(env: &Env, project_info: &ProjectInfo) -> Self {
        Self {
            env: env.clone(),
            project_name: project_info.project_name.clone(),
            frontend_dist_path: project_info.dist_path.clone(),
            backend_dist_path: project_info.backend_dist_path.clone(),
            web_project_path: project_info.web_project_path.clone(),
            wasm_project_path: project_info.wasm_project_path.clone(),
            cloudflare_project_path: project_info.cloudflare_project_path.clone(),
        }
    }

    fn web_project_wasm_frontend_path(&self) -> PathBuf {
        self.web_project_path.join("wasm")
    }

    fn web_project_wasm_backend_path(&self) -> PathBuf {
        self.web_project_path.join("wasm_backend")
    }
}

#[derive(Debug)]
pub enum Error {
    CreateDistDir(io::Error),
    CreateWebWasmDir(io::Error),
    CargoBuild(exec::Error),
    WasmPack(exec::Error),
    CopyWasmToDist(fs_extra::error::Error),
    ReadBackendWasmGlue(io::Error),
    WriteBackendWasmGlue(io::Error),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> Result<(), fmt::Error> {
        match self {
            Error::CreateDistDir(err) => write!(f, "Failed to create the dist dir: {}", err),

            Error::CreateWebWasmDir(err) => {
                write!(f, "Failed to create the wasm dir in web project: {}", err)
            }

            Error::CargoBuild(err) => write!(f, "cargo build failed: {}", err),

            Error::WasmPack(err) => write!(f, "wasm-pack failed: {}", err),

            Error::CopyWasmToDist(err) => write!(f, "Failed to copy wasm dir to dist: {}", err),

            Error::ReadBackendWasmGlue(err) => {
                write!(f, "Failed to read backend wasm glue: {}", err)
            }

            Error::WriteBackendWasmGlue(err) => {
                write!(f, "Failed to write backend wasm glue: {}", err)
            }
        }
    }
}

#[derive(Debug, Clone)]
pub struct RustBuilder {
    config: Config,
}

impl RustBuilder {
    pub fn new(config: Config) -> Self {
        Self { config: config }
    }

    fn build_dev(&self) -> Result<(), Error> {
        self.prepare_dirs()?;

        exec::run(&exec::Config {
            work_dir: ".".into(),
            cmd: "cargo".into(),
            args: exec::to_args(&["build", "--color", "always"]),
        })
        .map_err(Error::CargoBuild)?;

        exec::run(&exec::Config {
            work_dir: self.config.wasm_project_path.clone(),
            cmd: "wasm-pack".into(),
            args: exec::to_args(&[
                "build",
                "--dev",
                "--no-opt",
                "--target",
                "web",
                "--out-name",
                &self.config.project_name,
                "--out-dir",
                &self
                    .config
                    .web_project_wasm_frontend_path()
                    .to_string_lossy(),
            ]),
        })
        .map_err(Error::WasmPack)?;

        self.copy_wasm_to_frontend_dist()?;

        exec::run(&exec::Config {
            work_dir: self.config.wasm_project_path.clone(),
            cmd: "wasm-pack".into(),
            args: exec::to_args(&[
                "build",
                "--dev",
                "--no-opt",
                "--target",
                "nodejs",
                "--out-name",
                &self.config.project_name,
                "--out-dir",
                &self
                    .config
                    .web_project_wasm_backend_path()
                    .to_string_lossy(),
            ]),
        })
        .map_err(Error::WasmPack)?;

        self.patch_backend_wasm_glue()?;
        self.copy_wasm_to_backend_dist()?;

        Ok(())
    }

    fn build_release(&self) -> Result<(), Error> {
        self.prepare_dirs()?;

        exec::run(&exec::Config {
            work_dir: ".".into(),
            cmd: "cargo".into(),
            args: exec::to_args(&["build", "--release", "--color", "always"]),
        })
        .map_err(Error::CargoBuild)?;

        exec::run(&exec::Config {
            work_dir: self.config.wasm_project_path.clone(),
            cmd: "wasm-pack".into(),
            args: exec::to_args(&[
                "build",
                "--release",
                "--target",
                "web",
                "--out-name",
                &self.config.project_name,
                "--out-dir",
                &self
                    .config
                    .web_project_wasm_frontend_path()
                    .to_string_lossy(),
            ]),
        })
        .map_err(Error::WasmPack)?;

        self.copy_wasm_to_frontend_dist()?;

        exec::run(&exec::Config {
            work_dir: self.config.wasm_project_path.clone(),
            cmd: "wasm-pack".into(),
            args: exec::to_args(&[
                "build",
                "--release",
                "--target",
                "nodejs",
                "--out-name",
                &self.config.project_name,
                "--out-dir",
                &self
                    .config
                    .web_project_wasm_backend_path()
                    .to_string_lossy(),
            ]),
        })
        .map_err(Error::WasmPack)?;

        self.patch_backend_wasm_glue()?;
        self.copy_wasm_to_backend_dist()?;

        Ok(())
    }

    fn prepare_dirs(&self) -> Result<(), Error> {
        fs::create_dir_all(&self.config.frontend_dist_path).map_err(Error::CreateDistDir)?;
        fs::create_dir_all(&self.config.backend_dist_path).map_err(Error::CreateDistDir)?;
        fs::create_dir_all(&self.config.web_project_wasm_frontend_path())
            .map_err(Error::CreateWebWasmDir)?;
        fs::create_dir_all(&self.config.web_project_wasm_backend_path())
            .map_err(Error::CreateWebWasmDir)?;

        Ok(())
    }

    fn copy_wasm_to_frontend_dist(&self) -> Result<(), Error> {
        fs_extra::dir::copy(
            &self.config.web_project_wasm_frontend_path(),
            &self.config.frontend_dist_path,
            &fs_extra::dir::CopyOptions {
                overwrite: true,
                ..fs_extra::dir::CopyOptions::default()
            },
        )
        .map_err(Error::CopyWasmToDist)?;

        Ok(())
    }

    fn copy_wasm_to_backend_dist(&self) -> Result<(), Error> {
        fs_extra::dir::copy(
            &self.config.web_project_wasm_backend_path(),
            &self.config.backend_dist_path,
            &fs_extra::dir::CopyOptions {
                overwrite: true,
                ..fs_extra::dir::CopyOptions::default()
            },
        )
        .map_err(Error::CopyWasmToDist)?;

        Ok(())
    }

    fn patch_backend_wasm_glue(&self) -> Result<(), Error> {
        let filename = format!("{}.js", &self.config.project_name);
        let file_path = self.config.web_project_wasm_backend_path().join(&filename);
        let content = fs::read_to_string(&file_path).map_err(Error::ReadBackendWasmGlue)?;

        let new_content = content
            .replace("const { TextDecoder, TextEncoder } = require(`util`);", "")
            .replace("const { TextEncoder, TextDecoder } = require(`util`);", "")
            .replace("const bytes = require('fs').readFileSync(path);", "")
            .replace("const wasmModule = new WebAssembly.Module(bytes);", "")
            .replace(
                &format!(
                    "const path = require('path').join(__dirname, '{}_bg.wasm');",
                    self.config.project_name
                ),
                &format!(
                    "import wasmModule from \"./{}_bg.wasm\";",
                    self.config.project_name
                ),
            );

        fs::write(&file_path, new_content).map_err(Error::WriteBackendWasmGlue)?;

        Ok(())
    }
}

impl Runner<Error> for RustBuilder {
    fn run(&self) -> Result<(), Error> {
        match &self.config.env {
            Env::Dev => self.build_dev(),
            Env::Release => self.build_release(),
        }
    }
}
