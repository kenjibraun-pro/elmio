use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt;

#[derive(Clone, Deserialize, Serialize)]
pub struct Value(serde_json::Value);

impl Value {
    pub fn parse<T>(&self) -> Result<T, serde_json::Error>
    where
        T: serde::de::DeserializeOwned,
    {
        serde_json::from_value(self.0.clone())
    }
}

impl Default for Value {
    fn default() -> Self {
        Value(serde_json::Value::Null)
    }
}

impl fmt::Display for Value {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

pub fn to_value<T>(value: T) -> Value
where
    T: Serialize,
{
    match serde_json::to_value(value) {
        Ok(json_value) => Value(json_value),

        Err(err) => Value(serde_json::Value::String(format!(
            "Failed to serialize value: {}",
            err
        ))),
    }
}

#[derive(Debug, Clone)]
pub struct Capture<T>(T);

impl<T: Clone> Capture<T> {
    pub fn into_value(self) -> T {
        self.0
    }

    pub fn value(&self) -> T {
        self.0.clone()
    }

    pub fn value_ref(&self) -> &T {
        &self.0
    }
}

impl<T: Default> Default for Capture<T> {
    fn default() -> Self {
        Capture(T::default())
    }
}

impl<T> Serialize for Capture<T> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str("$CAPTURE_VALUE")
    }
}

impl<'de, T: Deserialize<'de>> Deserialize<'de> for Capture<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        T::deserialize(deserializer).map(Capture)
    }
}
