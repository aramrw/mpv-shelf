import ResetUserOnLoad from "./_main-components/reset-user-on-load";

export type AnimeData = {
  _source: String,
  _title: String,
  _anime_type: String,
  _episodes: String,
  _status: String,
  _anime_season: [
    _season: String,
    _year: String
  ]
  _picture: String,
  _thumbnail: String,
  _synonyms: String[],
  _related_anime: String[]
  _tags: String[],
}

export default async function Page() {

  return (
    <main className="flex h-1/2 w-full items-center justify-center">
      <ResetUserOnLoad />
    </main>
  )
}





