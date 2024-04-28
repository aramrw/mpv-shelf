import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WeeklyTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly</CardTitle>
        <CardDescription>
          Track your weekly reading progress here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2"></CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}
