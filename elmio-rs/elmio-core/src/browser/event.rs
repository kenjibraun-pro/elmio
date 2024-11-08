#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", content = "config")]
#[serde(rename_all = "camelCase")]
pub enum EventTarget {
    Window,
    Document,
    #[serde(rename_all = "camelCase")]
    Element {
        element_id: String,
    },
}
