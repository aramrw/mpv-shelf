// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[allow(unused_imports)]
use random_color::color_dictionary::{ColorDictionary, ColorInformation};
#[allow(unused_imports)]
use random_color::{Color, Luminosity, RandomColor};
use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::generate_handler;
#[allow(unused_imports)]
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

#[derive(Serialize, Deserialize)]
struct User {
    id: i64,
    pin: Option<String>,
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let tray_menu = SystemTrayMenu::new()
        .add_item(quit)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(hide);

    let tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(tray)
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(generate_handler![
            open_video,
            show_in_folder,
            generate_random_color
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn open_video(path: &str) {
    match open::that(path) {
        Ok(_) => "Video opened successfully",
        Err(_) => "Failed to open video",
    };
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
        .alpha(8.0) // Fully opaque
        .to_hex()
        .to_string(); // Output as an HSL string for finer control over the appearance

    color
}
