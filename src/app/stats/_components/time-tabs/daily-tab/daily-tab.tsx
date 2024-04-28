"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DailyTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily</CardTitle>
        <CardDescription>
          Set goals & track your daily reading progress here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <h1 className="text-sm font-bold">Updated Today</h1>
        {/*
  <div className="py-1 max-h-56 overflow-auto max-w-52 rounded-md flex flex-col justify-self-auto items-start gap-2 shadow-md outline outline-secondary">
    dailyMangaFolders.map((manga, index) => (
      <MangaCard key={index} mangaFolder={manga} />
    ))
  </div>
  */}
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}
