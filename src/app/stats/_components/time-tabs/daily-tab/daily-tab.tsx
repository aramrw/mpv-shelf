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
        <CardTitle>Daily</CardTitle>
        <CardDescription>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <h1 className="text-sm font-bold">Updated Today</h1>
      </CardContent>
    </Card>
  );
}
