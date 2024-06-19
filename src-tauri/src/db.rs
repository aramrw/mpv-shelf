#![allow(non_snake_case, nonstandard_style)]
use sqlx::{migrate::MigrateDatabase, Sqlite, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(sqlx::FromRow)]
pub struct Video {
    pub id: u32,
    pub path: String,
    pub userId: u32,
    pub watched: bool,
    pub lastWatchedAt: String,
}

#[derive(sqlx::FromRow)]
pub struct Folder {
    pub id: u32,
    pub userId: u32,
    pub path: String,
    pub expanded: bool,
    pub asChild: bool,
    pub watchTime: u32,
    pub color: String,
}

pub fn create_database(handle: AppHandle) {
    let path = create_app_data_folder(&handle);

    tokio::task::block_in_place(move || {
        tauri::async_runtime::block_on(async move {
            println!("Creating database at {}", path);
            if !Sqlite::database_exists(&path).await.unwrap_or(false) {
                Sqlite::create_database(&path).await?;
            }

            let sqlite_pool = SqlitePool::connect_lazy(&path).unwrap();
            handle.manage(Mutex::new(sqlite_pool.clone()));

            migrate_users(&sqlite_pool).await.unwrap();
            migrate_folders(&sqlite_pool).await.unwrap();
            migrate_videos(&sqlite_pool).await.unwrap();
            migrate_settings(&sqlite_pool).await.unwrap();
            migrate_global(&sqlite_pool).await.unwrap();
            migrate_stats(&sqlite_pool).await.unwrap();
            migrate_chart(&sqlite_pool).await.unwrap();
            Ok::<(), sqlx::Error>(())
        })
    })
    .unwrap();
}

pub async fn migrate_users(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pin TEXT NOT NULL,
        imagePath TEXT,
        color TEXT,
        scrollY INTEGER DEFAULT 0
    )",
    )
    .execute(pool)
    .await
    .unwrap();

    Ok(())
}

pub async fn migrate_folders(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS folder (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        path TEXT NOT NULL,
        expanded boolean NOT NULL DEFAULT 0,
        asChild boolean NOT NULL DEFAULT 0,
        watchTime INTEGER NOT NULL DEFAULT 0,
        color TEXT, 
        FOREIGN KEY (userId) REFERENCES user(id)
    )",
    )
    .execute(pool)
    .await
    .unwrap();

    Ok(())
}

pub async fn migrate_videos(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS video (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        path TEXT NOT NULL,
        watched boolean NOT NULL,
        lastWatchedAt TIMESTAMP DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (userId) REFERENCES user(id)
        UNIQUE (userId, path)
    )",
    )
    .execute(pool)
    .await
    .unwrap();

    Ok(())
}

pub async fn migrate_settings(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL UNIQUE,
        fontSize TEXT NOT NULL,
        animations TEXT NOT NULL,
        autoPlay TEXT NOT NULL,
        autoRename TEXT NOT NULL,
        usePin TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id)
    )",
    )
    .execute(pool)
    .await
    .unwrap();

    Ok(())
}

pub async fn migrate_global(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS global (
        id GID99844589388427 PRIMARY KEY,
        userId INTEGER NOT NULL
    )",
    )
    .execute(pool)
    .await
    .unwrap();

    Ok(())
}

pub async fn migrate_stats(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS stats (
        user_id INTEGER PRIMARY KEY NOT NULL,
        total_anime INTEGER NOT NULL DEFAULT 0,
        total_videos INTEGER NOT NULL DEFAULT 0,
        videos_watched INTEGER NOT NULL DEFAULT 0,
        videos_remaining INTEGER NOT NULL DEFAULT 0,
        watchtime INTEGER NOT NULL DEFAULT 0, 
        FOREIGN KEY (user_id) REFERENCES user(id)
        )",
    )
    .execute(pool)
    .await
    .unwrap();

    Ok(())
}

pub async fn migrate_chart(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS chart (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id INTEGER NOT NULL,
            watchtime INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL UNIQUE,
            FOREIGN KEY (user_id) REFERENCES user(id)
        )",
    )
    .execute(pool)
    .await
    .unwrap();

    Ok(())
}

pub fn create_app_data_folder(handle: &AppHandle) -> String {
    let app_data_dir = handle.path_resolver().app_data_dir().unwrap();
    if !app_data_dir.exists() {
        std::fs::create_dir(&app_data_dir).unwrap();
    }
    app_data_dir.join("main.db").to_str().unwrap().to_string()
}
