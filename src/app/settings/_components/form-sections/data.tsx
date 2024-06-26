import { cn } from "@/lib/utils";
import { User } from "@prisma/client";
import { ArrowRightFromLine, Database, Download, Upload } from "lucide-react";

import {
    turnOnPin,
    updateUserPin,
} from "../../../../../lib/prisma-commands/settings/setting-cmds";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/tauri";

export default function DataSection({
    formState,
    currentUser,
    setFormState,
    setSavedChanges,
    setSavedChangesFormState,
    setCurrentUser,
}: {
    formState: any;
    currentUser: User | undefined;
    setFormState: (value: any) => void;
    setSavedChanges: (value: boolean) => void;
    setSavedChangesFormState: (value: any) => void;
    setCurrentUser: (value: User) => void;
}) {

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
                    <div className="flex flex-row items-center justify-center gap-2">
                        <Button className="flex flex-row gap-1 py-0.5" variant="outline">
                            <span>Import</span>
                            <Upload
                                className={cn(
                                    "h-auto w-4",
                                    formState?.fontSize === "Medium" && "h-auto w-4",
                                    formState?.fontSize === "Large" && "h-auto w-5",
                                    formState?.fontSize === "XLarge" && "h-auto w-6",
                                )}
                            />
                        </Button>
                        <Button className="flex flex-row gap-1 py-0.5" variant="outline"
                            onClick={() => invoke("export_data", { userId: currentUser?.id })}
                        >
                            <span>Export</span>
                            <Download
                                className={cn(
                                    "h-auto w-4",
                                    formState?.fontSize === "Medium" && "h-auto w-4",
                                    formState?.fontSize === "Large" && "h-auto w-5",
                                    formState?.fontSize === "XLarge" && "h-auto w-6",
                                )}
                            />
                        </Button>
                    </div>
                </li>
            </ul>
        </li>
    )
}