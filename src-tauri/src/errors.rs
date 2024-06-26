use serde::Serialize;
use std::sync::mpsc;

use thiserror::Error;

#[derive(Error, Debug)]
pub enum BackupDataErrors {
    // #[error("Err: Failed to Export Stats: {0}")]
    // Export(String),
    #[error("DB Err: {0}")]
    DB(#[from] sqlx::Error),
    #[error("JSON Err: {0}")]
    Json(#[from] serde_json::Error),
    #[error("IO Err: {0}")]
    Io(#[from] std::io::Error),
    #[error("Channel Err: {0}")]
    Channels(#[from] mpsc::RecvError),
}

impl Serialize for BackupDataErrors {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("StatErrors", 2)?;
        state.serialize_field("type", &format!("{:?}", self))?;
        state.serialize_field("message", &self.to_string())?;
        state.end()
    }
}
