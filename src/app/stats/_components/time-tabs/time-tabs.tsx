import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTab from "./daily-tab/daily-tab";
import WeeklyTab from "./weekly-tab/weekly-tab";
import MonthlyTab from "./monthly-tab/monthly-tab";
import YearlyTab from "./yearly-tab/yearly-tab";
import { Lock } from "lucide-react";

export default function TimeTabs() {
  return (
    <div className="opacity-50 w-full h-fit flex flex-row justify-center items-center pointer-events-none">
      <div className="fixed left-49">
					<Lock  className="w-24 h-24"/>
      </div>
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <DailyTab />
        </TabsContent>
        <TabsContent value="weekly">
          <WeeklyTab />
        </TabsContent>
        <TabsContent value="monthly">
          <MonthlyTab />
        </TabsContent>
        <TabsContent value="yearly">
          <YearlyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
