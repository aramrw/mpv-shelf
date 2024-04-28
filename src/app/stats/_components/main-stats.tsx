"use client";

import { Separator } from "@/components/ui/separator";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { getCurrentUserGlobal } from "../../../../lib/prisma-commands/global/global-cmds";

export type MainStatsType = {
  user_id: number;
  total_anime: number;
  total_videos: number;
  videos_remaining: number;
  videos_watched: number;
};

export default function MainStats() {
  const [mainStats, setMainStats] = useState<MainStatsType>();

  useEffect(() => {
    getCurrentUserGlobal().then((user) => {
      invoke("create_stats", { userId: user?.userId }).then((stats) => {
        if (stats) {
          setMainStats(stats as MainStatsType);
          //console.log(stats);
        }
      });
    });
  }, []);

  useEffect(() => {
    console.log(mainStats);
  }, [mainStats]);

  function calculateTimeSpentWatching(time: number | undefined) {
    // if time (seconds) is greater than a minute render both minutes and seconds
    // else render only seconds
    if (time && time > 60) {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      return `${minutes}m ${seconds}s`;
    } else if (time) {
      return `${time}s`;
    } else {
      return "0s";
    }
  }

  return (
    <div className="w-full flex flex-col justify-center items-center h-fit bg-card rounded-xl shadow-md outline outline-border p-2">
      <h1 className="font-bold rounded-md px-1">Main Stats</h1>
      <Separator className="h-[1.1px] w-1/5 mb-1.5 mr-0.5" />
      <ul className="flex flex-row justify-center items-start gap-3 pb-0.5">
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs bg-muted px-2 pb-1.5 pt-0.5 rounded-md">
          <label className="font-semibold underline">Total Anime</label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {mainStats?.total_anime}
          </span>
        </li>
        <Separator className="w-[1.1px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs bg-muted px-2 pb-1.5 pt-0.5 rounded-md">
          <label className="font-semibold underline">Total Videos</label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {mainStats?.total_videos}
          </span>
        </li>
        <Separator className="w-[1px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs bg-muted px-2 pb-1.5 pt-0.5 rounded-md">
          <label className="font-semibold underline">Videos Watched</label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {mainStats?.videos_watched}
          </span>
        </li>
        <Separator className="w-[1.1px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs bg-muted px-2 pb-1.5 pt-0.5 rounded-md">
          <label className="font-semibold underline">Videos Remaining</label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {mainStats?.videos_remaining}
          </span>
        </li>
        <Separator className="w-[1.1px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs bg-muted px-2 pb-1.5 pt-0.5 rounded-md">
          <label className="font-semibold underline">Watch Time</label>
          <span className="font-medium bg-accent rounded-sm px-0.5"></span>
        </li>
      </ul>
    </div>
  );
}
