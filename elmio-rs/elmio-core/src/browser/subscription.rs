pub mod event_listener;
pub mod interval;

use crate::browser::effect::Effect;
use crate::browser::subscription::event_listener::EventListener;
use crate::browser::subscription::interval::Interval;

#[derive(Clone, serde::Serialize)]
#[serde(tag = "type", content = "config")]
#[serde(rename_all = "camelCase")]
pub enum Subscription<Msg> {
    None,
    EventListener(EventListener<Msg>),
    Interval(Interval<Msg>),
    Batch(Vec<Subscription<Msg>>),
}

impl<Msg> Subscription<Msg> {
    pub fn into_vec(self) -> Vec<Subscription<Msg>> {
        match self {
            Subscription::Batch(subscriptions) => {
                subscriptions.into_iter().flat_map(Self::into_vec).collect()
            }

            _ => vec![self],
        }
    }
}

pub fn none<Msg>() -> Subscription<Msg> {
    Subscription::None
}

pub fn batch<Msg>(subscriptions: Vec<Subscription<Msg>>) -> Subscription<Msg> {
    Subscription::Batch(subscriptions)
}

#[derive(Clone, serde::Serialize)]
#[serde(tag = "type", content = "config")]
#[serde(rename_all = "camelCase")]
pub enum SubscriptionMsg<Msg> {
    Pure(Msg),
    Effectful { msg: Msg, effect: Effect<Msg> },
}

impl<Msg> SubscriptionMsg<Msg> {
    pub fn pure(msg: Msg) -> SubscriptionMsg<Msg> {
        SubscriptionMsg::Pure(msg)
    }

    pub fn effectful<ToMsg, T>(to_msg: ToMsg, effect: Effect<Msg>) -> SubscriptionMsg<Msg>
    where
        ToMsg: Fn(T) -> Msg,
        T: Default,
    {
        SubscriptionMsg::Effectful {
            msg: to_msg(T::default()),
            effect,
        }
    }
}
