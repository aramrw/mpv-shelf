use sysinfo::System;
use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};

pub fn instantiate_system_tray() -> SystemTray {
    let toggle_window = CustomMenuItem::new("toggle_window".to_string(), "Toggle Window");
    let restart = CustomMenuItem::new("restart".to_string(), "Restart");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let tray_menu = SystemTrayMenu::new()
        .add_item(toggle_window)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(restart)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    SystemTray::new().with_menu(tray_menu)
}

pub fn handle_system_tray_events(app: &AppHandle, event: SystemTrayEvent) {
    if let SystemTrayEvent::MenuItemClick { ref id, .. } = event {
        match id.as_str() {
            "toggle_window" => handle_toggle_window(app).unwrap(),
            "restart" => {
                if check_for_mpv() {
                    create_tauri_error_dialog(
                        "MPV is Playing!",
                        "Please close the currently playing MPV instance before attempting to restart mpv-shelf.",
                    );
                } else {
                    app.emit_all("closing_app", ()).unwrap();
                    app.restart();
                }
            }
            "quit" => {
                if check_for_mpv() {
                    create_tauri_error_dialog(
                        "MPV is Playing!",
                        "Please close the currently playing MPV instance before attempting to quit mpv-shelf.",
                    );
                } else if app.windows().is_empty() {
                    std::process::exit(0);
                }
            }
            _ => {}
        }
    }
}

fn create_tauri_error_dialog(title: &str, desc: &str) {
    tauri::api::dialog::MessageDialogBuilder::new(title, desc)
        .kind(tauri::api::dialog::MessageDialogKind::Error)
        .show(|_| {});
}

fn handle_toggle_window(app: &AppHandle) -> Result<(), tauri::Error> {
    if let Some(window) = app.get_window("main") {
        if window.is_visible()? {
            window.hide()?;
        } else {
            window.center()?;
            window.show()?;
            window.set_focus()?;
        }
    } else {
        if check_for_mpv() {
            create_tauri_error_dialog(
                        "MPV is Playing!",
                        "Please close the currently playing MPV instance before attempting to open mpv-shelf.",
                    );
            return Ok(());
        }
        tauri::WindowBuilder::new(
            app,
            "main".to_string(),
            tauri::WindowUrl::App("/login".into()),
        )
        .center()
        .title("mpv-shelf")
        .inner_size(800.0, 600.0)
        .build()?;
    }

    Ok(())
}

fn check_for_mpv() -> bool {
    let mut sys = System::new_all();
    sys.refresh_all();

    sys.processes().values().any(|process| {
        if let Some(process) = process.exe() {
            return process.to_string_lossy().to_lowercase().contains("mpv.exe");
        }
        false
    })
}
