import { cn } from "@/lib/utils";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, PenLine, Repeat2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ApplicationSection({
  formState,
  setFormState,
}: {
  formState: any;
  setFormState: (value: any) => void;
}) {
  return (
    <li className="flex h-fit flex-col justify-center bg-muted outline outline-zinc-200">
      <h1 className="select-none bg-accent p-1 font-bold">
        Application
      </h1>
      <ul className="flex flex-col gap-3 p-2.5">
        <li className="flex h-fit w-full items-center justify-between bg-muted">
          <div className="flex w-full flex-row items-center justify-start gap-1">
            <h1 className="w-fit select-none font-medium">Auto Play</h1>
            <Repeat2
              className={cn(
                "h-auto w-4 stroke-[2.5]",
                formState?.fontSize === "Medium" && "h-auto w-[18px]",
                formState?.fontSize === "Large" && "h-auto w-5",
                formState?.fontSize === "XLarge" && "h-auto w-6",
              )}
            />
          </div>
          <select
            className="w-full cursor-pointer rounded-sm bg-accent font-medium"
            name="autoPlay"
            value={formState.autoPlay}
            onChange={(e) => {
              setFormState({ ...formState, autoPlay: e.target.value });
            }}
          >
            <option className="font-medium">On</option>
            <option className="font-medium">Off</option>
          </select>
        </li>
        <li className="flex h-fit w-full justify-between bg-muted">
          <TooltipProvider>
            <Tooltip delayDuration={400}>
              <div className="flex w-full flex-row gap-1">
                <TooltipTrigger className="flex w-full flex-row items-center justify-start gap-1">
                  <Info
                    className={cn(
                      "h-auto w-3",
                      formState?.fontSize === "Medium" && "h-auto w-4",
                      formState?.fontSize === "Large" && "h-auto w-4",
                      formState?.fontSize === "XLarge" && "h-auto w-5",
                    )}
                  />
                  <h1 className="select-none font-medium">Auto Rename</h1>
                  <PenLine
                    className={cn(
                      "h-auto w-3.5 stroke-[2.5]",
                      formState?.fontSize === "Medium" && "h-auto w-4",
                      formState?.fontSize === "Large" && "h-auto w-5",
                      formState?.fontSize === "XLarge" && "h-auto w-6",
                    )}
                  />
                </TooltipTrigger>
              </div>
              <TooltipContent
                align="start"
                side="bottom"
                className={cn(
                  "select-none flex text-center cursor-pointer",
                  formState?.fontSize === "Medium" && "text-md",
                  formState?.fontSize === "Large" && "text-lg",
                  formState?.fontSize === "XLarge" && "text-xl",
                )}
              >
                <div className="font-medium">
                  <span className="rounded-sm px-1 font-bold underline">
                    Rename Subtitle Files (to Match Videos)
                  </span>
                  <br />
                  <span className="font-semibold">
                    Subtitle files must be in the directory as the video files
                  </span>
                  <br />
                  <span className="font-semibold">
                    for mpv to match them to a video.
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <select
            className="w-full cursor-pointer rounded-sm bg-accent font-medium"
            name="autoRename"
            value={formState.autoRename}
            onChange={(e) => {
              setFormState({ ...formState, autoRename: e.target.value });
            }}
          >
            <option className="font-medium">On</option>
            <option className="font-medium">Off</option>
          </select>
        </li>
      </ul>
    </li>
  );
}
