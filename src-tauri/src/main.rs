// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[allow(unused_imports)]
use random_color::color_dictionary::{ColorDictionary, ColorInformation};
#[allow(unused_imports)]
use random_color::{Color, Luminosity, RandomColor};
use serde::{Deserialize, Serialize};

use std::io::{stdout, Write};
use std::process::Command;
use std::vec;
use sysinfo::System;
use tauri::{generate_handler, Manager, Window};
#[allow(unused_imports)]
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

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
    let open = CustomMenuItem::new("open".to_string(), "Open");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let restart = CustomMenuItem::new("restart".to_string(), "Restart");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let tray_menu = SystemTrayMenu::new()
        .add_item(open)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(restart)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let tray = SystemTray::new().with_menu(tray_menu).clone();
    fn hack_builder(tray: SystemTray) {
        tauri::Builder::default()
            .setup(|app| {
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
                    "open" => match app.get_window("main") {
                        Some(window) => {
                            if window.is_visible().unwrap() {
                                window.set_focus().unwrap();
                            } else if !window.is_visible().unwrap() {
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                        None => match app.get_window("new") {
                            Some(window) => {
                                if window.is_visible().unwrap() {
                                    window.set_focus().unwrap();
                                } else if !window.is_visible().unwrap() {
                                    window.show().unwrap();
                                    window.set_focus().unwrap();
                                }
                            }
                            None => {
                                tauri::WindowBuilder::new(
                                    app,
                                    "new".to_string(),
                                    tauri::WindowUrl::App("/dashboard".into()),
                                )
                                .center()
                                .transparent(true)
                                .title("mpv-shelf")
                                .inner_size(700.0, 600.0)
                                .build()
                                .unwrap();
                            }
                        },
                    },
                    "hide" => match app.get_window("main") {
                        Some(window) => {
                            if window.is_visible().unwrap() {
                                window.hide().unwrap();
                            } else if !window.is_visible().unwrap() {
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                        None => match app.get_window("new") {
                            Some(window) => {
                                if window.is_visible().unwrap() {
                                    window.hide().unwrap();
                                } else if !window.is_visible().unwrap() {
                                    window.show().unwrap();
                                    window.set_focus().unwrap();
                                }
                            }
                            None => {
                                // ! Do nothing since there is no window to hide
                                // tauri::WindowBuilder::new(
                                //     app,
                                //     "new".to_string(),
                                //     tauri::WindowUrl::App("/dashboard".into()),
                                // )
                                // .transparent(true)
                                // .title("mpv-shelf")
                                //.inner_size(700.0, 600.0)
                                // .build()
                                // .unwrap();
                            }
                        },
                    },
                    "restart" => {
                        // TODO : Reset the global table in the database with sqlx
                        app.restart();
                    }
                    "quit" => {
                        app.exit(1);
                    }
                    _ => {}
                },
                _ => {}
            })
            .plugin(tauri_plugin_sql::Builder::default().build())
            .invoke_handler(generate_handler![
                open_video,
                show_in_folder,
                generate_random_color
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

#[tauri::command]
async fn open_video(path: String, handle: tauri::AppHandle) -> String {
    let window: Window = handle
        .clone()
        .get_window("main")
        .or_else(|| handle.clone().get_window("new"))
        .expect("failed to get any windows!");

    window.close().expect("failed to close main window");

    let mut sys = System::new_all();

    // First we update all information of our `System` struct.
    sys.refresh_all();

    // kill any mpv processes before opening a new one
    #[allow(unused_variables)]
    for (pid, process) in sys.processes() {
        if process.name().to_lowercase().contains("mpv.exe") {
            process.kill();
        }
    }

    let instant = std::time::Instant::now();

    // Loop indefinitely until mpv.exe is not found.
    loop {
        sys.refresh_processes(); // Refresh the list of processes.

        let mut mpv_running = false; // Flag to check if mpv is running.

        // Check all processes to see if mpv.exe is running.
        for (_pid, process) in sys.processes() {
            if process.name().to_lowercase() == "mpv.exe" {
                sys.refresh_all();
                mpv_running = true; // mpv is still running.
                break; // No need to check further processes.
            }
        }

        if !mpv_running {
            println!(
                "mpv-shelf was running for {:.2} seconds in the background",
                &instant.elapsed().as_secs_f32()
            );
            stdout().flush().unwrap();

            // open a new window and close the first exe (not a window anymore) in the system tray

            match handle.get_window("new") {
                Some(window) => {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                None => {
                    tauri::WindowBuilder::new(
                        &handle,
                        "new".to_string(),
                        tauri::WindowUrl::App("/dashboard".into()),
                    )
                    .fullscreen(true)
                    .transparent(true)
                    .title("mpv-shelf")
                    .inner_size(600.0, 800.0)
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

#[tauri::command]
fn generate_random_color() -> String {
    let color = RandomColor::new()
        .luminosity(Luminosity::Light) // Ensuring the color is light, for a pastel-like effect
        .alpha(0.2)
        .to_hex()
        .to_string(); // Output as an HSL string for finer control over the appearance

    color
}
