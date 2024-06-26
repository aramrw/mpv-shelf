use random_color::{Luminosity, RandomColor};
use regex::Regex;
use sqlx::SqlitePool;
use std::fs::{self};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::mpsc;
use std::u32;
use tauri::api::dialog;
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

use crate::db::{Folder, Settings, Video};
//use crate::mpv::update_chart_watchtime;
use crate::stats::{Chart, Stats};
use crate::{errors, Global, User};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupData {
    pub chart: Chart,
    pub folders: Vec<Folder>,
    pub global: Global,
    pub settings: Settings,
    pub stats: Stats,
    pub user: User,
    pub videos: Vec<Video>,
}

async fn combine_data_structs(
    pool: &SqlitePool,
    user_id: &u32,
) -> Result<BackupData, errors::BackupDataErrors> {
    let chart: Chart = sqlx::query_as("SELECT * FROM chart WHERE user_id = ?")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    let folders: Vec<Folder> = sqlx::query_as("SELECT * FROM folder WHERE userId = ?")
        .bind(user_id)
        .fetch_all(pool)
        .await?;

    let global: Global = sqlx::query_as("SELECT * FROM global WHERE userId = ?")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    let settings: Settings = sqlx::query_as("SELECT * FROM settings WHERE userId = ?")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    let stats: Stats = sqlx::query_as("SELECT * FROM stats WHERE user_id = ?")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    let user: User = sqlx::query_as("SELECT * FROM user WHERE id = ?")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    let videos: Vec<Video> = sqlx::query_as("SELECT * FROM video WHERE userId = ?")
        .bind(user_id)
        .fetch_all(pool)
        .await?;

    Ok(BackupData {
        chart,
        folders,
        global,
        settings,
        stats,
        user,
        videos,
    })
}

// Data
#[tauri::command]
pub async fn export_data(
    handle: AppHandle,
    user_id: u32,
) -> Result<Option<String>, errors::BackupDataErrors> {
    let (sender, receiver) = mpsc::channel();

    dialog::FileDialogBuilder::new().pick_folder(move |path: Option<PathBuf>| {
        let _ = sender.send(path);
    });

    // Wait for the folder selection
    let folder_path = receiver.recv()?;

    if let Some(path) = folder_path {
        let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

        let backup_data = combine_data_structs(&pool, &user_id).await?;

        let stats_json = serde_json::to_string_pretty(&backup_data)?;
        let file_name = format!(
            "{}\\{}{}_user{}_bdata.json",
            path.to_str().unwrap(),
            "mpv-shelf_v",
            handle.package_info().version,
            user_id,
        );
        fs::write(&file_name, stats_json)?;

        Ok(Some(format!("Data exported to: `{}`", file_name)))
    } else {
        // The user closed the dialog box without selecting a folder
        Ok(None)
    }
}

async fn insert_imported_bdata(
    pool: &SqlitePool,
    data: BackupData,
    user_id: u32,
) -> Result<(), errors::BackupDataErrors> {
    // Insert User
    sqlx::query("INSERT INTO user (id, pin, imagePath, color, scrollY) VALUES (?, ?, ?, ?, ?)")
        .bind(user_id)
        .bind(data.user.pin)
        .bind(data.user.imagePath)
        .bind(data.user.color)
        .bind(data.user.scrollY)
        .execute(pool)
        .await?;

    // Insert Videos
    for vid in data.videos {
        sqlx::query("INSERT INTO video (path, userId, watched, lastWatchedAt) VALUES (?, ?, ?, ?)")
            .bind(vid.path)
            .bind(user_id)
            .bind(vid.watched)
            .bind(vid.lastWatchedAt)
            .execute(pool)
            .await?;
    }

    // Insert Settings
    sqlx::query("INSERT INTO settings (userId, fontSize, animations, autoPlay, autoRename, usePin) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(user_id)
    .bind(data.settings.fontSize)
    .bind(data.settings.animations)
    .bind(data.settings.autoPlay)
    .bind(data.settings.autoRename)
    .bind(data.settings.usePin)
    .execute(pool)
    .await?;

    // Insert Folders

    for folder in data.folders {
        sqlx::query("INSERT INTO folder (userId, path, expanded, asChild, watchTime, scrollY, color) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(user_id)
    .bind(folder.path)
    .bind(folder.expanded)
    .bind(folder.asChild)
    .bind(folder.watchTime)
    .bind(folder.scrollY)
    .bind(folder.color)
    .execute(pool)
    .await?;
    }

    // Insert Stats
    sqlx::query("INSERT INTO stats (user_id, total_anime, total_videos, videos_watched, videos_remaining, watchtime) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(user_id)
    .bind(data.stats.total_anime)
    .bind(data.stats.total_videos)
    .bind(data.stats.videos_watched)
    .bind(data.stats.videos_remaining)
    .bind(data.stats.watchtime)
    .execute(pool)
    .await?;

    // Insert Chart
    sqlx::query("INSERT INTO chart (user_id, watchtime, updated_at) VALUES (?, ?, datetime('now', 'localtime'))")
        .bind(user_id)
        .bind(data.chart.watchtime)
        .execute(pool)
        .await?;

    // Insert Global
    sqlx::query("UPDATE global SET userId = ? WHERE id = ?")
        .bind(user_id)
        .bind(data.global.id)
        .execute(pool)
        .await?;

    Ok(())
}

// Subtitles
#[tauri::command]
pub async fn rename_subs(
    user_id: u32,
    sub_paths: String,
    vid_paths: String,
    folder_path: String,
    handle: AppHandle,
) {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    let sub_v: Vec<String> = serde_json::from_str(&sub_paths).unwrap();
    let vid_v: Vec<String> = serde_json::from_str(&vid_paths).unwrap();
    let folder_name = Path::new(&folder_path)
        .file_name()
        .unwrap()
        .to_str()
        .unwrap();

    let first_video_file_name = Path::new(&vid_v[0])
        .file_name()
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();

    let first_sub_file_name = Path::new(&sub_v[0])
        .file_name()
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();

    //println!("{}, {}", first_video_file_name, folder_name);

    if first_video_file_name.contains(folder_name) && first_sub_file_name.contains(folder_name) {
        //println!("{} and {} already have the correct name", first_video_file_name, first_sub_file_name);
        return;
    }

    //println!("{}", folder_path);

    for vid_path in vid_v {
        //println!("{}", vid);
        let video_file_name = Path::new(&vid_path)
            .file_name()
            .unwrap()
            .to_str()
            .unwrap()
            .to_string();
        let (_video_file_name, video_file_type) = video_file_name
            .rsplit_once('.')
            .map(|(name, file_type)| (name.to_string(), file_type.to_string()))
            .unwrap_or(("".to_string(), "".to_string()));
        let video_episode = extract_episode_number(&vid_path).unwrap();
        let new_video_path = format!(
            "{}\\{} - {}.{}",
            folder_path, folder_name, video_episode, video_file_type
        );
        //println!("{}", new_video_path);
        update_vid_data(&vid_path, &new_video_path, &user_id, &pool).await;
        fs::rename(vid_path, new_video_path).unwrap();
    }

    for sub_path in sub_v {
        let sub_file_name = Path::new(&sub_path)
            .file_name()
            .unwrap()
            .to_str()
            .unwrap()
            .to_string();
        let (_sub_file_name, sub_file_type) = sub_file_name
            .rsplit_once('.')
            .map(|(name, file_type)| (name.to_string(), file_type.to_string()))
            .unwrap_or(("".to_string(), "".to_string()));
        let subtitle_episode = extract_episode_number(&sub_path).unwrap();
        let new_subtitle_path = format!(
            "{}\\{} - {}.{}",
            folder_path, folder_name, subtitle_episode, sub_file_type
        );
        //println!("{}", new_subtitle_path);
        fs::rename(sub_path, new_subtitle_path).unwrap();
    }
}

// async fn if_watched(pool: &SqlitePool, path: &str) -> Result<bool, sqlx::Error> {
//     println!("{}", path);
//
//     let video: Video = sqlx::query_as("SELECT * FROM video WHERE path = ?")
//         .bind(path)
//         .fetch_one(pool)
//         .await?;
//
//     Ok(video.watched)
// }

async fn update_vid_data(old_path: &str, new_path: &str, user_id: &u32, pool: &SqlitePool) {
    //println!("Setting {} to {}", old_path, new_path);
    sqlx::query("UPDATE video SET path = ? WHERE userId = ? AND path = ?")
        .bind(new_path)
        .bind(user_id)
        .bind(old_path)
        .execute(pool)
        .await
        .unwrap();
}

pub fn extract_episode_number(title: &str) -> Option<u32> {
    let re = Regex::new(r"(\d+)\D*$").unwrap();
    re.captures_iter(title)
        .last()
        .and_then(|cap| cap.get(1).map(|m| m.as_str().parse::<u32>().ok()))
        .flatten()
}

#[tauri::command]
pub fn show_in_folder(path: String) {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(["/select,", &path]) // The comma after select is not a typo
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "linux")]
    {
        if path.contains(",") {
            // see https://gitlab.freedesktop.org/dbus/dbus/-/issues/76
            let new_path = match metadata(&path).unwrap().is_dir() {
                true => path,
                false => {
                    let mut path2 = PathBuf::from(path);
                    path2.pop();
                    path2.into_os_string().into_string().unwrap()
                }
            };
            Command::new("xdg-open").arg(&new_path).spawn().unwrap();
        } else {
            if let Ok(Fork::Child) = daemon(false, false) {
                Command::new("dbus-send")
                    .args([
                        "--session",
                        "--dest=org.freedesktop.FileManager1",
                        "--type=method_call",
                        "/org/freedesktop/FileManager1",
                        "org.freedesktop.FileManager1.ShowItems",
                        format!("array:string:\"file://{path}\"").as_str(),
                        "string:\"\"",
                    ])
                    .spawn()
                    .unwrap();
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open").args(["-R", &path]).spawn().unwrap();
    }
}

// Color Generation
#[tauri::command]
pub fn generate_random_color() -> String {
    let color = RandomColor::new()
        .luminosity(Luminosity::Light)
        .alpha(0.2)
        .to_hex()
        .to_string();
    color
}

#[tauri::command]
pub fn generate_random_mono_color() -> String {
    let color = RandomColor::new()
        .luminosity(Luminosity::Light)
        .alpha(1.2)
        .to_hex()
        .to_string();

    color
}
