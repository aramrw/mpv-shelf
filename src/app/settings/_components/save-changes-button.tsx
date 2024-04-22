import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import React from "react";

export default function SaveChangesButton({
  formState,
  savedChanges,
  savedChangesFormState,
  setSavedChanges,
  setSavedChangesFormState,
}: {
  formState: any;
  savedChanges: boolean;
  savedChangesFormState: any;
  setSavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  setSavedChangesFormState: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <AnimatePresence mode="wait">
      {savedChanges ? (
        <motion.div
          key="saved"
          className="flex w-full flex-row items-center gap-2 text-base"
          initial={formState.animations === "On" ? { opacity: 0 } : undefined}
          animate={formState.animations === "On" ? { opacity: 1 } : undefined}
          exit={formState.animations === "On" ? { opacity: 0 } : undefined}
          transition={
            formState.animations === "On" ? { duration: 0.5 } : undefined
          }
        >
          <Button
            variant="outline"
            className={cn(
              "mx-2 select-none transition-all flex flex-row justify-center items-center gap-1 text-base ",
              formState?.fontSize === "Medium" && "text-lg",
              formState?.fontSize === "Large" && "text-xl",
              formState?.fontSize === "XLarge" && "text-2xl",
            )}
            type="submit"
          >
            <Check
              className={cn(
                "h-5/6 w-4",
                formState?.fontSize === "Medium" && "h-auto w-5",
                formState?.fontSize === "Large" && "h-auto w-6",
                formState?.fontSize === "XLarge" && "h-auto w-7",
              )}
            />
            Saved Changes
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="save"
          className="flex w-full flex-row items-center gap-2 text-base"
          initial={formState.animations === "On" ? { opacity: 0 } : undefined}
          animate={formState.animations === "On" ? { opacity: 1 } : undefined}
          exit={formState.animations === "On" ? { opacity: 0 } : undefined}
          transition={
            formState.animations === "On" ? { duration: 0.5 } : undefined
          }
        >
          <Button
            variant="outline"
            className={cn(
              "mx-2 select-none transition-all text-base",
              formState?.fontSize === "Medium" && "text-lg",
              formState?.fontSize === "Large" && "text-xl",
              formState?.fontSize === "XLarge" && "text-2xl",
              formState !== savedChangesFormState &&
              "animate-pulse duration-400",
            )}
            type="submit"
            onClick={() => {
              setSavedChanges(true);
              setSavedChangesFormState(formState);
            }}
          >
            Save
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
