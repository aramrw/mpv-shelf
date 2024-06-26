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

