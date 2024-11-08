use std::{ops::Sub, time};

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, serde::Serialize, serde::Deserialize)]
pub struct Posix {
    milliseconds: i128,
}

impl Posix {
    /// Creates a new `Posix` instance from a number of milliseconds.
    pub fn from_millis(milliseconds: i128) -> Self {
        Self { milliseconds }
    }

    /// Returns the time value in milliseconds.
    pub fn as_millis(&self) -> i128 {
        self.milliseconds
    }

    /// Returns the time value in seconds.
    pub fn as_secs(&self) -> f64 {
        self.milliseconds as f64 / 1000.0
    }

    /// Converts the `Posix` time to a `time::SystemTime` instance.
    pub fn as_system_time(&self) -> time::SystemTime {
        time::UNIX_EPOCH + time::Duration::from_millis(self.milliseconds as u64)
    }
}

impl Sub for Posix {
    type Output = time::Duration;

    fn sub(self, rhs: Self) -> Self::Output {
        let diff = self.milliseconds - rhs.milliseconds;
        time::Duration::from_millis(diff.max(0) as u64)
    }
}
