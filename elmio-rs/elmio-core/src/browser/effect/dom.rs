use crate::browser::dom_id::DomId;
use crate::browser::effect::Effect;
use crate::browser::event::EventTarget;
use crate::browser::selector::Selector;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", content = "config")]
#[serde(rename_all = "camelCase")]
pub enum Dom {
    #[serde(rename_all = "camelCase")]
    FocusElement {
        element_id: String,
    },
    #[serde(rename_all = "camelCase")]
    SelectInputText {
        element_id: String,
    },
    #[serde(rename_all = "camelCase")]
    GetElementValue {
        element_id: String,
        parse_as_json: bool,
    },
    #[serde(rename_all = "camelCase")]
    GetRadioGroupValue {
        selector: Selector,
        parse_as_json: bool,
    },
    #[serde(rename_all = "camelCase")]
    GetTargetDataValue {
        name: String,
        parse_as_json: bool,
    },
    #[serde(rename_all = "camelCase")]
    GetFiles {
        element_id: String,
    },
    GetWindowSize,
    #[serde(rename_all = "camelCase")]
    DispatchEvent {
        event_target: EventTarget,
        event_type: String,
        bubbles: bool,
        cancelable: bool,
    },
}

pub fn focus_element<Msg, Id>(id: Id) -> Effect<Msg>
where
    Id: DomId,
{
    Effect::Dom(Dom::FocusElement {
        element_id: id.to_string(),
    })
}

pub fn select_input_text<Msg, Id>(id: Id) -> Effect<Msg>
where
    Id: DomId,
{
    Effect::Dom(Dom::SelectInputText {
        element_id: id.to_string(),
    })
}

pub fn get_element_json_value<Msg, Id>(id: Id) -> Effect<Msg>
where
    Id: DomId,
{
    Effect::Dom(Dom::GetElementValue {
        element_id: id.to_string(),
        parse_as_json: true,
    })
}

pub fn get_element_string_value<Msg, Id>(id: Id) -> Effect<Msg>
where
    Id: DomId,
{
    Effect::Dom(Dom::GetElementValue {
        element_id: id.to_string(),
        parse_as_json: false,
    })
}

pub fn get_radio_group_json_value<Msg>(selector: &Selector) -> Effect<Msg> {
    Effect::Dom(Dom::GetRadioGroupValue {
        selector: selector.clone(),
        parse_as_json: true,
    })
}

pub fn get_radio_group_string_value<Msg>(selector: &Selector) -> Effect<Msg> {
    Effect::Dom(Dom::GetRadioGroupValue {
        selector: selector.clone(),
        parse_as_json: false,
    })
}

pub fn get_files<Msg, Id>(id: Id) -> Effect<Msg>
where
    Id: DomId,
{
    Effect::Dom(Dom::GetFiles {
        element_id: id.to_string(),
    })
}

pub fn get_target_data_string_value<Msg>(name: &str) -> Effect<Msg> {
    Effect::Dom(Dom::GetTargetDataValue {
        name: name.to_string(),
        parse_as_json: false,
    })
}

pub fn get_target_data_json_value<Msg>(name: &str) -> Effect<Msg> {
    Effect::Dom(Dom::GetTargetDataValue {
        name: name.to_string(),
        parse_as_json: true,
    })
}

pub fn window_size<Msg>() -> Effect<Msg> {
    Effect::Dom(Dom::GetWindowSize)
}

pub fn dispatch_window_event<Msg>(event_type: &str) -> Effect<Msg> {
    Effect::Dom(Dom::DispatchEvent {
        event_target: EventTarget::Window,
        event_type: event_type.to_string(),
        bubbles: false,
        cancelable: false,
    })
}

pub fn dispatch_document_event<Msg>(event_type: &str) -> Effect<Msg> {
    Effect::Dom(Dom::DispatchEvent {
        event_target: EventTarget::Document,
        event_type: event_type.to_string(),
        bubbles: false,
        cancelable: false,
    })
}

pub fn dispatch_element_event<Msg>(id: impl DomId, event_type: &str) -> Effect<Msg> {
    Effect::Dom(Dom::DispatchEvent {
        event_target: EventTarget::Element {
            element_id: id.to_string(),
        },
        event_type: event_type.to_string(),
        bubbles: false,
        cancelable: false,
    })
}
