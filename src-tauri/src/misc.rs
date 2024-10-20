use random_color::{Color, Luminosity, RandomColor};
use regex::Regex;
use sqlx::SqlitePool;
use std::fs::{self};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::mpsc;
use tauri::api::dialog;
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

use crate::db::{Folder, Settings, Video};
use crate::stats::{Chart, Stats};
use crate::{errors, Global, User};
use serde::{Deserialize, Serialize};

use std::sync::LazyLock;

pub static NUMBER_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    regex::Regex::new(
        r"(?i)(?:S\d{1,2}E|第|EP?|Episode|Ch|Chapter|Vol|Volume|#)?\s*(\d{1,3})(?:話|巻|章|節|[._\-\s]|$)",
    )
    .unwrap()
});

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupData {
    pub chart: Option<Chart>,
    pub folders: Vec<Folder>,
    pub global: Global,
    pub settings: Settings,
    pub stats: Option<Stats>,
    pub user: User,
    pub videos: Vec<Video>,
}

async fn combine_data_structs_for_export(
    pool: &SqlitePool,
    user_id: &u32,
) -> Result<BackupData, errors::BackupDataErrors> {
    // Optional Settings
    let chart: Option<Chart> = sqlx::query_as("SELECT * FROM chart WHERE user_id = ?")
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

    let folders: Vec<Folder> = sqlx::query_as("SELECT * FROM folder WHERE userId = ?")
        .bind(user_id)
        .fetch_all(pool)
        .await?;

    let stats: Option<Stats> = sqlx::query_as("SELECT * FROM stats WHERE user_id = ?")
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

    let videos: Vec<Video> = sqlx::query_as("SELECT * FROM video WHERE userId = ?")
        .bind(user_id)
        .fetch_all(pool)
        .await?;

    // Non-Optional Settings
    let global: Global = sqlx::query_as("SELECT * FROM global WHERE userId = ?")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    let settings: Settings = sqlx::query_as("SELECT * FROM settings WHERE userId = ?")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    let user: User = sqlx::query_as("SELECT * FROM user WHERE id = ?")
        .bind(user_id)
        .fetch_one(pool)
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

        let backup_data = combine_data_structs_for_export(&pool, &user_id).await?;

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

    if let Some(stats) = data.stats {
        // Insert Stats
        sqlx::query(
            "INSERT INTO stats 
            (user_id, total_anime, total_videos, videos_watched, videos_remaining, watchtime) 
            VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(user_id)
        .bind(stats.total_anime)
        .bind(stats.total_videos)
        .bind(stats.videos_watched)
        .bind(stats.videos_remaining)
        .bind(stats.watchtime)
        .execute(pool)
        .await?;
    }

    // Insert Settings
    // WHEN ADD A NEW SETTING:
    // update "INSERT INTO" keys
    // add a `?` to "VALUES" -> (...?, ?, ?)
    // .bind() the new setting from `data.settings.newSetting`
    sqlx::query(
        "INSERT INTO settings 
        (userId, fontSize, animations, autoPlay, autoRename, usePin) 
        VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(user_id)
    .bind(data.settings.fontSize)
    .bind(data.settings.animations)
    .bind(data.settings.autoPlay)
    .bind(data.settings.autoRename)
    .bind(data.settings.usePin)
    //.bind(data.settings.persistOnDelete)
    .execute(pool)
    .await?;

    // Insert Global
    sqlx::query("UPDATE global SET userId = ? WHERE id = ?")
        .bind(user_id)
        .bind(data.global.id)
        .execute(pool)
        .await?;

    if let Some(chart) = data.chart {
        // Insert Chart
        sqlx::query(
            "INSERT INTO chart 
            (user_id, watchtime, updated_at) 
            VALUES (?, ?, datetime('now', 'localtime'))",
        )
        .bind(user_id)
        .bind(chart.watchtime)
        .execute(pool)
        .await?;
    }

    // Insert Videos
    for vid in data.videos {
        sqlx::query(
            "INSERT INTO video 
                (path, userId, watched, lastWatchedAt) 
                VALUES (?, ?, ?, ?)",
        )
        .bind(vid.path)
        .bind(user_id)
        .bind(vid.watched)
        .bind(vid.lastWatchedAt)
        .execute(pool)
        .await?;
    }

    // Insert Folders
    for folder in data.folders {
        sqlx::query(
            "INSERT INTO folder 
                (userId, path, expanded, asChild, watchTime, scrollY, color) 
                VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
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

    Ok(())
}

#[tauri::command]
pub async fn delete_user(handle: AppHandle, user_id: u32) -> Result<(), errors::BackupDataErrors> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let tables_userId = vec!["settings", "video", "folder"]; // tables with 'userId'
    let tables_user_id = vec!["stats", "chart"]; // tables with 'user_id'

    for table in tables_userId {
        let query = format!("DELETE FROM {} WHERE userId = ?", table);
        sqlx::query(&query).bind(user_id).execute(&pool).await?;
    }

    for table in tables_user_id {
        let query = format!("DELETE FROM {} WHERE user_id = ?", table);
        sqlx::query(&query).bind(user_id).execute(&pool).await?;
    }

    sqlx::query("DELETE FROM user WHERE id = $1")
        .bind(user_id)
        .execute(&pool)
        .await?;

    sqlx::query("UPDATE global SET userId = -1")
        .execute(&pool)
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn import_data(
    handle: AppHandle,
    user_id: u32,
    color: String,
) -> Result<String, errors::BackupDataErrors> {
    let (sender, receiver) = mpsc::channel();

    dialog::FileDialogBuilder::new().pick_file(move |path: Option<PathBuf>| {
        let _ = sender.send(path);
    });

    // Wait for the folder selection
    let folder_path = receiver.recv()?;

    if let Some(path) = folder_path {
        let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
        let file = fs::read(&path)?;
        let mut backup_data: BackupData = serde_json::from_slice(&file)?;

        backup_data.user.color = Some(color);

        match sqlx::query("SELECT * FROM user WHERE id = ?")
            .bind(user_id)
            .fetch_one(&pool)
            .await
        {
            Ok(_) => {
                delete_user(handle, user_id).await?;
                insert_imported_bdata(&pool, backup_data, user_id).await?;
            }
            Err(_) => {
                insert_imported_bdata(&pool, backup_data, user_id).await?;
            }
        };

        Ok("Ok".to_string())
    } else {
        // The user closed the dialog box without selecting a folder
        Ok("Closed".to_string())
    }
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
    if sub_v.is_empty() {
        return;
    }
    let vid_v: Vec<String> = serde_json::from_str(&vid_paths).unwrap();
    let folder_name = Path::new(&folder_path)
        .file_name()
        .unwrap()
        .to_str()
        .unwrap();

    for vid_path in vid_v.iter() {
        let new_video_path = rename_file(vid_path, &folder_path, folder_name).unwrap();
        if let Some(new_video_path) = new_video_path {
            update_vid_data(vid_path, &new_video_path, &user_id, &pool).await;
            //println!("Updated Video: {new_video_path}");
        }
    }

    for sub_path in sub_v.iter() {
        rename_file(sub_path, &folder_path, folder_name).unwrap();
    }
}

fn rename_file(
    path: &str,
    folder_path: &str,
    folder_name: &str,
) -> Result<Option<String>, std::io::Error> {
    // Extract the filename
    let sub_file_name = Path::new(path).file_name().unwrap().to_str().unwrap();

    // Check if the filename already follows the renaming pattern
    if sub_file_name.starts_with(&format!("{folder_name} - E")) {
        // If the file is already renamed, skip further processing
        return Ok(None);
    }

    // Split the filename to get the name and extension
    let (sub_file_name, sub_file_type) = match sub_file_name.rsplit_once('.') {
        Some((vfn, vft)) => (vfn, vft),
        None => return Ok(None),
    };

    // Extract the episode number (or whatever number you're extracting)
    let extracted_number = match extract_episode_number(sub_file_name) {
        Some(en) => en,
        None => {
            println!("no number matched in: {sub_file_name}");
            return Ok(None);
        }
    };

    // Construct the new file path
    let new_subtitle_path = format!(
        "{}\\{} - E{}.{}",
        folder_path, folder_name, extracted_number, sub_file_type
    );

    // Perform the file rename operation
    fs::rename(path, new_subtitle_path.clone())?;
    Ok(Some(new_subtitle_path))
}

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
    NUMBER_REGEX
        .captures_iter(title)
        .next()
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
pub fn generate_random_color(hue: Option<String>) -> String {
    if let Some(hue) = hue {
        let hue: Color = match hue.as_str() {
            "red" => Color::Red,
            "orange" => Color::Orange,
            "yellow" => Color::Yellow,
            "green" => Color::Green,
            "blue" => Color::Blue,
            "purple" => Color::Purple,
            "pink" => Color::Pink,
            _ => Color::Monochrome,
        };

        return RandomColor::new()
            .hue(hue)
            .luminosity(Luminosity::Light)
            .alpha(1.2)
            .to_hex()
            .to_string();
    }

    let color = RandomColor::new()
        .luminosity(Luminosity::Light)
        .alpha(1.2)
        .to_hex()
        .to_string();
    color
}
