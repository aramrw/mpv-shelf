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

export default function TimeTabs() {
  return (
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
  );
}
