"use client"

import React from 'react'
import { Separator } from "@/components/ui/separator";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { getCurrentUserGlobal } from "../../../../lib/prisma-commands/global/global-cmds";
import { Eye, EyeOff, Folder, Timer, Video } from "lucide-react";

export type MainStatsType = {
  user_id: number;
  total_anime: number;
  total_videos: number;
  videos_remaining: number;
  videos_watched: number;
  watchtime: number,
};

export default function MainStats() {
  const [mainStats, setMainStats] = useState<MainStatsType>();

  useEffect(() => {
    getCurrentUserGlobal().then((user) => {
      invoke("update_global_stats", { userId: user?.userId }).then((stats) => {
        if (stats) {
          setMainStats(stats as MainStatsType);
          console.log(stats);
        }
      });
    });
  }, []);

  function calculateTimeSpentWatching(time: number | undefined) {
    if (time && time > 60) {
      const minutes = Math.floor(time / 60);
      if (time > 3600) {
        const hours = Math.floor(time / 3600)
        return `${hours}h ${Math.floor(minutes % 60)}m`
      }
      const seconds = time % 60;
      return `${minutes}m ${seconds}s`;
    } else if (time) {
      return `${time}s`;
    } else {
      return "0s";
    }
  }

  return (
    <div className="w-full flex flex-col justify-center items-center h-fit bg-card rounded-sm shadow-sm outline outline-border p-2 select-none">
      <h1 className="font-bold rounded-md px-1 text-sm md:text-lg lg:text-xl">Total Stats</h1>
      <Separator className="h-[2px] w-1/5 my-1.5 mr-0.5" />
      <ul className="w-full flex flex-row justify-center items-start gap-2 md:gap-4 lg:gap-6 pb-0.5">
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs md:text-sm lg:text-base bg-muted px-2 pb-1.5 pt-0.5 rounded-md pointer-events-none select-none outline outline-zinc-200">
          <label className="font-semibold underline flex flex-row gap-1">
            <span className="text-xs md:text-sm lg:text-base">Folders</span>
            <Folder className="w-3 h-auto md:w-[14px] lg:w-[18px]" />
          </label>
          <span className="font-medium bg-accent rounded-sm px-0.5 flex flex-row justify-center items-center">
            {mainStats?.total_anime}
          </span>
        </li>
        <Separator className="min-w-[1.5px] max-w-[1.9px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs md:text-sm lg:text-base bg-muted px-2 pb-1.5 pt-0.5 rounded-md pointer-events-none select-none outline outline-zinc-200">
          <label className="font-semibold underline flex flex-row gap-1">
            <span className="text-xs md:text-sm lg:text-base">Videos</span>
            <Video className="w-3 h-auto md:w-4 lg:w-5" />
          </label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {mainStats?.total_videos}
          </span>
        </li>
        <Separator className="min-w-[1.9px] max-w-[2.05px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs md:text-sm lg:text-base bg-muted px-2 pb-1.5 pt-0.5 rounded-md pointer-events-none select-none outline outline-zinc-200">
          <label className="font-semibold underline flex flex-row gap-1">
            <span className="text-xs md:text-sm lg:text-base">Watched</span>
            <Eye className="w-3 h-auto md:w-4 lg:w-5" />
          </label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {mainStats?.videos_watched}
          </span>
        </li>
        <Separator className="min-w-[2.1px] max-w-[2px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs md:text-sm lg:text-base bg-muted px-2 pb-1.5 pt-0.5 rounded-md pointer-events-none select-none outline outline-zinc-200">
          <label className="font-semibold underline flex flex-row gap-1">
            <span className="text-xs md:text-sm lg:text-base">Remaining</span>
            <EyeOff className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
          </label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {mainStats?.videos_remaining}
          </span>
        </li>
        <Separator className="min-w-[2.1px] max-w-[2px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs md:text-sm lg:text-base bg-muted px-2 pb-1.5 pt-0.5 rounded-md pointer-events-none select-none outline outline-zinc-200">
          <label className="font-semibold underline flex flex-row gap-1">
            <span className="text-xs md:text-sm lg:text-base">Watch Time</span>
            <Timer className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
          </label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {calculateTimeSpentWatching(mainStats?.watchtime)}
          </span>
        </li>
      </ul>
    </div>
  );
}

