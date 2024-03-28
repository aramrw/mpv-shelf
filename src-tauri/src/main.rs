// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use mal_api::oauth::Authenticated;
#[allow(unused_imports)]
use random_color::color_dictionary::{ColorDictionary, ColorInformation};
#[allow(unused_imports)]
use random_color::{Color, Luminosity, RandomColor};
use serde::{Deserialize, Serialize};
//use sqlx::migrate::Migrate;
use sqlx::{Connection, SqliteConnection};
//use tauri_plugin_oauth::start;
//use env_file_reader::read_file;
use mal_api::{oauth::RedirectResponse, prelude::*};
use std::collections::HashMap;
use std::io;
use std::io::{stdout, Write};
use std::path::Path;
use std::process::{exit, Command};
// use std::os::windows::process;
use std::{env, vec};
use sysinfo::System;
#[allow(unused_imports)]
use tauri::{
    command, CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};
use tauri::{generate_handler, Manager, Window};

#[derive(Serialize, Deserialize)]
struct User {
    id: i64,
    pin: i64,
}

#[derive(Serialize, Deserialize)]
struct Global {
    id: String,
    user_id: i64,
}

#[derive(Debug, Deserialize)]
struct StringPath {
    _path: String,
}

fn main() {
    let toggle_window = CustomMenuItem::new("toggle_window".to_string(), "Toggle Window");
    let restart = CustomMenuItem::new("restart".to_string(), "Restart");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let tray_menu = SystemTrayMenu::new()
        .add_item(toggle_window)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(restart)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let tray = SystemTray::new().with_menu(tray_menu).clone();
    fn hack_builder(tray: SystemTray) {
        tauri::Builder::default()
            .setup(|app| {
                let result = close_open_mpv_shelf_instance();
                if result {
                    match app.get_window("main") {
                        Some(window) => {
                            window.center().unwrap();
                            window.set_focus().unwrap();
                        }
                        None => return Ok(()),
                    };
                }

                Ok(())
            })
            .system_tray(tray.clone())
            .on_system_tray_event(move |app, event| match event {
                SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                    "toggle_window" => match app.get_window("main") {
                        Some(window) => {
                            if window.is_visible().unwrap() {
                                window.hide().unwrap();
                            } else if !window.is_visible().unwrap() {
                                window.center().unwrap();
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                        None => match app.get_window("main") {
                            Some(window) => {
                                if window.is_visible().unwrap() {
                                    window.hide().unwrap();
                                } else if !window.is_visible().unwrap() {
                                    window.center().unwrap();
                                    window.show().unwrap();
                                    window.set_focus().unwrap();
                                }
                            }
                            None => {
                                tauri::WindowBuilder::new(
                                    app,
                                    "main".to_string(),
                                    tauri::WindowUrl::App("/login".into()),
                                )
                                .center()
                                .title("mpv-shelf")
                                .inner_size(800.0, 600.0)
                                .build()
                                .unwrap();
                            }
                        },
                    },
                    "restart" => {
                        let _ = app.emit_all("closing_app", ()).unwrap();
                        app.restart();
                    }
                    "quit" => {
                        if app.windows().len() > 0 {
                            let _ = app.emit_all("quit_app", ());
                            app.once_global("db_closed", |_e| {
                                exit(0);
                            });
                        } else {
                            check_for_mpv();
                        }
                    }
                    _ => {}
                },
                _ => {}
            })
            .plugin(tauri_plugin_sql::Builder::default().build())
            .invoke_handler(generate_handler![
                open_video,
                show_in_folder,
                generate_random_color,
                generate_random_mono_color,
                close_database,
                check_mal_config,
                rename_subs
            ])
            .build(tauri::generate_context!())
            .expect("error while building tauri application")
            .run(|_app_handle, event| match event {
                tauri::RunEvent::ExitRequested { api, .. } => {
                    api.prevent_exit();
                    // _app_handle.get_window("main").unwrap().hide().unwrap();
                }
                _ => {}
            });
    }

    hack_builder(tray);
}

// Misc

// Color Generation
#[command]
fn generate_random_color() -> String {
    let color = RandomColor::new()
        .luminosity(Luminosity::Light)
        .alpha(0.2)
        .to_hex()
        .to_string();
    color
}

#[command]
fn generate_random_mono_color() -> String {
    let color = RandomColor::new()
        .luminosity(Luminosity::Light)
        .alpha(1.2)
        .to_hex()
        .to_string();

    color
}

// Subtitles
#[command]
fn rename_subs(sub_paths: String, vid_paths: String) {
    let sub_v: Vec<String> = serde_json::from_str(&sub_paths).unwrap();
    let vid_v: Vec<String> = serde_json::from_str(&vid_paths).unwrap();
    let mut sub_names: Vec<String> = Vec::new();
    let mut vid_names: Vec<String> = Vec::new();
    let mut current_path = "".to_string();
    let mut new_sub_names: Vec<String> = Vec::new();

    vid_v.iter().for_each(|path| match path.rsplit_once("\\") {
        Some((dir, filename)) => {
            //println!("Directory: {}, Filename: {}", dir, filename)
            if current_path != format!("{}\\", dir) {
                current_path = format!("{}\\", dir);
            }

            vid_names.push(filename.to_string());
        }
        None => println!("Separator not found in path: {}", path),
    });

    sub_v.iter().for_each(|path| match path.rsplit_once("\\") {
        Some((_dir, filename)) => {
            //println!("Directory: {}, Filename: {}", dir, filename)
            sub_names.push(filename.to_string());
        }
        None => println!("Separator not found in path: {}", path),
    });

    if sub_names.len() > 0 && vid_names.len() > 0 {
        let first_sub_name = sub_names[0].rsplit_once(".").unwrap();
        let first_video_name = vid_names[0].rsplit_once(".").unwrap();
        if first_sub_name.0 == first_video_name.0 {
            //println!("Names are the same!");
            return;
        }
    }

    if vid_names.len() > 0 {
        sub_names
            .iter()
            .enumerate()
            .for_each(|(index, sub)| match sub.rsplit_once(".") {
                Some((_name, file_type)) => {
                    if index < vid_names.len() {
                        let vid_name_without_type = &vid_names[index].split_once(".").unwrap();
                        new_sub_names.push(format!("{}.{}", vid_name_without_type.0, file_type));
                    } else {
                        println!("Index {} is out of bounds for vid_names", index);
                    }
                }
                None => println!("Separator `.` not found in sub: {}", sub),
            });
    }

    if new_sub_names.len() > 0 && new_sub_names[0] != sub_v[0] {
        sub_v
            .iter()
            .enumerate()
            .for_each(|(index, path)| match path.rsplit_once("\\") {
                Some((path, _old_name)) => {
                    let new_path = format!("{}\\{}", path, new_sub_names[index]);
                    std::fs::rename(
                        Path::new(sub_v[index].as_str()),
                        Path::new(new_path.as_str()),
                    )
                    .expect(format!("Failed to rename file at {}", path).as_str());
                }
                None => println!("Seperator not found in sub path {}", path),
            });
    }

    //println!("{:?}", new_sub_names);
}

// Tray

fn check_for_mpv() {
    let mut sys = System::new_all();

    sys.refresh_all();

    let processes_hashmap = sys.processes().iter().collect::<HashMap<_, _>>();
    let mut found = false;

    processes_hashmap.iter().for_each(|(_pid, process)| {
        if process.name().to_lowercase().contains("mpv.exe") {
            found = true;
        }
    });

    if !found {
        exit(0);
    }
}

fn close_open_mpv_shelf_instance() -> bool {
    let mut sys = System::new_all();

    sys.refresh_all();

    let mut mpv_shelf_processes: Vec<_> = sys
        .processes()
        .iter()
        .filter(|(_pid, process)| process.name().to_lowercase().contains("mpv-shelf"))
        .collect();

    mpv_shelf_processes.sort_by_key(|(pid, _process)| *pid);
    //println!("{:?}", mpv_shelf_processes.len());

    // If there is more than one process, kill the first one (with the lowest PID)
    if mpv_shelf_processes.len() > 1 {
        let (pid, _process) = mpv_shelf_processes[1];
        sys.process(*pid).unwrap().kill();
    }

    return true;
}

// My Anime List Integration

#[command]
async fn check_mal_config() {
    let authenticated_client = OauthClient::load_from_config("./mal.toml");
    //let mal_client_id = std::env::var("MAL_CLIENT_ID").expect("MAL_CLIENT_ID is not set");
    //println!("{}", mal_client_id);

    match authenticated_client {
        Ok(c) => {
            println!("An existing authorized Oauth client already exists, updating one piece.");
            update_anime(&c).await;
        }
        Err(e) => {
            println!("{}", e);
            link_my_anime_list().await;
        }
    }
}

async fn link_my_anime_list() {
    let client_id = "".to_string();
    let client_secret = "".to_string();
    let redirect_url = "https://github.com/aramrw/mpv-shelf".to_string();
    let mut oauth_client =
        OauthClient::new(&client_id, Some(&client_secret), &redirect_url).unwrap();
    println!("Visit this URL: {}\n", oauth_client.generate_auth_url());

    let mut input = String::new();
    println!("After authorizing, please enter the URL you were redirected to: ");
    io::stdin()
        .read_line(&mut input)
        .expect("Failed to read user input");

    let response = RedirectResponse::try_from(input).unwrap();

    // Authentication process
    let result = oauth_client.authenticate(response).await;
    let authenticated_oauth_client = match result {
        Ok(t) => {
            println!("Got token: {:?}\n", t.get_access_token_secret());

            let t = t.refresh().await.unwrap();
            println!("Refreshed token: {:?}", t.get_access_token_secret());
            t
        }
        Err(e) => panic!("Failed: {}", e),
    };

    authenticated_oauth_client
        .save_to_config("./mal.toml")
        .unwrap();

    //let anime_api_client = AnimeApiClient::from(&authenticated_oauth_client);
    //let _manga_api_client = MangaApiClient::from(&authenticated_oauth_client);
}

async fn update_anime(oauth_client: &OauthClient<Authenticated>) {
    let anime_api_client = AnimeApiClient::from(oauth_client);
    //let manga_api_client = MangaApiClient::from(oauth_client);
    //let user_api_client = UserApiClient::from(oauth_client);

    // Update One Piece episodes watched
    // Pass the anime id to the builder.
    let query = UpdateMyAnimeListStatus::builder(21)
        .num_watched_episodes(1070)
        .build()
        .unwrap();
    let response = anime_api_client.update_anime_list_status(&query).await;
    if let Ok(response) = response {
        println!("Response: {}\n", response);
    }
}

// ! DONT TOUCH THESE FUNCTIONS ! //

#[command]
fn show_in_folder(path: String) {
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

#[command]
async fn open_video(path: String, handle: tauri::AppHandle) -> String {
    let window: Window = handle
        .clone()
        .get_window("main")
        .or_else(|| handle.clone().get_window("main"))
        .expect("failed to get any windows!");

    let screen_res = window.current_monitor().unwrap().unwrap();

    let result = close_database(handle.clone()).await;

    if result == true {
        window.close().expect("failed to close main window");
    }

    let mut sys = System::new_all();

    // Kill all mpv.exe processes before opening a new video.
    sys.refresh_processes(); // Refresh the list of processes.

    let processes_hashmap = sys.processes().iter().collect::<HashMap<_, _>>();

    // TODO : To make it support any video player, get the default video player from the user / the os

    processes_hashmap.iter().for_each(|(_pid, process)| {
        if process.name().to_lowercase().contains("mpv.exe") {
            process.kill();
        }
    });

    // Open the video with mpv.
    match open::that(path) {
        Ok(_) => "Video opened successfully",
        Err(_) => "Failed to open video",
    };

    let instant = std::time::Instant::now();

    // Loop indefinitely until mpv.exe is not found.
    loop {
        let mut mpv_running = false; // Flag to check if mpv is running.
        sys.refresh_processes(); // Refresh the list of processes.

        let processes_hashmap = sys.processes().iter().collect::<HashMap<_, _>>();

        processes_hashmap.iter().for_each(|(_pid, process)| {
            if process.name().to_lowercase().contains("mpv.exe") {
                mpv_running = true;
            }
        });

        if !mpv_running {
            println!(
                "mpv-shelf was running for {:.2} seconds in the background",
                &instant.elapsed().as_secs_f32()
            );
            stdout().flush().unwrap();

            // open a new window and close the first exe (not a window anymore) in the system tray

            match handle.get_window("main") {
                Some(window) => {
                    window.center().unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                None => {
                    // get users current resolution

                    // build the window
                    tauri::WindowBuilder::new(
                        &handle,
                        "main".to_string(),
                        tauri::WindowUrl::App("/dashboard".into()),
                    )
                    .center()
                    .transparent(true)
                    .title("mpv-shelf")
                    .inner_size(
                        screen_res.size().width as f64,
                        screen_res.size().height as f64,
                    )
                    .build()
                    .unwrap();
                }
            }

            return "closed".to_string();
        }

        // Sleep for a bit before checking again to reduce CPU usage.
        std::thread::sleep(std::time::Duration::from_millis(500));
    }
}

#[command]
async fn close_database(handle: tauri::AppHandle) -> bool {
    let db_url = handle
        .path_resolver()
        .app_data_dir()
        .unwrap()
        .join("main.db");

    let conn = SqliteConnection::connect(db_url.to_str().unwrap())
        .await
        .unwrap();

    println!("Closing the database");
    stdout().flush().unwrap();

    conn.close().await.unwrap();

    return true;
}
