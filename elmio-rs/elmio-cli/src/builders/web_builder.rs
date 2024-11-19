use std::{fmt, path::PathBuf};

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
    pub web_project_path: PathBuf,
}

impl Config {
    pub fn from_project_info(env: &Env, project_info: &ProjectInfo) -> Self {
        Self {
            env: env.clone(),
            web_project_path: project_info.web_project_path.clone(),
        }
    }
}

#[derive(Debug)]
pub enum Error {
    NpmInstall(exec::Error),
    NpmBuildDev(exec::Error),
    NpmBuildRelease(exec::Error),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> Result<(), fmt::Error> {
        match self {
            Error::NpmInstall(err) => write!(f, "'npm install' failed: {}", err),
            Error::NpmBuildDev(err) => write!(f, "'npm run build-dev' failed: {}", err),
            Error::NpmBuildRelease(err) => write!(f, "'npm run build-release' failed: {}", err),
        }
    }
}

#[derive(Debug, Clone)]
pub struct WebBuilder {
    config: Config,
}

impl WebBuilder {
    pub fn new(config: Config) -> Self {
        Self { config }
    }

    fn build_dev(&self) -> Result<(), Error> {
        self.npm_install()?;

        exec::run(&exec::Config {
            work_dir: self.config.web_project_path.clone(),
            cmd: "npm".into(),
            args: exec::to_args(&["run", "build-dev"]),
        })
        .map_err(Error::NpmBuildDev)?;

        Ok(())
    }

    fn build_release(&self) -> Result<(), Error> {
        self.npm_install()?;

        exec::run(&exec::Config {
            work_dir: self.config.web_project_path.clone(),
            cmd: "npm".into(),
            args: exec::to_args(&["run", "build-release"]),
        })
        .map_err(Error::NpmBuildRelease)?;

        Ok(())
    }

    fn npm_install(&self) -> Result<(), Error> {
        exec::run(&exec::Config {
            work_dir: self.config.web_project_path.clone(),
            cmd: "npm".into(),
            args: exec::to_args(&["install"]),
        })
        .map_err(Error::NpmInstall)?;

        Ok(())
    }
}

impl Runner<Error> for WebBuilder {
    fn run(&self) -> Result<(), Error> {
        match &self.config.env {
            Env::Dev => self.build_dev(),
            Env::Release => self.build_release(),
        }
    }
}
