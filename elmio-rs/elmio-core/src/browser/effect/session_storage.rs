use crate::browser;
use crate::browser::effect::effectful_msg::effectful_msg;
use crate::browser::effect::Effect;
use crate::browser::value::Capture;
use crate::browser::value::Value;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", content = "config")]
#[serde(rename_all = "camelCase")]
pub enum SessionStorage {
    GetItem { key: String },
    SetItem { key: String, value: Value },
}

pub fn get_item<Msg, ToMsg, T>(key: &str, to_msg: ToMsg) -> Effect<Msg>
where
    ToMsg: Fn(Capture<T>) -> Msg,
    T: Default,
{
    let msg = to_msg(Default::default());
    let effect = Effect::SessionStorage(SessionStorage::GetItem {
        key: key.to_string(),
    });

    effectful_msg(msg, effect)
}

pub fn set_item<Msg, V, ToMsg>(key: &str, value: V, to_msg: ToMsg) -> Effect<Msg>
where
    V: serde::Serialize,
    ToMsg: Fn(Capture<bool>) -> Msg,
{
    let effect = Effect::SessionStorage(SessionStorage::SetItem {
        key: key.to_string(),
        value: browser::value::to_value(value),
    });

    let msg = to_msg(Default::default());
    effectful_msg(msg, effect)
}
