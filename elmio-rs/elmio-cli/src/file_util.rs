use std::{
    fs::{self, File},
    io::{self, Read, Write},
    path::PathBuf,
};

pub struct FileData {
    pub content: String,
    pub permissions: fs::Permissions,
}

type Result<T> = std::result::Result<T, io::Error>;

pub fn read(path: &PathBuf) -> Result<FileData> {
    let mut file = File::open(path)?;
    let metadata = file.metadata()?;
    let mut content = String::new();

    file.read_to_string(&mut content)?;

    Ok(FileData {
        content,
        permissions: metadata.permissions(),
    })
}

pub fn write(path: &PathBuf, file_data: FileData) -> Result<()> {
    let tmp_path = path.with_extension("tmp");

    // Make sure the file is closed before renaming (is this necessary?)
    {
        let mut tmp_file = File::create(&tmp_path)?;
        tmp_file.set_permissions(file_data.permissions)?;
        tmp_file.write_all(file_data.content.as_bytes())?;
    }

    fs::rename(&tmp_path, path)?;

    Ok(())
}
