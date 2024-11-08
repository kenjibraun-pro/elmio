use serde::Deserialize;
use serde::Serialize;
use std::fmt;
use std::str::FromStr;

#[derive(Clone)]
pub enum Key {
    Any,
    Escape,
    Enter,
    Key(String),
}

impl Serialize for Key {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl<'de> Deserialize<'de> for Key {
    fn deserialize<D>(deserializer: D) -> Result<Key, D::Error>
    where
        D: serde::de::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Key::from_str(&s).map_err(serde::de::Error::custom)
    }
}

impl fmt::Display for Key {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Key::Any => write!(f, "any"),
            Key::Escape => write!(f, "escape"),
            Key::Enter => write!(f, "enter"),
            Key::Key(key) => write!(f, "{}", key),
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
pub struct ParseKeyError;

impl fmt::Display for ParseKeyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "unsupported key")
    }
}

impl FromStr for Key {
    type Err = ParseKeyError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(match s {
            "any" => Key::Any,
            "escape" => Key::Escape,
            "enter" => Key::Enter,
            _ => Key::Key(s.to_string()),
        })
    }
}
