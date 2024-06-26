use crate::db::{Folder, Video};
use chrono::{Datelike /* NaiveDate, Weekday */};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize, Default, FromRow, Debug)]
pub struct Stats {
    pub user_id: u16,
    pub total_anime: u32,
    pub total_videos: u32,
    pub videos_watched: u32,
    pub videos_remaining: u32,
    pub watchtime: u32,
}

#[derive(Serialize, Deserialize, Default, FromRow, Debug)]
pub struct Chart {
    pub user_id: u16,
    pub watchtime: u32,
    pub updated_at: String,
}

pub async fn create_new_stats(handle: AppHandle, user_id: u16) -> Option<Stats> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    let total_anime_vec: Vec<Folder> = sqlx::query_as("SELECT * FROM folder WHERE userId = ?")
        .bind(user_id)
        .fetch_all(&pool)
        .await
        .unwrap();

    let mut watchtime = 0;

    for folder in &total_anime_vec {
        read_anime_folder_dirs(folder.path.clone(), user_id, &pool).await;
        watchtime += folder.watchTime;
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

    //println!("new: {}", total_anime);

    // reset all the folders watch time since it will be added to the global watch time
    sqlx::query("UPDATE folder SET watchTime = 0 WHERE userId = ?")
        .bind(user_id)
        .execute(&pool)
        .await
        .unwrap();

    Some(Stats {
        user_id,
        total_anime,
        total_videos,
        videos_watched,
        videos_remaining,
        watchtime,
    })
}

#[tauri::command]
pub async fn update_global_stats(handle: AppHandle, user_id: u16) -> Stats {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let mut is_stale: bool = false;

    let old_stats: Stats = match sqlx::query_as("SELECT * FROM stats WHERE user_id = ?")
        .bind(user_id)
        .fetch_one(&pool)
        .await
    {
        Ok(stats) => stats,
        Err(err) => {
            println!("Err fetching old stats: {}", err);
            Stats::default()
        }
    };
    let mut new_stats = create_new_stats(handle, user_id).await.unwrap();

    let old_stats_vec = stats_to_vec(&old_stats);
    let mut new_stats_vec = stats_to_vec(&new_stats);

    // println!(
    //     "old t: {} | new t: {}",
    //     old_stats.watchtime, new_stats.watchtime
    // );

    new_stats.watchtime += old_stats.watchtime;
    let len = new_stats_vec.len() - 1;
    new_stats_vec[len] += old_stats.watchtime;

    for i in 0..old_stats_vec.len() {
        //println!("old: {} | new: {}", old_stats_vec[i], new_stats_vec[i]);
        if old_stats_vec[i] != new_stats_vec[i] {
            is_stale = true;
            break;
        }
    }

    if is_stale {
        sqlx::query(
            "INSERT OR REPLACE INTO stats 
        (
        user_id,
        total_anime, 
        total_videos, 
        videos_watched, 
        videos_remaining, 
        watchtime 
        )
        VALUES (
        ?, ?, ?, ?, ?, ?)",
        )
        .bind(user_id)
        .bind(new_stats.total_anime)
        .bind(new_stats.total_videos)
        .bind(new_stats.videos_watched)
        .bind(new_stats.videos_remaining)
        .bind(new_stats.watchtime)
        .execute(&pool)
        .await
        .unwrap();

        return new_stats;
    }

    old_stats
}

fn stats_to_vec(stats: &Stats) -> Vec<u32> {
    let vec: Vec<u32> = vec![
        stats.total_anime,
        stats.total_videos,
        stats.videos_watched,
        stats.videos_remaining,
        stats.watchtime,
    ];

    vec
}

async fn read_anime_folder_dirs(folder_path: String, user_id: u16, pool: &SqlitePool) {
    let vid_formats = [
        "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "vob", "ogv", "ogg", "drc", "gif",
        "gifv", "mng", "avi", "mov", "qt", "wmv", "yuv", "rm", "rmvb", "asf", "amv", "mp4", "m4p",
        "m4v", "mpg", "mp2", "mpeg", "mpe", "mpv", "mpg", "mpeg", "m2v", "m4v", "svi", "3gp",
        "3g2", "mxf", "roq", "nsv", "flv", "f4v", "f4p", "f4a", "f4b",
    ];

    // read it's video files

    if let Ok(parent) = std::fs::read_dir(folder_path) {
        for file in parent {
            let entry = file.unwrap();
            let file_name = entry.file_name();
            let path = entry.path();

            if path.is_dir() {
                let path_str = path.to_str().unwrap().to_string();
                let pool_clone = pool.clone();
                Box::pin(read_anime_folder_dirs(path_str, user_id, &pool_clone)).await;
            } else if path.is_file() {
                for format in &vid_formats {
                    if file_name.to_str().unwrap().contains(format) {
                        let path_str = path.to_str().unwrap().to_string();
                        insert_or_ignore_vid(&path_str, user_id, pool).await;
                    }
                }
            }
        }
    }
}

async fn insert_or_ignore_vid(video_path: &str, user_id: u16, pool: &SqlitePool) {
    //println!("Inserting {}", video_path);

    sqlx::query("INSERT OR IGNORE INTO video (path, userId, watched, lastWatchedAt) VALUES (?, ?, ?, (datetime('now', 'localtime')))")
        .bind(video_path)
        .bind(user_id)
        .bind(false)
        .execute(&pool.clone())
        .await
        .unwrap();
}

#[tauri::command]
pub async fn create_chart_stats(
    range: String,
    days_in_month: Option<u8>,
    user_id: u16,
    handle: AppHandle,
) -> Vec<f32> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    //let mut updated_this_week: Vec<Chart> = Vec::new();
    let mut final_data: Vec<f32> = Vec::new();

    let today = chrono::Local::now().naive_local().date();
    let current_year = chrono::Local::now().year();
    let current_month = today.month0();

    if range == "daily" {
        final_data = vec![0.0; 7];
    } else if range == "weekly" {
        final_data = vec![0.0; days_in_month.unwrap() as usize - 1];
    } else if range == "monthly" {
        final_data = vec![0.0; 11];
    }

    {
        let data: Vec<Chart> =
            sqlx::query_as("SELECT * FROM chart WHERE user_id = ? ORDER BY updated_at DESC")
                .bind(user_id)
                .fetch_all(&pool)
                .await
                .unwrap();

        for entry in data {
            let last_watched_at =
                chrono::NaiveDate::parse_from_str(&entry.updated_at, "%Y-%m-%d").unwrap();

            if range == "daily" {
                let week = today.week(chrono::Weekday::Mon);
                let days = week.days();

                if days.contains(&last_watched_at) {
                    let weekday_index = last_watched_at.weekday().num_days_from_sunday();
                    //println!("{}", weekday_index);
                    final_data[weekday_index as usize] =
                        ((entry.watchtime as f32 / 3600.0) * 100.0).round() / 100.0;
                }
            }

            if range == "weekly" {
                let split_date: Vec<&str> = entry.updated_at.split('-').collect();
                let mut _month: u8 = 0;

                {
                    let split_month: Vec<&str> = split_date[1]
                        .split("")
                        .filter(|str| !str.is_empty())
                        .collect();
                    if split_month[0] == "0" {
                        _month = split_month[1].parse().unwrap();
                    } else {
                        _month = split_date[1].parse().unwrap();
                    }
                }

                if current_month as u8 + 1 == _month {
                    let mut _day: usize = 0;

                    let split_day: Vec<&str> = split_date[2]
                        .split("")
                        .filter(|str| !str.is_empty())
                        .collect();
                    if split_day[0] == "0" {
                        _day = split_day[1].parse().unwrap();
                    } else {
                        _day = split_date[2].parse().unwrap();
                    }

                    final_data[_day - 1] =
                        ((entry.watchtime as f32 / 3600.0) * 100.0).round() / 100.0;
                }
            }

            if range == "monthly" && last_watched_at.year() == current_year {
                let split_date: Vec<&str> = entry.updated_at.split('-').collect();
                let mut _month: u8 = 0;

                {
                    let split_month: Vec<&str> = split_date[1]
                        .split("")
                        .filter(|str| !str.is_empty())
                        .collect();
                    if split_month[0] == "0" {
                        _month = split_month[1].parse().unwrap();
                    } else {
                        _month = split_date[1].parse().unwrap();
                    }
                }

                final_data[_month as usize - 1] +=
                    ((entry.watchtime as f32 / 3600.0) * 100.0).round() / 100.0
            }
        }
    }

    final_data
}
