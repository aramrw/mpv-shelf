// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(non_snake_case)]

mod db;
mod errors;
mod mal;
mod misc;
mod mpv;
mod stats;
mod tray;

use core::str;
#[allow(unused_imports)]
use random_color::color_dictionary::{ColorDictionary, ColorInformation};
#[allow(unused_imports)]
use random_color::{Color, Luminosity, RandomColor};
use serde::{Deserialize, Serialize};
use sysinfo::System;
#[allow(unused_imports)]
use tauri::{
    command, generate_handler, CustomMenuItem, Manager, SystemTray, SystemTrayEvent,
    SystemTrayMenu, SystemTrayMenuItem,
};
use tray::{handle_system_tray_events, instantiate_system_tray};

#[derive(Serialize, Deserialize, sqlx::FromRow, Debug)]
struct User {
    id: i64,
    pin: String,
    imagePath: Option<String>,
    color: Option<String>,
    scrollY: f32,
}

#[derive(Serialize, Deserialize, sqlx::FromRow, Debug)]
struct Global {
    id: String,
    userId: i64,
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
    let tray = instantiate_system_tray();
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
            .on_system_tray_event(handle_system_tray_events)
            .plugin(tauri_plugin_sql::Builder::default().build())
            .invoke_handler(generate_handler![
                mpv::open_video,
                stats::update_global_stats,
                stats::create_chart_stats,
                stats::recently_watched,
                misc::show_in_folder,
                misc::generate_random_color,
                misc::rename_subs,
                misc::export_data,
                misc::import_data,
                misc::delete_user,
            ])
            .build(tauri::generate_context!())
            .expect("error while building tauri application")
            .run(|_app_handle, event| {
                if let tauri::RunEvent::ExitRequested { api, .. } = event {
                    api.prevent_exit();
                }
            });
    }

    hack_builder(tray);
}

fn close_open_mpv_shelf_instance() -> bool {
    let mut sys = System::new_all();
    sys.refresh_all();

    // Collect and sort processes matching "mpv-shelf"
    let mut mpv_shelf_processes: Vec<_> = sys
        .processes()
        .iter()
        .filter(|(_pid, process)| process.name().to_lowercase().contains("mpv-shelf"))
        .collect();

    mpv_shelf_processes.sort_by_key(|(pid, _process)| pid.as_u32());

    // Get the current process ID
    let this_proc_id = std::process::id();

    if mpv_shelf_processes.len() > 1 {
        for (pid, _process) in mpv_shelf_processes {
            // Skip the current process
            if pid.as_u32() == this_proc_id {
                continue;
            }
            // Attempt to kill the other instances
            if let Some(proc) = sys.process(*pid) {
                proc.kill();
            }
        }
    }

    true
}
