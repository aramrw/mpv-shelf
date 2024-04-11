import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/tauri";

export default function ProfileDeleteButton({
  formState,
}: {
  formState: any;
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={700}>
        <TooltipTrigger
          asChild
          className="flex w-full cursor-pointer flex-row items-center justify-center text-base"
        >
          <Button
            variant="secondary"
            className={cn(
              "select-none w-3/4 py-[1px] h-fit flex flex-row justify-center items-center rounded-sm gap-1 pb-1 bg-blue-500 text-white hover:bg-blue-400",
              formState?.fontSize === "Medium" && "text-lg",
              formState?.fontSize === "Large" && "text-xl",
              formState?.fontSize === "XLarge" && "text-2xl",
            )}
            onClick={() => {
              // invoke to the backend to link the user to MAL
              invoke("check_mal_config");
            }}
          >
            Link to MAL
          </Button>
        </TooltipTrigger>
        <TooltipContent
          align="center"
          side="bottom"
          className={cn(
            "select-none flex gap-1",
            formState?.fontSize === "Medium" && "text-md",
            formState?.fontSize === "Large" && "text-lg",
            formState?.fontSize === "XLarge" && "text-xl",
          )}
        >
          <div className="font-medium">
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex flex-row gap-0.5">
                <span className="rounded-sm font-bold">
                  {" "}
                  Link your profile to
                </span>
                <b className="cursor-pointer text-blue-600 text-primary underline transition-colors duration-200 hover:text-blue-900">
                  MyAnimeList
                </b>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
