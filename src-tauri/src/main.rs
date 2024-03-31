// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::{clangd, skim, FuzzyMatcher};
//use mal_api::anime;
use mal_api::oauth::Authenticated;
#[allow(unused_imports)]
use random_color::color_dictionary::{ColorDictionary, ColorInformation};
#[allow(unused_imports)]
use random_color::{Color, Luminosity, RandomColor};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
//use sqlx::migrate::Migrate;
use sqlx::{Connection, SqliteConnection};
//use tauri_plugin_oauth::start;
//use env_file_reader::read_file;
use core::str;
use mal_api::{oauth::RedirectResponse, prelude::*};
use std::collections::HashMap;
use std::fs::File;
use std::io::{self, BufRead};
use std::io::{stdout, Write};
use std::path::Path;
use std::process::{exit, Command};
use std::thread::current;
// use std::os::windows::process;
use std::io::Read;
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

#[derive(Debug, Deserialize, Serialize, Clone)]
struct AnimeSeason {
    _season: String,
    _year: String,
}

// #[derive(Debug, Deserialize)]
// struct AnimeType {
//     tv: String,
//     movie: String,
//     ova: String,
//     ona: String,
//     special: String,
//     unkown: String,
// }

// #[derive(Debug, Deserialize)]
// struct AnimeStatus {
//     finished: String,
//     ongoing: String,
//     upcoming: String,
//     unknown: String,
// }

#[derive(Debug, Deserialize, Serialize, Clone)]
struct Anime {
    _source: String,
    _title: String,
    _anime_type: String,
    _episodes: String,
    _status: String,
    _anime_season: AnimeSeason,
    _picture: String,
    _thumbnail: String,
    _synonyms: Vec<String>,
    _related_anime: Vec<String>,
    _tags: Vec<String>,
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
                rename_subs,
                find_anime_from_title
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

    //println!("{:?}", vid_v);

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
            //println!("Directory: {}, Filename: {}", _dir, filename);
            sub_names.push(filename.to_string());
        }
        None => println!("Separator not found in path: {}", path),
    });

    if sub_names.len() > 0 && vid_names.len() > 0 {
        let first_sub_name = sub_names[sub_names.len() - 1].rsplit_once(".").unwrap();
        let first_video_name = vid_names[vid_names.len() - 1].rsplit_once(".").unwrap();
        if first_sub_name.0 == first_video_name.0 {
            //println!("Names are the same!");
            return;
        }
    }

    if sub_names.len() > 0 && vid_names.len() > 0 {
        //println!("{:?}", vid_names);
        sub_names
            .iter()
            .enumerate()
            .for_each(|(index, sub)| match sub.rsplit_once(".") {
                Some((_name, file_type)) => {
                    if index < vid_names.len() {
                        let vid_name_without_type = &vid_names[index].split_once(".").unwrap();
                        new_sub_names.push(format!("{}.{}", vid_name_without_type.0, file_type));
                    } else {
                        println!(
                            "Index {} is out of bounds for vid_names: {}",
                            index,
                            vid_names.len()
                        );
                    }
                }
                None => println!("Separator `.` not found in sub: {}", sub),
            });

        if new_sub_names.len() > 0 && new_sub_names[0] != sub_v[0] {
            sub_v
                .iter()
                .enumerate()
                .for_each(|(index, path)| match path.rsplit_once("\\") {
                    Some((path, _old_name)) => {
                        if index < new_sub_names.len() {
                            let new_path = format!("{}\\{}", path, new_sub_names[index]);
                            std::fs::rename(
                                Path::new(sub_v[index].as_str()),
                                Path::new(new_path.as_str()),
                            )
                            .expect(format!("Failed to rename file at {}", path).as_str());
                        }
                    }
                    None => println!("Seperator not found in sub path {}", path),
                });
        }
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
async fn find_anime_from_title(episode_title: String, folder_path: String) -> String {
    let mut file = File::open("./anime-database.json").unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    let parsed_json: Value = serde_json::from_str(&contents).unwrap();
    let mut best_match_data = None;

    let main_anime_name = match folder_path.rsplit_once("\\") {
        Some((_dir, filename)) => {
            //println!("Directory: {}, Filename: {}", dir, filename)
            filename.to_string()
        }
        None => return format!("Error: Separator not found in path: {}", folder_path),
    };

    //only get name of anime
    let current_episode_title = match episode_title.rsplitn(2, ".").last() {
        Some(title_part) => title_part,
        None => return format!("Error: Could not split {}!", episode_title),
    };

    // if the current episode doesn't have the anime name in it, extract the episode number

    let mut episode_number: &str = "";
    if current_episode_title.chars().all(|c| c.is_numeric()) {
        if !current_episode_title.contains(&main_anime_name) {
            let re = Regex::new(r"\d+").unwrap();
            if let Some(mat) = re.find(current_episode_title) {
                episode_number = mat.as_str()
            } else {
                return format!(
                    "Error: No episode number found in {}!",
                    current_episode_title
                );
            }
        }
    }

    // stitch together the folders main anime name and the episode number
    let new_episode_title = format!("{} {}", main_anime_name, episode_number);

    // println!("Episode Number: {}", episode_number);
    let current = current_episode_title.trim().to_string();

    if let Some(data) = parsed_json.get("data").and_then(|v| v.as_array()) {
        //let matcher = skim::SkimMatcherV2::default();
        let matcher = clangd::ClangdMatcher::default();
        let mut _best_match = None;
        let mut _highest_score = 0;
        //let current = current_episode_title.trim().to_string();

        for anime in data {
            let title = anime["title"].as_str().unwrap();
            //println!("{}", title);
            let sources = anime["sources"]
                .as_array()
                .unwrap()
                .iter()
                .map(|s| s.as_str().unwrap().to_string())
                .find(|s| s.contains("myanimelist"))
                .unwrap_or("".to_string());
            let anime_season_vec: AnimeSeason = AnimeSeason {
                _season: anime["animeSeason"]["season"].to_string(),
                _year: anime["animeSeason"]["year"].to_string(),
            };
            let synonyms_vec: Vec<String> = anime["synonyms"]
                .as_array()
                .unwrap()
                .iter()
                .map(|syn| syn.as_str().unwrap().to_string())
                .collect();
            let related_anime_vec: Vec<String> = anime["relatedAnime"]
                .as_array()
                .unwrap()
                .iter()
                .filter_map(|url| {
                    let url_str = url.as_str().unwrap();
                    if url_str.contains("myanimelist") {
                        Some(url_str.to_string())
                    } else {
                        None
                    }
                })
                .collect();
            let anime_tags: Vec<String> = anime["tags"]
                .as_array()
                .unwrap()
                .iter()
                .map(|t| t.as_str().unwrap().to_string())
                .collect();

            let anime_vec: Anime = Anime {
                _source: sources,
                _title: anime["title"].to_string(),
                _anime_type: anime["type"].to_string(),
                _episodes: anime["episodes"].to_string(),
                _status: anime["status"].to_string(),
                _anime_season: anime_season_vec,
                _picture: anime["picture"].to_string(),
                _thumbnail: anime["thumbnail"].to_string(),
                _synonyms: synonyms_vec,
                _related_anime: related_anime_vec,
                _tags: anime_tags,
            };

            if episode_number == "" {
                if title.contains("Ju") {
                    //println!("Matching '{}' with '{}'", title, current);
                    let score =
                        matcher.fuzzy_match(&title.to_lowercase(), "jujutsu kaisen 0 movie");
                    if score.is_some() {
                        println!("Score: {:?}, {:?}", score, title);
                    }
                    // match matcher
                    //     .fuzzy_match(&title.to_lowercase(), &current_episode_title.to_lowercase())
                    // {
                    //     Some(score) => {
                    //         println!("Score for '{}': {}", title, score);
                    //         if score > _highest_score {
                    //             _highest_score = score;
                    //             _best_match = Some(title);
                    //             best_match_data = Some(anime_vec);
                    //         }
                    //     }
                    //     None => println!("No match for '{}'", title),
                    // }
                }
            } else if episode_number != "" {
                if let Some(score) = matcher.fuzzy_match(&title, &main_anime_name) {
                    if score > _highest_score {
                        _highest_score = score;
                        _best_match = Some(title);
                        best_match_data = Some(anime_vec);
                        println!("{}", title);
                    }
                }
            } else {
                if episode_number != "" {
                    println!("{:?}", _best_match);
                    return format!(
                        "Error: Could not find data for new_episode_title: {}",
                        new_episode_title
                    );
                } else {
                    println!("{:?}", _best_match);
                    return format!(
                        "Error: Could not find data for current_episode_title: {}",
                        current_episode_title
                    );
                }
            }
        }
        match _best_match {
            Some(ref best_match) => {
                //println!("{}", counter);
                println!("{:?}", best_match_data)
            }
            None => {
                return format!("Error: Could not find {}!", current_episode_title);
            }
        }
    } else {
        return format!(
            "Error: An Error occurred trying to find {}!",
            current_episode_title
        );
    }
    let data = match best_match_data {
        Some(ref anime) => {
            let anime_json = serde_json::to_string_pretty(&anime);
            match anime_json {
                Ok(anime_json) => anime_json,
                Err(e) => format!("{}", e),
            }
        }
        None => return format!("Error: Anime Data is None!"),
    };

    data
}

async fn read_toml_lines<P>(filename: P) -> io::Result<io::Lines<io::BufReader<File>>>
where
    P: AsRef<Path>,
{
    let file = File::open(filename)?;
    Ok(io::BufReader::new(file).lines())
}

#[command]
async fn check_mal_config(anime_data: String, episode_number: u32) {
    if anime_data.is_empty() {
        println!("Error: anime_data was not specified!");
        return;
    }

    // parse the anime_data json as the Anime struct
    let data: Anime = serde_json::from_str(&anime_data).unwrap();
    let anime_id = match data._source.rsplit_once("/") {
        Some((_url, id)) => id,
        None => "",
    };
    //println!("{:?}", anime_id);

    let mut lines_vec: Vec<String> = Vec::new();
    if let Ok(lines) = read_toml_lines("./mal.toml").await {
        for line in lines {
            if let Ok(token) = line {
                if token.contains(&"mal_access_token".to_string()) {
                    let split = token.split("=").collect::<Vec<&str>>();
                    lines_vec.push(split[1].trim().to_string());
                }
                if token.contains(&"mal_refresh_token".to_string()) {
                    let split = token.split("=").collect::<Vec<&str>>();
                    lines_vec.push(split[1].trim().to_string());
                }
                if token.contains(&"mal_token_expires_at".to_string()) {
                    let split = token.split("=").collect::<Vec<&str>>();
                    lines_vec.push(split[1].trim().to_string());
                }
            }
        }
    }

    lines_vec.iter_mut().for_each(|line| {
        *line = line.trim_matches('\"').to_string();
    });

    if lines_vec.len() > 0 {
        // println!("{:?}", lines_vec);

        let client_id = "7e2bbcc2ee9bd135cc6c0bca185132ac".to_string();
        let client_secret =
            "af749aa2e34194d2744c0c082a0e9d7bd71732ec226d67946d82c8167e80cdcc".to_string();
        let redirect_url = "https://github.com/aramrw/mpv-shelf".to_string();

        let authenticated_client = OauthClient::load_from_values(
            lines_vec[0].clone(),
            lines_vec[1].clone(),
            client_id,
            Some(client_secret),
            redirect_url,
            lines_vec[2]
                .parse::<u64>()
                .expect("Failed to parse string to u64"),
        );

        match authenticated_client {
            Ok(client) => {
                println!("An existing authorized Oauth client already exists, updating one piece.");
                if !anime_id.is_empty() {
                    println!("Updating Anime with id: {}", anime_id);
                    update_anime(anime_id.parse::<u32>().unwrap(), episode_number, &client).await;
                }
            }
            Err(e) => {
                println!("{}", e);
                link_my_anime_list().await;
            }
        }
    }
}

async fn link_my_anime_list() {
    let client_id = "7e2bbcc2ee9bd135cc6c0bca185132ac".to_string();
    let client_secret =
        "af749aa2e34194d2744c0c082a0e9d7bd71732ec226d67946d82c8167e80cdcc".to_string();
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

async fn update_anime(
    anime_id: u32,
    episode_number: u32,
    oauth_client: &OauthClient<Authenticated>,
) {
    let anime_api_client = AnimeApiClient::from(oauth_client);
    //let manga_api_client = MangaApiClient::from(oauth_client);
    //let user_api_client = UserApiClient::from(oauth_client);

    // Update Anime from anime_id
    // Pass the anime id to the builder.
    let query = UpdateMyAnimeListStatus::builder(anime_id)
        .num_watched_episodes(episode_number)
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
