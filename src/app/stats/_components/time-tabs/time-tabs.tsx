import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WeeklyTab from "./weekly-tab/weekly-tab";
import MonthlyTab from "./monthly-tab/monthly-tab";
import DailyTab from "./daily-tab/daily-tab";

export default function TimeTabs() {
  return (
    <div className="w-full h-fit flex flex-row justify-center items-center">
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Weekly</TabsTrigger>
          <TabsTrigger value="yearly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly">
          <DailyTab />
        </TabsContent>
        <TabsContent value="monthly">
          <WeeklyTab />
        </TabsContent>
        <TabsContent value="yearly">
          <MonthlyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
