// // My Anime List Integration
// use std::fs::File;
// use std::io::prelude::*;
// use regex::Regex;
// use serde::{Deserialize, Serialize};
// use std::path::Path;
// use std::io;
// use serde_json::Value;
// use mal_api::{oauth::RedirectResponse, prelude::*};
// use mal_api::oauth::Authenticated;
// use fuzzy_matcher::{clangd, FuzzyMatcher};
//
// #[derive(Debug, Deserialize, Serialize, Clone)]
// struct Anime {
//     _source: String,
//     _title: String,
//     _anime_type: String,
//     _episodes: String,
//     _status: String,
//     _anime_season: AnimeSeason,
//     _picture: String,
//     _thumbnail: String,
//     _synonyms: Vec<String>,
//     _related_anime: Vec<String>,
//     _tags: Vec<String>,
// }
//
// #[derive(Debug, Deserialize, Serialize, Clone)]
// struct AnimeSeason {
//     _season: String,
//     _year: String,
// }

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


// #[tauri::command]
// #[allow(dead_code)]
// async fn find_anime_from_title(episode_title: String, folder_path: String) -> String {
//     let mut file = File::open("./anime-database.json").unwrap();
//     let mut contents = String::new();
//     file.read_to_string(&mut contents).unwrap();
//     let parsed_json: Value = serde_json::from_str(&contents).unwrap();
//     let mut best_match_data = None;
//
//     let main_anime_name = match folder_path.rsplit_once('\\') {
//         Some((_dir, filename)) => {
//             //println!("Directory: {}, Filename: {}", dir, filename)
//             filename.to_string()
//         }
//         None => return format!("Error: Separator not found in path: {}", folder_path),
//     };
//
//     //only get name of anime
//     let current_episode_title = match episode_title.rsplitn(2, '.').last() {
//         Some(title_part) => title_part,
//         None => return format!("Error: Could not split {}!", episode_title),
//     };
//
//     // if the current episode doesn't have the anime name in it, extract the episode number
//
//     let mut episode_number: &str = "";
//     if current_episode_title.chars().all(|c| c.is_numeric()) {
//         if !current_episode_title.contains(&main_anime_name) {
//             let re = Regex::new(r"\d+").unwrap();
//             if let Some(mat) = re.find(current_episode_title) {
//                 episode_number = mat.as_str()
//             } else {
//                 return format!(
//                     "Error: No episode number found in {}!",
//                     current_episode_title
//                 );
//             }
//         }
//     }
//
//     // stitch together the folders main anime name and the episode number
//     let new_episode_title = format!("{} {}", main_anime_name, episode_number);
//
//     // println!("Episode Number: {}", episode_number);
//     let _current = current_episode_title.trim().to_string();
//
//     if let Some(data) = parsed_json.get("data").and_then(|v| v.as_array()) {
//         //let matcher = skim::SkimMatcherV2::default();
//         let matcher = clangd::ClangdMatcher::default();
//         let mut _best_match = None;
//         let mut _highest_score = 0;
//         //let current = current_episode_title.trim().to_string();
//
//         for anime in data {
//             let title = anime["title"].as_str().unwrap();
//             //println!("{}", title);
//             let sources = anime["sources"]
//                 .as_array()
//                 .unwrap()
//                 .iter()
//                 .map(|s| s.as_str().unwrap().to_string())
//                 .find(|s| s.contains("myanimelist"))
//                 .unwrap_or("".to_string());
//             let anime_season_vec: AnimeSeason = AnimeSeason {
//                 _season: anime["animeSeason"]["season"].to_string(),
//                 _year: anime["animeSeason"]["year"].to_string(),
//             };
//             let synonyms_vec: Vec<String> = anime["synonyms"]
//                 .as_array()
//                 .unwrap()
//                 .iter()
//                 .map(|syn| syn.as_str().unwrap().to_string())
//                 .collect();
//             let related_anime_vec: Vec<String> = anime["relatedAnime"]
//                 .as_array()
//                 .unwrap()
//                 .iter()
//                 .filter_map(|url| {
//                     let url_str = url.as_str().unwrap();
//                     if url_str.contains("myanimelist") {
//                         Some(url_str.to_string())
//                     } else {
//                         None
//                     }
//                 })
//                 .collect();
//             let anime_tags: Vec<String> = anime["tags"]
//                 .as_array()
//                 .unwrap()
//                 .iter()
//                 .map(|t| t.as_str().unwrap().to_string())
//                 .collect();
//
//             let anime_vec: Anime = Anime {
//                 _source: sources,
//                 _title: anime["title"].to_string(),
//                 _anime_type: anime["type"].to_string(),
//                 _episodes: anime["episodes"].to_string(),
//                 _status: anime["status"].to_string(),
//                 _anime_season: anime_season_vec,
//                 _picture: anime["picture"].to_string(),
//                 _thumbnail: anime["thumbnail"].to_string(),
//                 _synonyms: synonyms_vec,
//                 _related_anime: related_anime_vec,
//                 _tags: anime_tags,
//             };
//
//             if episode_number == "" {
//                 // remove any numbers from the title
//                 let re = Regex::new(r"\d+").unwrap();
//                 let mut current_title_without_numbers: Option<String> = None;
//                 if let Some(mat) = re.find(current_episode_title) {
//                     current_title_without_numbers = Some(
//                         current_episode_title
//                             .replace(&mat.as_str(), "")
//                             .trim()
//                             .to_string(),
//                     );
//                 }
//
//                 match matcher.fuzzy_match(
//                     &title.to_lowercase(),
//                     &current_title_without_numbers
//                         .unwrap_or((&current_episode_title).to_string().to_lowercase()),
//                 ) {
//                     Some(score) => {
//                         println!("Score for '{}': {}", title, score);
//                         if score > _highest_score {
//                             _highest_score = score;
//                             _best_match = Some(title);
//                             best_match_data = Some(anime_vec);
//                         }
//                     }
//                     None => { /*println!("No match for '{}'", title) */ }
//                 }
//             } else if episode_number != "" {
//                 if let Some(score) = matcher.fuzzy_match(&title, &main_anime_name) {
//                     if score > _highest_score {
//                         _highest_score = score;
//                         _best_match = Some(title);
//                         best_match_data = Some(anime_vec);
//                         println!("{}", title);
//                     }
//                 }
//             } else {
//                 if episode_number != "" {
//                     println!("{:?}", _best_match);
//                     return format!(
//                         "Error: Could not find data for new_episode_title: {}",
//                         new_episode_title
//                     );
//                 } else {
//                     println!("{:?}", _best_match);
//                     return format!(
//                         "Error: Could not find data for current_episode_title: {}",
//                         current_episode_title
//                     );
//                 }
//             }
//         }
//     } else {
//         return format!(
//             "Error: An Error occurred trying to find {}!",
//             current_episode_title
//         );
//     }
//
//     let new_re = Regex::new(r#"\\""#).unwrap();
//     let arabic_re = Regex::new(r"[\u0600-\u06FF]").unwrap();
//
//     let data = match best_match_data {
//         Some(ref anime) => {
//             let anime_json = serde_json::to_string_pretty(&anime);
//             match anime_json {
//                 Ok(anime_json) => {
//                     let lines: Vec<&str> = anime_json.lines().collect();
//                     let filtered_lines: Vec<&str> = lines
//                         .into_iter()
//                         .filter(|line| !arabic_re.is_match(&line))
//                         .collect();
//                     let joined_filtered_json = filtered_lines.join("\n");
//                     let cleaned_json = new_re.replace_all(&joined_filtered_json, ""); // Replace with an empty string
//                     cleaned_json.to_string()
//                 }
//                 Err(e) => format!("{}", e),
//             }
//         }
//         None => return format!("Error: Anime Data is None!"),
//     };
//
//     data
// }
//
// #[allow(dead_code)]
// async fn read_toml_lines<P>(filename: P) -> io::Result<io::Lines<io::BufReader<File>>>
// where
//     P: AsRef<Path>,
// {
//     let file = File::open(filename)?;
//     Ok(io::BufReader::new(file).lines())
// }
//
// #[allow(dead_code)]
// #[tauri::command]
// async fn check_mal_config(anime_data: String, episode_number: u32) {
//     if anime_data.is_empty() {
//         println!("Error: anime_data was not specified!");
//         return;
//     }
//
//     // parse the anime_data json as the Anime struct
//     let data: Anime = serde_json::from_str(&anime_data).unwrap();
//     let anime_id = match data._source.rsplit_once('/') {
//         Some((_url, id)) => id,
//         None => "",
//     };
//
//     // MARKING FOR IF THIS SHIT BREAKS MY APP 
//     let mut lines_vec: Vec<String> = Vec::new();
//     if let Ok(lines) = read_toml_lines("./mal.toml").await {
//         for token in lines.map_while(Result::ok) {
//                 if token.contains(&"mal_access_token".to_string()) {
//                     let split = token.split('=').collect::<Vec<&str>>();
//                     lines_vec.push(split[1].trim().to_string());
//                 }
//                 if token.contains(&"mal_refresh_token".to_string()) {
//                     let split = token.split('=').collect::<Vec<&str>>();
//                     lines_vec.push(split[1].trim().to_string());
//                 }
//                 if token.contains(&"mal_token_expires_at".to_string()) {
//                     let split = token.split('=').collect::<Vec<&str>>();
//                     lines_vec.push(split[1].trim().to_string());
//             }
//         }
//     }
//
//     lines_vec.iter_mut().for_each(|line| {
//         *line = line.trim_matches('\"').to_string();
//     });
//
//     if lines_vec.is_empty() {
//         let client_id = "7e2bbcc2ee9bd135cc6c0bca185132ac".to_string();
//         let client_secret =
//             "af749aa2e34194d2744c0c082a0e9d7bd71732ec226d67946d82c8167e80cdcc".to_string();
//         let redirect_url = "https://github.com/aramrw/mpv-shelf".to_string();
//
//         let authenticated_client = OauthClient::load_from_values(
//             lines_vec[0].clone(),
//             lines_vec[1].clone(),
//             client_id,
//             Some(client_secret),
//             redirect_url,
//             lines_vec[2]
//                 .parse::<u64>()
//                 .expect("Failed to parse string to u64"),
//         );
//
//         match authenticated_client {
//             Ok(client) => {
//                 println!(
//                     "Authorized OAuth. Updating: {}/{} to episode: {}",
//                     data._title, anime_id, episode_number
//                 );
//                 if !anime_id.is_empty() {
//                     update_anime(anime_id.parse::<u32>().unwrap(), episode_number, &client).await;
//                 }
//             }
//             Err(e) => {
//                 println!("{}", e);
//                 link_my_anime_list().await;
//             }
//         }
//     }
// }
//
// async fn update_anime(
//     anime_id: u32,
//     episode_number: u32,
//     oauth_client: &OauthClient<Authenticated>,
// ) {
//     let anime_api_client = AnimeApiClient::from(oauth_client);
//     //let manga_api_client = MangaApiClient::from(oauth_client);
//     //let user_api_client = UserApiClient::from(oauth_client);
//
//     // Update Anime from anime_id
//     // Pass the anime id to the builder.
//     let query = UpdateMyAnimeListStatus::builder(anime_id)
//         .num_watched_episodes(episode_number)
//         .build()
//         .unwrap();
//     let response = anime_api_client.update_anime_list_status(&query).await;
//     if let Ok(response) = response {
//         println!("Response: {}\n", response);
//     }
// }
//
// async fn link_my_anime_list() {
//     let client_id = "7e2bbcc2ee9bd135cc6c0bca185132ac".to_string();
//     let client_secret =
//         "af749aa2e34194d2744c0c082a0e9d7bd71732ec226d67946d82c8167e80cdcc".to_string();
//     let redirect_url = "https://github.com/aramrw/mpv-shelf".to_string();
//     let mut oauth_client =
//         OauthClient::new(&client_id, Some(&client_secret), &redirect_url).unwrap();
//     println!("Visit this URL: {}\n", oauth_client.generate_auth_url());
//
//     let mut input = String::new();
//     println!("After authorizing, please enter the URL you were redirected to: ");
//     io::stdin()
//         .read_line(&mut input)
//         .expect("Failed to read user input");
//
//     let response = RedirectResponse::try_from(input).unwrap();
//
//     // Authentication process
//     let result = oauth_client.authenticate(response).await;
//     let authenticated_oauth_client = match result {
//         Ok(t) => {
//             println!("Got token: {:?}\n", t.get_access_token_secret());
//
//             let t = t.refresh().await.unwrap();
//             println!("Refreshed token: {:?}", t.get_access_token_secret());
//             t
//         }
//         Err(e) => panic!("Failed: {}", e),
//     };
//
//     authenticated_oauth_client
//         .save_to_config("./mal.toml")
//         .unwrap();
//
//     //let anime_api_client = AnimeApiClient::from(&authenticated_oauth_client);
//     //let _manga_api_client = MangaApiClient::from(&authenticated_oauth_client);
// }
//
//
//
//
