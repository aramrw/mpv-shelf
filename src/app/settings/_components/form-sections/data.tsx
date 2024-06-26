"use client"
import { cn } from "@/lib/utils";
import { User } from "@prisma/client";
import { Database, Download, Loader, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export default function DataSection({
  formState,
  currentUser,
}: {
  formState: any;
  currentUser: User | undefined;
}) {

  type ImportError = {
    message: string,
    type: string,
  }


  const [isLoading, setIsLoading] = useState<boolean>(false);

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
            <h1 className="w-fit select-none font-medium">Backup Data</h1>
            <Database
              className={cn(
                "h-auto w-4",
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
                  setIsLoading(true)
                  invoke("import_data", { userId: currentUser?.id, color: currentUser?.color }).then((_) => {
                  }).catch((e) => ErrorToast(e, "Importing")).finally(() => {
                    setIsLoading(false);
											window.location.reload();
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
              >Import</span>

              {isLoading ? (
                <Loader
                  className={cn(
                    "h-auto w-4 animate-spin",
                    formState?.fontSize === "Medium" && "h-auto w-4",
                    formState?.fontSize === "Large" && "h-auto w-5",
                    formState?.fontSize === "XLarge" && "h-auto w-6",
                  )}
                />
              ) : (
                <Upload
                  className={cn(
                    "h-auto w-4",
                    formState?.fontSize === "Medium" && "h-auto w-4",
                    formState?.fontSize === "Large" && "h-auto w-5",
                    formState?.fontSize === "XLarge" && "h-auto w-6",
                  )}
                />
              )}
            </Button>
            <Button className="flex flex-row gap-1 py-0.5 w-full" variant="outline"
              onClick={
                () => {
                  setIsLoading(true)
                  invoke("export_data", { userId: currentUser?.id }).then((_) => {
                  }).catch((e) => ErrorToast(e, "Exporting")).finally(() => {
                    setIsLoading(false);
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

              {isLoading ? (
                <Loader
                  className={cn(
                    "h-auto w-4 animate-spin",
                    formState?.fontSize === "Medium" && "h-auto w-4",
                    formState?.fontSize === "Large" && "h-auto w-5",
                    formState?.fontSize === "XLarge" && "h-auto w-6",
                  )}
                />
              ) : (
                <Download
                  className={cn(
                    "h-auto w-4",
                    formState?.fontSize === "Medium" && "h-auto w-4",
                    formState?.fontSize === "Large" && "h-auto w-5",
                    formState?.fontSize === "XLarge" && "h-auto w-6",
                  )}
                />
              )}
            </Button>
          </div>
        </li>
      </ul>
    </li>
  )
}
