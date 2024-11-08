use std::fmt;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Button {
    Main,
    Auxiliary,
    Secondary,
    Fourth,
    Fifth,
}

impl fmt::Display for Button {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Button::Main => write!(f, "main"),
            Button::Auxiliary => write!(f, "auxiliary"),
            Button::Secondary => write!(f, "secondary"),
            Button::Fourth => write!(f, "fourth"),
            Button::Fifth => write!(f, "fifth"),
        }
    }
}
