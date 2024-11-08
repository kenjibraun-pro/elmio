use crate::browser::effect::Effect;
use crate::browser::subscription::Subscription;
use crate::browser::subscription::SubscriptionMsg;
use crate::browser::value::Capture;
use std::time::Duration;

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Interval<Msg> {
    id: String,
    duration: u64,
    msg: SubscriptionMsg<Msg>,
}

pub fn interval<Msg>(duration: Duration, msg: Msg) -> Subscription<Msg> {
    Subscription::Interval(Interval {
        id: format!("interval-{}", duration.as_millis()),
        duration: duration.as_millis() as u64,
        msg: SubscriptionMsg::pure(msg),
    })
}

pub fn interval_effect<Msg, ToMsg, T>(
    duration: Duration,
    to_msg: ToMsg,
    effect: Effect<Msg>,
) -> Subscription<Msg>
where
    ToMsg: Fn(Capture<T>) -> Msg,
    T: Default,
{
    Subscription::Interval(Interval {
        id: format!("interval-{}", duration.as_millis()),
        duration: duration.as_millis() as u64,
        msg: SubscriptionMsg::effectful(to_msg, effect),
    })
}
