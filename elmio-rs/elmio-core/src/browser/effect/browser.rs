use std::time::Duration;

use crate::browser::effect::effectful_msg::effectful_msg;
use crate::browser::effect::Effect;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", content = "config")]
#[serde(rename_all = "camelCase")]
pub enum Browser {
    #[serde(rename_all = "camelCase")]
    SetTimeout { duration: u64 },
}

pub fn set_timeout<Msg>(duration: Duration, msg: Msg) -> Effect<Msg> {
    let effect = Effect::Browser(Browser::SetTimeout {
        duration: duration.as_millis() as u64,
    });

    effectful_msg(msg, effect)
}
