pub mod wasm;

use crate::browser::dom_id::DomId;
use crate::browser::effect;
use crate::browser::effect::Effect;
use crate::browser::subscription::Subscription;
use maud::html;

pub trait Page<Model, Msg, Markup> {
    fn id(&self) -> &'static dyn DomId;
    fn init(&self) -> Result<(Model, Effect<Msg>), String>;
    fn subscriptions(&self, model: &Model) -> Subscription<Msg>;
    fn update(&self, msg: &Msg, model: &mut Model) -> Result<Effect<Msg>, String>;
    fn update_from_js(&self, _msg: JsMsg, _model: &mut Model) -> Result<Effect<Msg>, String> {
        Ok(effect::none())
    }
    fn view(&self, model: &Model) -> PageMarkup<Markup>;
    fn render(&self, markup: Markup) -> String;
    fn render_page(&self, markup: PageMarkup<Markup>) -> String;
}

#[derive(Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsMsg {
    #[serde(rename = "type")]
    pub type_: String,
    pub data: serde_json::Value,
}

pub struct PageMarkup<Html> {
    pub head: Html,
    pub body: Html,
}

pub fn render_page_maud(markup: PageMarkup<maud::Markup>) -> String {
    (html! {
        (maud::DOCTYPE)
        html {
            head {
                meta charset="utf-8";
                (markup.head)
            }
            body {
                (markup.body)
            }
        }
    })
    .into_string()
}
