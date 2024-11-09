use crate::browser::effect::effectful_msg::effectful_msg;
use crate::browser::effect::Effect;
use crate::browser::value::Capture;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", content = "config")]
#[serde(rename_all = "camelCase")]
pub enum Clipboard {
    #[serde(rename_all = "camelCase")]
    WriteText { text: String },
}

pub fn write_text<Msg, ToMsg>(s: &str, to_msg: ToMsg) -> Effect<Msg>
where
    ToMsg: Fn(Capture<WriteTextResult>) -> Msg,
{
    let effect = Effect::Clipboard(Clipboard::WriteText {
        text: s.to_string(),
    });

    let msg = to_msg(Default::default());

    effectful_msg(msg, effect)
}

#[derive(Clone, Default, serde::Deserialize)]
pub struct WriteTextResult {
    pub success: bool,
    pub error: Option<String>,
}
