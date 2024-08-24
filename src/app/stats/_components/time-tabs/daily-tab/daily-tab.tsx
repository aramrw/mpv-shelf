"use client";

import {
  Card,
  CardContent,
  CardDescription,
  //CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/tauri";
import "chart.js/auto";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { getCurrentUserGlobal } from "../../../../../../lib/prisma-commands/global/global-cmds";
import { Video } from "@prisma/client";
import RecentCard from "./recent-card";

export default function DailyTab() {

  const [stats, setStats] = useState<number[]>();
  const [recentlyWatched, setRecentlyWatched] = useState<Video[]>();

  useEffect(() => {
    getCurrentUserGlobal().then((user) => {
      invoke("create_chart_stats", { range: "daily", userId: user?.userId }).then((daily) => {
        //console.log("daily : " + daily);
        setStats(daily as number[]);
      });
      invoke("recently_watched", { userId: user?.userId }).then((res) => {
        //console.log(`recently watched: ${res as Video[]}`);
        setRecentlyWatched(res as Video[]);
      });
    })
  }, [])

  const data = {
    labels: [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ],
    datasets: [
      {
        label: " Watchtime Per Day (H) ",
        data: stats,
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(255, 159, 64, 0.2)",
          "rgba(255, 205, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(201, 203, 207, 0.2)",
        ],
        borderColor: [
          "rgb(255, 99, 132)",
          "rgb(255, 159, 64)",
          "rgb(255, 205, 86)",
          "rgb(75, 192, 192)",
          "rgb(54, 162, 235)",
          "rgb(153, 102, 255)",
          "rgb(201, 203, 207)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Card className="h-96 flex flex-col justify-start items-start md:flex-row md:h-fit overflow-auto">
      <div className="w-fit">
        <CardHeader className="w-fit">
          <CardTitle className="pointer-events-none select-none w-fit">Daily</CardTitle>
          <CardDescription className="underline pointer-events-none select-none">
            Last Updated : {new Date().toLocaleDateString()} @{" "}
            {new Date().toLocaleTimeString()}{" "}
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full h-fit space-y-1 flex flex-row items-center">
          <div className="w-fit h-fit" id="CHART_PARENT_DIV">
            <Bar data={data} className="h-fit" id="CHART_GRAPH" />
          </div>
        </CardContent>
      </div>
      <div className="w-full h-full flex flex-col justify-center items-start select-none px-6 pb-4">
        <CardHeader className="w-fit pt-0 pl-0 md:pt-6">
          <CardTitle className="pointer-events-none select-none w-fit">Recently Updated</CardTitle>
        </CardHeader>
        <ul className="
					min-w-2/3 max-w-96 flex flex-col items-start justify-self-start 
					max-h-44 overflow-y-auto gap-2 p-2 rounded-sm 
					shadow-md outline outline-zinc-100">
          {recentlyWatched?.map((vid, i) => (
            <RecentCard key={i} item={vid} />
          ))}
        </ul>
      </div>
    </Card>
  );
}
