use std::{fs, io, path::PathBuf};

use crate::project_info::ProjectInfo;

#[derive(Debug, Clone)]
pub struct Config {
    pub dist_path: PathBuf,
    pub web_project_path: PathBuf,
}

impl Config {
    pub fn from_project_info(project_info: &ProjectInfo) -> Self {
        Self {
            dist_path: project_info.dist_path.clone(),
            web_project_path: project_info.web_project_path.clone(),
        }
    }

    fn web_project_wasm_path(&self) -> PathBuf {
        self.web_project_path.join("wasm")
    }
}

#[derive(Debug)]
pub enum Error {
    CreateDistDir(io::Error),
    CreateWebWasmDir(io::Error),
}

pub struct Cleaner {
    config: Config,
}

impl Cleaner {
    pub fn new(config: Config) -> Self {
        Self { config }
    }

    pub fn run(&self) -> Result<(), Error> {
        let _ = fs::remove_dir_all(&self.config.dist_path);
        fs::create_dir_all(&self.config.dist_path).map_err(Error::CreateDistDir)?;

        let web_project_wasm_path = self.config.web_project_wasm_path();
        let _ = fs::remove_dir_all(&web_project_wasm_path);
        fs::create_dir_all(&web_project_wasm_path).map_err(Error::CreateWebWasmDir)?;

        Ok(())
    }
}
