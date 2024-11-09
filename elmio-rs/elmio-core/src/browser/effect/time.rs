use crate::browser::effect::Effect;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", content = "config")]
#[serde(rename_all = "camelCase")]
pub enum Time {
    CurrentTime,
}

pub fn current_time<Msg>() -> Effect<Msg> {
    Effect::Time(Time::CurrentTime)
}
