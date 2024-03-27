// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[allow(unused_imports)]
use random_color::color_dictionary::{ColorDictionary, ColorInformation};
#[allow(unused_imports)]
use random_color::{Color, Luminosity, RandomColor};
use serde::{Deserialize, Serialize};
//use sqlx::migrate::Migrate;
use sqlx::{Connection, SqliteConnection};
//use tauri_plugin_oauth::start;
//use env_file_reader::read_file;

use std::collections::HashMap;
use std::io::{stdout, Write};
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
                close_open_mpv_shelf_instance();
                match app.get_window("main") {
                    Some(window) => {
                        window.center().unwrap();
                        window.set_focus().unwrap();
                    }
                    None => return Ok(()),
                };
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
                //start_server
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

// // *MAL API* //
// #[command]
// async fn start_server(window: Window) -> Result<u16, String> {
//     start(move |url| {
//         // Because of the unprotected localhost port, you must verify the URL here.
//         // Preferebly send back only the token, or nothing at all if you can handle everything else in Rust.
//         let _ = window.emit("redirect_uri", url);
//     })
//     .map_err(|err| err.to_string())
// }
// // *MAL API* //

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

#[tauri::command]
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

// tray
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

fn close_open_mpv_shelf_instance() {
    let mut sys = System::new_all();

    sys.refresh_all();

    let mut mpv_shelf_processes: Vec<_> = sys
        .processes()
        .iter()
        .filter(|(_pid, process)| process.name().to_lowercase().contains("mpv-shelf"))
        .collect();

    mpv_shelf_processes.sort_by_key(|(pid, _process)| *pid);
    println!("{:?}", mpv_shelf_processes.len());

    // If there is more than one process, kill the first one (with the lowest PID)
    if mpv_shelf_processes.len() > 1 {
        let (pid, _process) = mpv_shelf_processes[0];
        sys.process(*pid).unwrap().kill();
    }
}
