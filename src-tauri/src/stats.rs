use crate::db::{Folder, Video};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize, Default, FromRow)]
pub struct Stats {
    user_id: u16,
    total_anime: u32,
    total_videos: u32,
    videos_watched: u32,
    videos_remaining: u32,
    watchtime: u32,
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
        },
    };
    let mut new_stats = create_new_stats(handle, user_id).await.unwrap();

    let old_stats_vec = stats_to_vec(&old_stats);
    let mut new_stats_vec = stats_to_vec(&new_stats);

    //println!("old t: {} | new t: {}", old_stats.watchtime, new_stats.watchtime);

    if old_stats.watchtime > new_stats.watchtime {
        new_stats.watchtime = old_stats.watchtime;
        let len = new_stats_vec.len() - 1;
        new_stats_vec[len] = old_stats.watchtime;
    }

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

    let parent = std::fs::read_dir(folder_path).unwrap();

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
