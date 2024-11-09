use crate::browser::effect::Effect;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", content = "config")]
#[serde(rename_all = "camelCase")]
pub enum Navigation {
    PushUrl(String),
    ReplaceUrl(String),
    SetLocation(String),
}

pub fn push_url<Msg>(url: &str) -> Effect<Msg> {
    Effect::Navigation(Navigation::PushUrl(url.to_string()))
}

pub fn replace_url<Msg>(url: &str) -> Effect<Msg> {
    Effect::Navigation(Navigation::ReplaceUrl(url.to_string()))
}

pub fn set_location<Msg>(url: &str) -> Effect<Msg> {
    Effect::Navigation(Navigation::SetLocation(url.to_string()))
}
