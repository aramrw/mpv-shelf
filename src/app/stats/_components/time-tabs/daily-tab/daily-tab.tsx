"use client";

import {
  Card,
  CardContent,
  CardDescription,
  //CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import "chart.js/auto";
import { Bar } from "react-chartjs-2";

export default function DailyTab() {
  const data = {
    labels: [
      "12 am",
      "1 am",
      "2 am",
      "3 am",
      "4 am",
      "5 am",
      "6 am",
      "7 am",
      "8 am",
      "9 am",
      "10 am",
      "11 am",
      "12 pm",
      "1 pm",
      "2 pm",
      "3 pm",
      "4 pm",
      "5 pm",
      "6 pm",
      "7 pm",
      "8 pm",
      "9 pm",
      "10 pm",
      "11 pm",
    ],
    datasets: [
      {
        label: " Watch Time (M) ",
        data: [1, 2, 0.5, 0.3, 0.1],
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
        <CardTitle className="pointer-events-none select-none">Daily</CardTitle>
        <CardDescription className="underline pointer-events-none select-none">
          Last Updated : {new Date().toLocaleDateString()} @{" "}
          {new Date().toLocaleTimeString()}{" "}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <h1 className="text-sm font-bold pointer-events-none select-none">
          Updated Today
        </h1>
        <div className="w-fit h-fit">
          <Bar data={data} />
        </div>
      </CardContent>
    </Card>
  );
}
