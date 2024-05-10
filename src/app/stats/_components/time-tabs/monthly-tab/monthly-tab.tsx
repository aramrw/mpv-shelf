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

export default function MonthlyTab() {
  const [stats, setStats] = useState<number[]>();

  useEffect(() => {
    getCurrentUserGlobal().then((user) => {
      invoke("create_chart_stats", { range: "monthly", userId: user?.userId }).then(
        (daily) => {
          console.log("daily : " + daily);
          setStats(daily as number[]);
        },
      );
    });
  }, []);

  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: " Hours Watched ",
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
    <Card>
      <CardHeader>
        <CardTitle className="pointer-events-none select-none">
          Monthly
        </CardTitle>
        <CardDescription className="underline pointer-events-none select-none">
          Last Updated : {new Date().toLocaleDateString()} @{" "}
          {new Date().toLocaleTimeString()}{" "}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="w-fit h-fit">
          <Bar data={data} />
        </div>
      </CardContent>
    </Card>
  );
}
