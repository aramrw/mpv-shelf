use crate::db::{Folder, Video};
use serde::{Deserialize, Serialize};
use sqlx::{Connection, SqlitePool};
use std::time::Duration;
use tauri::{AppHandle, Manager, Window};
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize)]
pub struct Stats {
    user_id: u16,
    total_anime: u32,
    total_videos: u32,
    videos_watched: u32,
    videos_remaining: u32,
    //watch_time: u32,
}

#[tauri::command]
pub async fn create_stats(handle: AppHandle, user_id: u16) -> Option<Stats> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    let total_anime_vec: Vec<Folder> = sqlx::query_as("SELECT * FROM folder WHERE userId = ?")
        .bind(user_id)
        .fetch_all(&pool)
        .await
        .unwrap();

    for folder in &total_anime_vec {
        read_anime_folder_dirs(folder.path.clone(), user_id, &pool).await;
    }

    let videos_vec: Vec<Video> = sqlx::query_as("SELECT * FROM video WHERE userId = ?")
        .bind(user_id)
        .fetch_all(&pool)
        .await
        .unwrap();

    let total_anime = total_anime_vec.len() as u32;
    let total_videos = videos_vec.len() as u32;
    let videos_watched = videos_vec.iter().filter(|vid| vid.watched).count() as u32;
    let videos_remaining = videos_vec.iter().filter(|vid| !vid.watched).count() as u32;

    Some(Stats {
        user_id,
        total_anime,
        total_videos,
        videos_watched,
        videos_remaining,
    })
}

