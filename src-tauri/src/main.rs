// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod mal;
mod misc;
mod mpv;
mod db;
mod stats;

use core::str;
#[allow(unused_imports)]
use random_color::color_dictionary::{ColorDictionary, ColorInformation};
#[allow(unused_imports)]
use random_color::{Color, Luminosity, RandomColor};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::exit;
use sysinfo::System;
#[allow(unused_imports)]
use tauri::{
    command, generate_handler, CustomMenuItem, Manager, SystemTray, SystemTrayEvent,
    SystemTrayMenu, SystemTrayMenuItem,
};

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

#[derive(Debug, Deserialize, Serialize)]
struct VideoTable {
    id: u32,
    path: String,
    user_id: u32,
    watched: bool,
    last_watched_at: String,
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
                db::create_database(app.handle());
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
            .plugin(tauri_plugin_sql::Builder::default().build())
            .on_system_tray_event(move |app, event| {
                if let SystemTrayEvent::MenuItemClick { id, .. } = event {
                    match id.as_str() {
                        "toggle_window" => {
                            if let Some(window) = app.get_window("main") {
                                if window.is_visible().unwrap() {
                                    window.hide().unwrap();
                                } else {
                                    window.center().unwrap();
                                    window.show().unwrap();
                                    window.set_focus().unwrap();
                                }
                            } else {
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
                        }
                        "restart" => {
                            app.emit_all("closing_app", ()).unwrap();
                            app.restart();
                        }
                        "quit" => {
                            if app.windows().is_empty() {
                                println!("No windows open, emitting quit_app event.");
                                    exit(0);
                            } else {
                                check_for_mpv();
                            }
                        }
                        _ => {}
                    }
                }
            })
            .plugin(tauri_plugin_sql::Builder::default().build())
            .invoke_handler(generate_handler![
                mpv::open_video,
                stats::update_global_stats,
                stats::create_chart_stats,
                misc::show_in_folder,
                misc::generate_random_color,
                misc::generate_random_mono_color,
                misc::rename_subs,
            ])
            .build(tauri::generate_context!())
            .expect("error while building tauri application")
            .run(|_app_handle, event| {
                if let tauri::RunEvent::ExitRequested { api, .. } = event {
                    api.prevent_exit();
                    // _app_handle.get_window("main").unwrap().hide().unwrap();
                }
            });
    }

    hack_builder(tray);
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

    true
}
