use elmio_core::{
    browser::{
        dom_id::DomId,
        effect::Effect,
        subscription::{event_listener::on_click, Subscription},
    },
    page::{self, Page, PageMarkup},
};
use maud::{html, Markup};
use serde::{Deserialize, Serialize};
use url::Url;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Model {
    pub count: isize,
}

pub struct HomePage {
    pub current_url: Url,
}

impl Page<Model, Msg, Markup> for HomePage {
    fn id(&self) -> &'static dyn DomId {
        &Id::CounterTailwind
    }

    fn init(&self) -> Result<(Model, Effect<Msg>), String> {
        let model = Model { count: 0 };

        Ok((model, Effect::None))
    }

    fn subscriptions(&self, _model: &Model) -> Subscription<Msg> {
        Subscription::Batch(vec![
            on_click(Id::Increment, Msg::Increment),
            on_click(Id::Decrement, Msg::Decrement),
        ])
    }

    fn update(&self, msg: &Msg, model: &mut Model) -> Result<Effect<Msg>, String> {
        match msg {
            Msg::Increment => {
                model.count += 1;
                Ok(Effect::None)
            }

            Msg::Decrement => {
                model.count -= 1;
                Ok(Effect::None)
            }
        }
    }

    fn view(&self, model: &Model) -> PageMarkup<Markup> {
        PageMarkup {
            head: view_head(),
            body: view_body(model),
        }
    }

    fn render(&self, markup: Markup) -> String {
        markup.into_string()
    }

    fn render_page(&self, markup: PageMarkup<Markup>) -> String {
        page::render_page_maud(markup)
    }
}

#[derive(strum_macros::Display, elmio_macro::DomId)]
#[strum(serialize_all = "kebab-case")]
enum Id {
    CounterTailwind,
    Increment,
    Decrement,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Msg {
    Increment,
    Decrement,
}

fn view_head() -> Markup {
    html! {
        title { "Elmio | Home Page" }
        meta name="viewport" content="width=device-width, initial-scale=1";
        link rel="stylesheet" href="/index.css";
        script defer type="module" src="/home_page.js" {}
    }
}

fn view_body(model: &Model) -> Markup {
    html! {
        div id=(Id::CounterTailwind) class="flex flex-col items-center justify-center min-h-dvh p-4" {
            h1 class="text-2xl font-bold text-blue-700 mb-4" { "⎈ Elmio" }
            p class="text-gray-600 mb-8" {
                "A lightweight PoC web framework for 🦀 rust. Loosely inspired by The Elm Architecture."
            }
            p class="text-gray-600 mb-8" {
                "This is a simple counter built with Elmio and Tailwind CSS."
            }
            div class="flex flex-row items-center space-x-4" {
                button id=(Id::Decrement)
                       class="w-28 text-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-all"
                       type="button" aria-label="Decrement count" {
                    "Decrement"
                }
                div class="text-center w-28 text-lg font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm" {
                    (model.count)
                }
                button id=(Id::Increment)
                       class="w-28 text-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-all"
                       type="button" aria-label="Increment count" autofocus {
                    "Increment"
                }
            }
        }
    }
}
