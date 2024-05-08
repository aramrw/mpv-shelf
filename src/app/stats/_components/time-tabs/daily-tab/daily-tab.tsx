"use client";

import {
  Card,
  CardContent,
  CardDescription,
  //CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DailyTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="pointer-events-none select-none">Daily</CardTitle>
        <CardDescription className="underline pointer-events-none select-none">
          Last Updated : {new Date().toLocaleDateString()} @{" "}
          {new Date().toLocaleTimeString()}        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <h1 className="text-sm font-bold pointer-events-none select-none">
          Updated Today
        </h1>
      </CardContent>
    </Card>
  );
}
