import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { closeDatabase } from "../../../../../lib/prisma-commands/misc-cmds";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
"react";


export default function AddNewProfileButton({ formState, router }: { formState: any, router: AppRouterInstance  }) {
  return (
    <Button
      variant="outline"
      className={cn(
        "select-none w-1/2 py-1 h-1/4 flex flex-row justify-center items-center gap-1",
        formState?.fontSize === "Medium" && "text-lg",
        formState?.fontSize === "Large" && "text-xl",
        formState?.fontSize === "XLarge" && "text-2xl",
      )}
      onClick={() => {
        //router.prefetch('/');
        closeDatabase().then(() => {
          router.push("/profiles/newUser");
        });
      }}
    >
      Add New Profile
      <UserPlus
        className={cn(
          "h-auto w-4 cursor-pointer",
          formState?.fontSize === "Medium" && "h-auto w-5",
          formState?.fontSize === "Large" && "h-auto w-6",
          formState?.fontSize === "XLarge" && "h-auto w-7",
        )}
      />
    </Button>
  );
}
