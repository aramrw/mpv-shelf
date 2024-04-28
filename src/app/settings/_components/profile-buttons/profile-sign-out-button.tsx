import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@prisma/client";
// import { SettingSchema } from "../../page";

export default function ProfileSignOutButton({ currentUser, formState, handleUserGlobal }: { currentUser: User, formState: any, handleUserGlobal: () => void }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={1000}>
        <TooltipTrigger
          asChild
          className="flex w-full cursor-pointer flex-row items-center justify-center text-base"
        >
          <Button
            variant="outline"
            className={cn(
              "select-none h-full w-3/4 p-0 flex gap-1 pb-1",
              formState?.fontSize === "Medium" && "text-lg",
              formState?.fontSize === "Large" && "text-xl",
              formState?.fontSize === "XLarge" && "text-2xl",
            )}
            onClick={() => {
              handleUserGlobal();
            }}
          >
            Sign Out
            <UserMinus
              className={cn(
                "h-auto w-4 cursor-pointer",
                formState?.fontSize === "Medium" && "h-auto w-5",
                formState?.fontSize === "Large" && "h-auto w-6",
                formState?.fontSize === "XLarge" && "h-auto w-7",
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          className={cn(
            "select-none flex gap-1",
            formState?.fontSize === "Medium" && "text-lg",
            formState?.fontSize === "Large" && "text-xl",
            formState?.fontSize === "XLarge" && "text-2xl",
          )}
        >
          <div className="text-center font-medium">
            <span className="text-center">
              Takes you back to the <b>profile selection screen</b>.
              <br />
              You are currently signed in as <b>User {currentUser?.id}</b>.
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
