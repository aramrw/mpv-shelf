import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User } from "@prisma/client";
import { open } from "@tauri-apps/api/dialog";
import { updateProfilePicture } from "../../../../../lib/prisma-commands/settings/setting-cmds";
import { Images } from "lucide-react";

export default function ProfilePictureButton({
  currentUser,
  formState,
}: {
  currentUser: User;
  formState: any;
}) {
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
              "select-none  h-full w-3/4 p-0 flex gap-1 pb-1",
              formState?.fontSize === "Medium" && "text-lg",
              formState?.fontSize === "Large" && "text-xl",
              formState?.fontSize === "XLarge" && "text-2xl",
            )}
            onClick={() => {
              // open a dialog to select a new profile picture
              open({
                directory: false,
                multiple: false,
                filters: [
                  {
                    name: "Image",
                    extensions: ["png", "jpeg", "jpg", "gif"],
                  },
                ],
                title: "Select Profile Picture",
              }).then((result) => {
                if (result && currentUser) {
                  updateProfilePicture({
                    userId: currentUser?.id,
                    imagePath: result?.toString(),
                  }).then(() => {
                    if (currentUser) {
                      window.location.reload();
                    }
                  });
                }
              });
            }}
          >
            Change Avatar
            <Images
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
          side="bottom"
          className={cn(
            "select-none flex gap-1",
            formState?.fontSize === "Medium" && "text-lg",
            formState?.fontSize === "Large" && "text-xl",
            formState?.fontSize === "XLarge" && "text-2xl",
          )}
        >
          <div className="text-center font-medium">
            <span className="">
              Click to change your <b>profile picture</b>.
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
