pub mod dom_id;
pub mod effect;
pub mod event;
pub mod file;
pub mod keyboard;
pub mod mouse;
pub mod selector;
pub mod subscription;
pub mod value;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DebounceConfig {
    delay: u32,
    leading: bool,
    trailing: bool,
}

#[derive(Clone, Default, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowSize {
    pub width: u32,
    pub height: u32,
}
