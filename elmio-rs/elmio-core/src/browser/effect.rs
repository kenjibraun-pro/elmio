pub mod browser;
pub mod clipboard;
pub mod console;
pub mod dom;
pub mod effectful_msg;
pub mod local_storage;
pub mod navigation;
pub mod session_storage;
pub mod time;

use crate::browser::effect::browser::Browser;
use crate::browser::effect::clipboard::Clipboard;
use crate::browser::effect::console::Console;
use crate::browser::effect::dom::Dom;
use crate::browser::effect::effectful_msg::EffectfulMsg;
use crate::browser::effect::local_storage::LocalStorage;
use crate::browser::effect::navigation::Navigation;
use crate::browser::effect::session_storage::SessionStorage;
use crate::browser::effect::time::Time;
use serde_json::json;

#[derive(Clone, serde::Serialize)]
#[serde(tag = "type", content = "config")]
#[serde(rename_all = "camelCase")]
pub enum Effect<Msg> {
    None,
    EffectfulMsg(Box<EffectfulMsg<Msg>>),
    Dom(Dom),
    Time(Time),
    Navigation(Navigation),
    LocalStorage(LocalStorage),
    SessionStorage(SessionStorage),
    Console(Console),
    Clipboard(Clipboard),
    Browser(Browser),
    Custom(serde_json::Value),
    Batch(Vec<Effect<Msg>>),
}

impl<Msg> Effect<Msg> {
    pub fn into_vec(self) -> Vec<Effect<Msg>> {
        match self {
            Effect::Batch(effects) => effects.into_iter().flat_map(Self::into_vec).collect(),

            _ => vec![self],
        }
    }
}

pub fn none<Msg>() -> Effect<Msg> {
    Effect::None
}

pub fn batch<Msg>(effects: Vec<Effect<Msg>>) -> Effect<Msg> {
    Effect::Batch(effects)
}

pub fn custom<Msg, CustomEffect>(effect: CustomEffect) -> Effect<Msg>
where
    CustomEffect: serde::Serialize,
{
    Effect::Custom(json!(effect))
}
