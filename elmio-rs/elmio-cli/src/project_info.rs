use std::{
    fs, io,
    path::{Path, PathBuf},
};

use serde::Deserialize;

#[derive(Debug)]
pub enum Error {
    CurrentDirNotAbsolute(PathBuf),
    NoProjectName,
    WebProjectNotFound(PathBuf),
    WasmProjectNotFound(PathBuf),
    ReadCargoWorkspace(io::Error),
    ParseCargoWorkspace(toml::de::Error),
}

#[derive(Debug, Clone)]
pub struct ProjectInfo {
    pub project_name: String,
    pub dist_path: PathBuf,
    pub web_project_path: PathBuf,
    pub core_project_path: PathBuf,
    pub wasm_project_path: PathBuf,
    pub cloudflare_project_path: PathBuf,
    pub backend_dist_path: PathBuf,
}

impl ProjectInfo {
    pub fn from_dir(current_dir: &PathBuf) -> Result<ProjectInfo, Error> {
        current_dir
            .is_absolute()
            .then_some(())
            .ok_or(Error::CurrentDirNotAbsolute(current_dir.clone()))?;

        let cargo_workspace = CargoWorkspaceConfig::from_cargo_toml(current_dir)?;
        let project_name = cargo_workspace.project_name().ok_or(Error::NoProjectName)?;
        let web_project_path = current_dir.join(format!("{}_web", project_name));
        let core_project_path = current_dir.join(format!("{}_core", project_name));
        let wasm_project_path = current_dir.join(format!("{}_wasm", project_name));
        let cloudflare_project_path = current_dir.join(format!("{}_cloudflare", project_name));
        let backend_dist_path = cloudflare_project_path.join("dist_backend");

        Path::new(&web_project_path)
            .exists()
            .then_some(())
            .ok_or(Error::WebProjectNotFound(web_project_path.clone()))?;

        Path::new(&wasm_project_path)
            .exists()
            .then_some(())
            .ok_or(Error::WasmProjectNotFound(wasm_project_path.clone()))?;

        Ok(ProjectInfo {
            project_name,
            dist_path: current_dir.join("dist"),
            web_project_path,
            core_project_path,
            wasm_project_path,
            cloudflare_project_path,
            backend_dist_path,
        })
    }

    pub fn core_project_path_src(&self) -> PathBuf {
        self.core_project_path.join("src")
    }

    pub fn web_project_path_src(&self) -> PathBuf {
        self.web_project_path.join("src")
    }

    pub fn web_project_path_css(&self) -> PathBuf {
        self.web_project_path.join("css")
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct CargoWorkspaceConfig {
    pub workspace: Workspace,
}

impl CargoWorkspaceConfig {
    pub fn from_cargo_toml(path: &PathBuf) -> Result<Self, Error> {
        let cargo_workspace_path = path.join("Cargo.toml");
        let cargo_workspace_toml =
            fs::read_to_string(cargo_workspace_path).map_err(Error::ReadCargoWorkspace)?;

        toml::from_str(&cargo_workspace_toml).map_err(Error::ParseCargoWorkspace)
    }

    pub fn project_name(&self) -> Option<String> {
        let core_member = self
            .workspace
            .members
            .iter()
            .find(|member| member.ends_with("_core"));

        core_member
            .and_then(|name| name.strip_suffix("_core"))
            .map(|name| name.to_string())
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct Workspace {
    pub members: Vec<String>,
}
