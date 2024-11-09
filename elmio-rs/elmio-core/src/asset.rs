pub struct Asset {
    uri: String,
}

impl Asset {
    pub fn new(uri: &str) -> Self {
        Self {
            uri: uri.to_string(),
        }
    }

    pub fn uri(&self) -> String {
        self.uri.clone()
    }
}
