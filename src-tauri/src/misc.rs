
use std::path::Path;
use std::fs::{self};
use regex::Regex;
use std::u32;
use std::process::Command;
use random_color::{Luminosity, RandomColor};

// Subtitles
#[tauri::command]
pub fn rename_subs(sub_paths: String, vid_paths: String, folder_path: String) {
    let sub_v: Vec<String> = serde_json::from_str(&sub_paths).unwrap();
    let vid_v: Vec<String> = serde_json::from_str(&vid_paths).unwrap();
    let folder_name = Path::new(&folder_path)
        .file_name()
        .unwrap()
        .to_str()
        .unwrap();

    let first_video_file_name = Path::new(&vid_v[0])
        .file_name()
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();

    let first_sub_file_name = Path::new(&vid_v[0])
        .file_name()
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();

    //println!("{}, {}", first_video_file_name, folder_name);

    if first_video_file_name.contains(folder_name) && first_sub_file_name.contains(folder_name) {
        println!("File's already renamed");
        return;
    }

    //println!("{}", folder_path);

    for vid in vid_v {
        //println!("{}", vid);
        let video_file_name = Path::new(&vid)
            .file_name()
            .unwrap()
            .to_str()
            .unwrap()
            .to_string();
        let (_video_file_name, video_file_type) = video_file_name
            .rsplit_once(".")
            .map(|(name, file_type)| (name.to_string(), file_type.to_string()))
            .unwrap_or(("".to_string(), "".to_string()));
        let video_episode = extract_episode_number(&vid).unwrap();
        let new_video_path = format!(
            "{}\\{} - {}.{}",
            folder_path, folder_name, video_episode, video_file_type
        );
        //println!("{}", new_video_path);
        fs::rename(vid, new_video_path).unwrap();
    }

    for sub in sub_v {
        let sub_file_name = Path::new(&sub)
            .file_name()
            .unwrap()
            .to_str()
            .unwrap()
            .to_string();
        let (_sub_file_name, sub_file_type) = sub_file_name
            .rsplit_once('.')
            .map(|(name, file_type)| (name.to_string(), file_type.to_string()))
            .unwrap_or(("".to_string(), "".to_string()));
        let subtitle_episode = extract_episode_number(&sub).unwrap();
        let new_subtitle_path = format!(
            "{}\\{} - {}.{}",
            folder_path, folder_name, subtitle_episode, sub_file_type
        );
        println!("{}", new_subtitle_path);
        fs::rename(sub, new_subtitle_path).unwrap();
    }
}

pub fn extract_episode_number(title: &str) -> Option<u32> {
    let re = Regex::new(r"(\d+)\D*$").unwrap();
    re.captures_iter(title)
        .last()
        .and_then(|cap| cap.get(1).map(|m| m.as_str().parse::<u32>().ok()))
        .flatten()
}

#[tauri::command]
pub fn show_in_folder(path: String) {
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

// Color Generation
#[tauri::command]
pub fn generate_random_color() -> String {
    let color = RandomColor::new()
        .luminosity(Luminosity::Light)
        .alpha(0.2)
        .to_hex()
        .to_string();
    color
}

#[tauri::command]
pub fn generate_random_mono_color() -> String {
    let color = RandomColor::new()
        .luminosity(Luminosity::Light)
        .alpha(1.2)
        .to_hex()
        .to_string();

    color
}
