use crate::browser::effect::Effect;

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EffectfulMsg<Msg> {
    pub msg: Msg,
    pub effect: Effect<Msg>,
}

pub fn effectful_msg<Msg>(msg: Msg, effect: Effect<Msg>) -> Effect<Msg> {
    Effect::EffectfulMsg(Box::new(EffectfulMsg { msg, effect }))
}
