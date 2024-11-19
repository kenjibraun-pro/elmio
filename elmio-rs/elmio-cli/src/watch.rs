use std::{
    io,
    path::{self, Path, PathBuf, StripPrefixError},
};

use fs_extra::file::read_to_string;
use gitignored::Gitignore;
use notify::{
    event::{CreateKind, DataChange, ModifyKind},
    Event, EventKind, RecursiveMode, Watcher,
};

use crate::backlog_builder::{self, BacklogBuilder, ChangeType};

#[derive(Debug, Clone)]
pub struct Config {
    pub current_dir: PathBuf,
    pub gitignore: Option<String>,
    pub builder: BacklogBuilder,
}

impl Config {
    pub fn new(current_dir: &Path, builder: BacklogBuilder) -> Self {
        Self {
            current_dir: current_dir.to_path_buf(),
            gitignore: read_to_string(".gitignore").ok(),
            builder,
        }
    }
}

#[derive(Debug)]
pub enum Error {
    Notify(notify::Error),
    IgnoredEvent(Event),
    EventFilePath(Event),
    RelativePath(StripPrefixError),
    IgnoredFileType(PathBuf),
}

pub fn watch(config: Config) {
    match _watch(config) {
        Ok(()) => {}
        Err(err) => {
            handle_error(err);
        }
    }
}

pub fn _watch(mut config: Config) -> Result<(), Error> {
    let mut watcher = notify::recommended_watcher(move |event_result| {
        match on_event(&mut config, event_result) {
            Ok(()) => {}
            Err(err) => handle_error(err),
        }
    })
    .map_err(|err| Error::Notify(err))?;

    watcher
        .watch(Path::new("."), RecursiveMode::Recursive)
        .map_err(|err| Error::Notify(err))?;

    loop {
        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
    }
}

fn on_event(config: &mut Config, event_result: Result<Event, notify::Error>) -> Result<(), Error> {
    let event = event_result.map_err(|err| Error::Notify(err))?;
    let file_path = filepath_from_event(&event)?;
    let rel_path = file_path
        .strip_prefix(&config.current_dir)
        .map_err(|err| Error::RelativePath(err))?;

    let change_type = classify_file(&config, rel_path)?;

    println!(
        "{:?} triggered by {}",
        change_type,
        rel_path.to_string_lossy().to_string()
    );

    if let Err(err) = config.builder.run(change_type) {
        backlog_builder::handle_error(err)
    }

    Ok(())
}

fn handle_error(err: Error) {
    match err {
        Error::Notify(err) => {
            eprintln!("Watcher error: {:?}", err);
        }

        Error::IgnoredEvent(_) => (),

        Error::EventFilePath(_) => {
            eprintln!("Failed to get path from event: {:?}", err);
        }

        Error::RelativePath(err) => {
            eprintln!("Failed to get relative path: {:?}", err);
        }

        Error::IgnoredFileType(_) => (),
    }
}

fn classify_file(config: &Config, path: &Path) -> Result<ChangeType, Error> {
    let extension = path.extension().unwrap_or_default();

    if is_ignored(config, path) {
        Err(Error::IgnoredFileType(path.to_path_buf()))
    } else if extension == "rs" {
        Ok(ChangeType::Rust)
    } else if extension == "ts" {
        Ok(ChangeType::TypeScript)
    } else if extension == "css" {
        Ok(ChangeType::Css)
    } else {
        Err(Error::IgnoredFileType(path.to_path_buf()))
    }
}

fn is_ignored(config: &Config, path: &Path) -> bool {
    is_ignored_by_component(path) || is_ignored_by_git(config, path)
}

fn is_ignored_by_component(path: &Path) -> bool {
    path.components().any(|component| {
        component == path::Component::Normal("wasm".as_ref())
            || component == path::Component::Normal("wasm_backend".as_ref())
            || component == path::Component::Normal("dist".as_ref())
            || component == path::Component::Normal("dist_backend".as_ref())
            || component == path::Component::Normal("node_modules".as_ref())
            || component == path::Component::Normal("target".as_ref())
            || component.as_os_str().to_string_lossy().starts_with('.')
    })
}

fn is_ignored_by_git(config: &Config, path: &Path) -> bool {
    match &config.gitignore {
        Some(gitignore) => {
            let mut gi = Gitignore::new(&config.current_dir, false, false);
            let gitignore_lines: Vec<&str> = gitignore.lines().collect();
            gi.ignores(&gitignore_lines, gi.root.join(path))
        }

        None => false,
    }
}

fn filepath_from_event(event: &Event) -> Result<PathBuf, Error> {
    match &event.kind {
        EventKind::Create(create_kind) => match create_kind {
            CreateKind::File => {
                let path = event
                    .paths
                    .first()
                    .ok_or(Error::EventFilePath(event.clone()))?;

                Ok(path.clone())
            }

            _ => Err(Error::IgnoredEvent(event.clone())),
        },

        EventKind::Modify(modify_kind) => match modify_kind {
            ModifyKind::Data(data_change) => match data_change {
                DataChange::Content => {
                    let path = event
                        .paths
                        .first()
                        .ok_or(Error::EventFilePath(event.clone()))?;

                    Ok(path.clone())
                }

                _ => Err(Error::IgnoredEvent(event.clone())),
            },

            ModifyKind::Name(_) => {
                let path = event
                    .paths
                    .first()
                    .ok_or(Error::EventFilePath(event.clone()))?;

                Ok(path.clone())
            }

            _ => Err(Error::IgnoredEvent(event.clone())),
        },

        EventKind::Remove(_) => {
            let path = event
                .paths
                .first()
                .ok_or(Error::EventFilePath(event.clone()))?;

            Ok(path.clone())
        }

        _ => Err(Error::IgnoredEvent(event.clone())),
    }
}
