import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WeeklyTab from "./weekly-tab/weekly-tab";
import MonthlyTab from "./monthly-tab/monthly-tab";
import YearlyTab from "./yearly-tab/yearly-tab";

export default function TimeTabs() {
  return (
    <div className="w-full h-fit flex flex-row justify-center items-center">
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
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
