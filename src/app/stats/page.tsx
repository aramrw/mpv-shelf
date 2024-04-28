import MainStats from "./_components/main-stats";
import TimeTabs from "./_components/time-tabs/time-tabs";

export default function StatsPage() {
  return (
    <main className="w-full h-full flex flex-col justify-start items-center p-5 gap-4 md:px-30 lg:px-16 xl:px-36 2xl:px-48">
			<MainStats />
      <TimeTabs />
    </main>
  );
}
