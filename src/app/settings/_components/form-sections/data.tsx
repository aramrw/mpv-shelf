import { cn } from "@/lib/utils";
import { User } from "@prisma/client";
import { Database, Download, Info, Loader, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DataSection({
  formState,
  currentUser,
  setFormState,
}: {
  formState: any;
  currentUser: User | undefined;
  setFormState: (value: any) => void;
}) {

  type ImportError = {
    message: string,
    type: string,
  }

  function ErrorToast(e: ImportError, type: string) {
    console.error(e.type);
    toast({
      variant: "destructive",
      title: `Error ${type} Data`,
      description: `${e.message}`,
      duration: 3000,
    });
  }

  return (
    <li className="flex h-fit flex-col justify-center rounded-b-sm bg-muted">
      <h1 className="select-none rounded-t-sm bg-accent p-1 font-bold">
        Data
      </h1>
      <ul className="flex flex-col gap-3 p-2">
        <li className="flex h-fit w-full items-center justify-between bg-muted">
          <div className="flex w-fit flex-row items-start justify-start gap-1">
            <h1 className="w-fit select-none font-medium">Backup</h1>
            <Database
              className={cn(
                "h-auto w-3.5",
                formState?.fontSize === "Medium" && "h-auto w-4",
                formState?.fontSize === "Large" && "h-auto w-5",
                formState?.fontSize === "XLarge" && "h-auto w-6",
              )}
            />
          </div>
          <div className="flex flex-row items-center justify-center gap-2 w-1/2">
            <Button className="flex flex-row gap-1 py-0.5 w-full" variant="outline"
              onClick={
                () => {
                  invoke("import_data", { userId: currentUser?.id, color: currentUser?.color }).then((res) => {
                    if (res === "Ok") {
                      window.location.reload();
                    }
                  }).catch((e) => ErrorToast(e, "Importing"))
                }
              }
            >
              <span
                className={cn(
                  "",
                  formState?.fontSize === "Medium" && "text-lg",
                  formState?.fontSize === "Large" && "text-xl",
                  formState?.fontSize === "XLarge" && "text-2xl",
                )}
              >Import</span>

              <Upload
                className={cn(
                  "h-auto w-3.5",
                  formState?.fontSize === "Medium" && "h-auto w-4",
                  formState?.fontSize === "Large" && "h-auto w-5",
                  formState?.fontSize === "XLarge" && "h-auto w-6",
                )}
              />
            </Button>
            <Button className="flex flex-row gap-1 py-0.5 w-full" variant="outline"
              onClick={
                () => {
                  invoke("export_data", { userId: currentUser?.id }).then((_) => {
                  }).catch((e) => ErrorToast(e, "Exporting")).finally(() => {
                  });
                }
              }
            >
              <span
                className={cn(
                  "",
                  formState?.fontSize === "Medium" && "text-lg",
                  formState?.fontSize === "Large" && "text-xl",
                  formState?.fontSize === "XLarge" && "text-2xl",
                )}
              >Export</span>

              <Download
                className={cn(
                  "h-auto w-3.5",
                  formState?.fontSize === "Medium" && "h-auto w-4",
                  formState?.fontSize === "Large" && "h-auto w-5",
                  formState?.fontSize === "XLarge" && "h-auto w-6",
                )}
              />
            </Button>
          </div>
        </li>
        <li className="flex h-fit w-full bg-muted">
          <TooltipProvider>
            <Tooltip delayDuration={400}>
              <div className="flex w-1/2 flex-row gap-1">
                <TooltipTrigger className="flex w-full flex-row items-center justify-start gap-1">
                  <Info
                    className={cn(
                      "h-auto w-3",
                      formState?.fontSize === "Medium" && "h-auto w-4",
                      formState?.fontSize === "Large" && "h-auto w-4",
                      formState?.fontSize === "XLarge" && "h-auto w-5",
                    )}
                  />
                  <h1 className="select-none font-medium">Persist</h1>
                  <Save
                    className={cn(
                      "h-auto w-3.5",
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
                    Persist (On Delete)
                  </span>
                  <br />
                  <span className="font-semibold">
                    Does not delete stats & data for video files
                  </span>
                  <br />
                  <span className="font-semibold">
                    when removing a folder.
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <select
            className="w-1/2 cursor-pointer rounded-sm bg-accent font-medium"
            name="persistOnDelete"
            value={formState.persistOnDelete}
            onChange={(e) => {
              setFormState({ ...formState, persistOnDelete: e.target.value });
            }}
          >
            <option className="font-medium">On</option>
            <option className="font-medium">Off</option>
          </select>
        </li>
      </ul>
    </li>
  )
}
