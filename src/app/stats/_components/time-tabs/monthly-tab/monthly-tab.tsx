import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MonthlyTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly</CardTitle>
        <CardDescription>
          Track your monthly reading progress here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2"></CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}
