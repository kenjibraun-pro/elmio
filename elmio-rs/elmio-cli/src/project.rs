use std::{
    convert::identity,
    fs,
    io::{self, Cursor},
    path::{Path, PathBuf},
};

use convert_case::{Case, Casing};
use walkdir::WalkDir;

use crate::utils::{
    file_util,
    project_info::{self, ProjectInfo},
};

pub struct Config {
    pub name: String,
    pub template: Template,
    pub current_dir: PathBuf,
}

pub struct Project {
    config: Config,
}

#[derive(Debug)]
pub enum Error {
    InvalidProjectName,
    TempDir(io::Error),
    GetUrl(ureq::Error),
    ReadResponse(io::Error),
    ZipExtract(zip_extract::ZipExtractError),
    ReadFile(io::Error),
    WriteFile(io::Error),
    RenameDir(io::Error),
    CopyToDestination(fs_extra::error::Error),
    RenameTemplateDir(io::Error),
    TemplateProjectInfo(project_info::Error),
    ReadCoreHomePage(io::Error),
    WriteCoreHomePage(io::Error),
    ReadLibFile(io::Error),
}

impl Project {
    pub fn new(config: Config) -> Project {
        Project { config }
    }

    pub fn create(&self) -> Result<(), Error> {
        validate_name(&self.config.name)?;
        let temp_dir = tempfile::tempdir().map_err(Error::TempDir)?;
        let template_dir = self.prepare_template(&temp_dir)?;
        copy_to_dest(&self.config.name, &template_dir, &self.config.current_dir)?;

        Ok(())
    }

    pub fn add_page(&self, project_info: &ProjectInfo, name: &str) -> Result<(), Error> {
        let page_name = PageName::new(name);
        let template_page_name = self.config.template.info().default_page_name;
        let temp_dir = tempfile::tempdir().map_err(Error::TempDir)?;
        let template_dir = self.prepare_template(&temp_dir)?;
        let template_project_info =
            ProjectInfo::from_dir(&template_dir).map_err(Error::TemplateProjectInfo)?;

        // Add page to core project
        copy_page_template(
            &template_project_info.core_project_path,
            &template_page_name,
            &project_info.core_project_path,
            &page_name,
            "rs",
        )?;

        // Add page to core lib
        add_page_to_lib(&project_info.core_project_path, &page_name)?;

        // Add page to wasm project
        copy_page_template(
            &template_project_info.wasm_project_path,
            &template_page_name,
            &project_info.wasm_project_path,
            &page_name,
            "rs",
        )?;

        // Add page to wasm lib
        add_page_to_lib(&project_info.wasm_project_path, &page_name)?;

        // Add page to web project
        copy_page_template(
            &template_project_info.web_project_path,
            &template_page_name,
            &project_info.web_project_path,
            &page_name,
            "ts",
        )?;

        Ok(())
    }

    fn prepare_template(&self, temp_dir: &tempfile::TempDir) -> Result<PathBuf, Error> {
        let template_info = self.config.template.info();
        let temp_dir_path = temp_dir.path();
        let template_dir = temp_dir_path.join(&template_info.path);

        let bytes = download_file(&template_info)?;
        extract_zip(bytes, temp_dir_path)?;
        replace_placeholders(&self.config.name, &template_info, &template_dir)?;

        Ok(template_dir)
    }
}

struct Paths {
    files: Vec<PathBuf>,
    dirs: Vec<PathBuf>,
}

#[derive(Clone)]
pub enum Template {
    CounterTailwind,
    Custom(TemplateInfo),
}

#[derive(Clone)]
pub struct TemplateInfo {
    url: String,
    path: String,
    placeholder: String,
    default_page_name: PageName,
}

impl Template {
    pub fn info(&self) -> TemplateInfo {
        match self {
            Template::CounterTailwind => TemplateInfo {
                url: "https://github.com/xosnrdev/elmio-templates/archive/refs/heads/master.zip"
                    .to_string(),
                path: "counter-tailwind".to_string(),
                placeholder: "counterapp".to_string(),
                default_page_name: PageName::new("home_page"),
            },

            Template::Custom(info) => info.clone(),
        }
    }
}

fn download_file(template_info: &TemplateInfo) -> Result<Vec<u8>, Error> {
    let response = ureq::get(&template_info.url)
        .call()
        .map_err(Error::GetUrl)?;

    let mut buffer = Vec::new();

    response
        .into_reader()
        .read_to_end(&mut buffer)
        .map_err(Error::ReadResponse)?;

    Ok(buffer)
}

fn extract_zip(bytes: Vec<u8>, base_path: &Path) -> Result<(), Error> {
    let mut cursor = Cursor::new(bytes);
    zip_extract::extract(&mut cursor, base_path, true).map_err(Error::ZipExtract)?;

    Ok(())
}

fn replace_placeholders(
    project_name: &str,
    template_info: &TemplateInfo,
    template_dir: &PathBuf,
) -> Result<(), Error> {
    let paths = collect_dir_entries(template_dir);

    paths
        .files
        .iter()
        .map(|path| replace_placeholder_in_file(project_name, template_info, path))
        .collect::<Result<(), Error>>()?;

    paths
        .dirs
        .iter()
        .map(|path| replace_placeholder_in_dir(project_name, template_info, path))
        .collect::<Result<(), Error>>()?;

    Ok(())
}

fn collect_dir_entries(template_dir: &PathBuf) -> Paths {
    let entries = WalkDir::new(template_dir)
        .into_iter()
        .filter_map(|entry| match entry {
            Ok(entry) => Some(entry),

            Err(err) => {
                eprintln!("Warning: Can't access file: {}", err);
                None
            }
        });

    let mut files: Vec<PathBuf> = Vec::new();
    let mut dirs: Vec<PathBuf> = Vec::new();

    for entry in entries {
        let file_type = entry.file_type();

        if file_type.is_file() {
            files.push(entry.path().to_path_buf());
        } else if file_type.is_dir() {
            dirs.push(entry.path().to_path_buf());
        }
    }

    Paths { files, dirs }
}

fn replace_placeholder_in_file(
    project_name: &str,
    template_info: &TemplateInfo,
    file_path: &PathBuf,
) -> Result<(), Error> {
    println!(
        "Replacing placeholder: {} -> {} in {}",
        template_info.placeholder,
        project_name,
        file_path.display()
    );

    let old_file = file_util::read(file_path).map_err(Error::ReadFile)?;

    let new_content = old_file
        .content
        .replace(&template_info.placeholder, &project_name);

    let new_file = file_util::FileData {
        content: new_content,
        permissions: old_file.permissions,
    };

    file_util::write(&file_path, new_file).map_err(Error::WriteFile)?;

    Ok(())
}

fn replace_placeholder_in_dir(
    project_name: &str,
    template_info: &TemplateInfo,
    dir_path: &PathBuf,
) -> Result<(), Error> {
    let dir_name = dir_path.file_name().and_then(|name| name.to_str());

    if let Some(old_dir_name) = dir_name {
        let new_dir_name = old_dir_name.replace(&template_info.placeholder, &project_name);
        let new_dir_path = dir_path.with_file_name(&new_dir_name);

        if new_dir_name != old_dir_name {
            println!(
                "Renaming {} -> {}",
                dir_path.display(),
                new_dir_path.display()
            );
            fs::rename(dir_path, new_dir_path).map_err(Error::RenameDir)?;
        }
    }

    Ok(())
}

fn copy_to_dest(project_name: &str, template_dir: &PathBuf, dest: &PathBuf) -> Result<(), Error> {
    let tmp_project_path = template_dir.with_file_name(project_name);
    fs::rename(&template_dir, &tmp_project_path).map_err(Error::RenameTemplateDir)?;

    fs_extra::dir::copy(tmp_project_path, dest, &fs_extra::dir::CopyOptions::new())
        .map_err(Error::CopyToDestination)?;

    Ok(())
}

fn copy_page_template(
    template_base_path: &PathBuf,
    template_page_name: &PageName,
    base_path: &PathBuf,
    page_name: &PageName,
    file_ext: &str,
) -> Result<(), Error> {
    let rel_src_file_path = format!("src/{}.{}", template_page_name.snake_case(), file_ext);

    let template_home_page_path = template_base_path.join(&rel_src_file_path);

    let template_file =
        file_util::read(&template_home_page_path).map_err(Error::ReadCoreHomePage)?;

    let new_content = replace_page_name(&template_file.content, &template_page_name, &page_name);

    let page_file = file_util::FileData {
        content: new_content,
        permissions: template_file.permissions,
    };

    let new_file_name = format!("src/{}.{}", page_name.snake_case(), file_ext);
    let new_file_path = base_path.join(new_file_name);

    if new_file_path.exists() {
        println!("Skipping existing file: {}", new_file_path.display());
    } else {
        println!("Adding file: {}", new_file_path.display());
        file_util::write(&new_file_path, page_file).map_err(Error::WriteCoreHomePage)?;
    }

    Ok(())
}

fn add_page_to_lib(base_path: &PathBuf, page_name: &PageName) -> Result<(), Error> {
    let lib_path = base_path.join("src/lib.rs");
    let lib_file = file_util::read(&lib_path).map_err(Error::ReadLibFile)?;
    let page_module = format!("pub mod {};", page_name.snake_case());

    let mut new_content = lib_file.content;
    if !new_content.ends_with('\n') {
        new_content.push_str("\n");
    }

    if !new_content.contains(&page_module) {
        new_content.push_str(&page_module);
        new_content.push_str("\n");
    }

    file_util::write(
        &lib_path,
        file_util::FileData {
            content: new_content,
            permissions: lib_file.permissions,
        },
    )
    .map_err(Error::WriteFile)?;

    Ok(())
}

fn validate_name(name: &str) -> Result<(), Error> {
    let not_empty = !name.is_empty();
    let has_valid_chars = name.chars().all(|c| c.is_ascii_lowercase() || c == '_');
    let first_char_is_ascii = name
        .chars()
        .nth(0)
        .map(|c| c.is_ascii_lowercase())
        .unwrap_or(false);

    [not_empty, has_valid_chars, first_char_is_ascii]
        .into_iter()
        .all(identity)
        .then_some(())
        .ok_or(Error::InvalidProjectName)
}

fn replace_page_name(content: &str, from: &PageName, to: &PageName) -> String {
    content
        .replace(&from.snake_case(), &to.snake_case())
        .replace(&from.pascal_case(), &to.pascal_case())
        .replace(&from.camel_case(), &to.camel_case())
        .replace(&from.title_case(), &to.title_case())
}

#[derive(Debug, Clone)]
pub struct PageName(String);

impl PageName {
    pub fn new(name: &str) -> PageName {
        let mut snake_case_name = name.to_case(Case::Snake);

        if !snake_case_name.ends_with("page") {
            snake_case_name.push_str("_page");
        }

        PageName(snake_case_name)
    }

    pub fn snake_case(&self) -> String {
        self.0.clone()
    }

    pub fn pascal_case(&self) -> String {
        self.0.from_case(Case::Snake).to_case(Case::Pascal)
    }

    pub fn camel_case(&self) -> String {
        self.0.from_case(Case::Snake).to_case(Case::Camel)
    }

    pub fn title_case(&self) -> String {
        self.0.from_case(Case::Snake).to_case(Case::Title)
    }
}
