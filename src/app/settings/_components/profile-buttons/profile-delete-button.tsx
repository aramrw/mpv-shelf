import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User } from "@prisma/client";
import { ConfirmDeleteProfile } from "../confirm";
import { useRouter } from "next/navigation";
import { Delete } from "lucide-react";
import { setCurrentUserGlobal } from "../../../../../lib/prisma-commands/global/global-cmds";
import { invoke } from "@tauri-apps/api/tauri";

export default function ProfileDeleteButton({
  currentUser,
  formState,
}: {
  currentUser: User;
  formState: any;
}) {

  let router = useRouter();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={700}>
        <TooltipTrigger
          asChild
          className="flex w-full cursor-pointer flex-row items-center justify-center text-base"
        >
          <Button
            variant="destructive"
            className={cn(
              "select-none w-3/4 py-[1px] h-fit  flex flex-row justify-center items-center rounded-sm gap-1 pb-1",
              formState?.fontSize === "Medium" && "text-lg",
              formState?.fontSize === "Large" && "text-xl",
              formState?.fontSize === "XLarge" && "text-2xl",
            )}
            onClick={() => {
              ConfirmDeleteProfile().then((res: any) => {
                if (res) {
                  if (currentUser?.id) {
                    //router.prefetch('/');
                    invoke("delete_user", {
                      userId: currentUser.id,
                    }).then(() => {
                      setCurrentUserGlobal({
                        userId: -1,
                      })
                        .finally(() => {
                          router.push("/");
                        });
                    });
                  }
                }
              });
            }}
          >
            Delete Profile
            <Delete
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
                  Deletes your profile and
                </span>
                <b className="text-destructive underline">
                  all associated data.
                </b>
              </div>
              <b className="rounded-sm bg-accent px-1">
                {" "}
                This action is irreversible.
              </b>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
