use std::{fmt, path::PathBuf};

use crate::{build::Env, exec};

#[derive(Debug)]
pub enum Error {
    Exec(exec::Error),
}

#[derive(Debug)]
pub enum Event {
    BeforeAssetHash,
    AfterAssetHash,
}

impl fmt::Display for Event {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Event::BeforeAssetHash => write!(f, "before_asset_hash"),
            Event::AfterAssetHash => write!(f, "after_asset_hash"),
        }
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> Result<(), fmt::Error> {
        match self {
            Error::Exec(err) => write!(f, "Script failed: {}", err),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ScriptRunner {
    script_path: PathBuf,
    env: Env,
}

impl ScriptRunner {
    pub fn new(script_path: PathBuf, env: &Env) -> Self {
        Self {
            script_path,
            env: env.clone(),
        }
    }

    pub fn run(&self, event: Event) -> Result<(), Error> {
        exec::run(&exec::Config {
            work_dir: ".".into(),
            cmd: self.script_path.to_string_lossy().into(),
            args: vec![self.env.to_string(), event.to_string()],
        })
        .map_err(Error::Exec)?;

        Ok(())
    }
}
