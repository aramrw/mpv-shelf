import { cn } from "@/lib/utils";
import { ConfirmChangePin, ConfirmTurnOffPin } from "../confirm";
import { User } from "@prisma/client";
import { Copy, Lock, Unlock } from "lucide-react";
import { writeText } from "@tauri-apps/api/clipboard";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { AlertNoChangesMade } from "../confirm";
import { turnOnPin, updateUserPin } from "../../../../../lib/prisma-commands/settings/setting-cmds";

export default function SecuritySection({
  formState,
  currentUser,
  locked,
  setFormState,
  setSavedChanges,
  setSavedChangesFormState,
  setLocked,
  setCurrentUser,
}: {
  formState: any;
  currentUser: User | undefined;
  locked: boolean;
  setFormState: (value: any) => void;
  setSavedChanges: (value: boolean) => void;
  setSavedChangesFormState: (value: any) => void;
  setLocked: (value: boolean) => void;
  setCurrentUser: (value: User) => void;
}) {
  function ToastClickToSee() {
    toast({
      className: "cursor-pointer",
      title: "Pin Copied!",
      description: `Click to see pin.`,
      duration: 1500,
      onClick: () => {
        if (currentUser?.pin) {
          toast({
            className: "cursor-pointer",
            variant: "destructive",
            style: {
              backdropFilter: "blur(5px)",
              fontWeight: "bold",
            },
            description: `UserID: ${currentUser.id}・Pin: ${currentUser.pin}`,
            duration: 1500,
          });
        }
      },
    });
  }

  return (
    <li className="flex h-fit flex-col justify-center rounded-b-sm bg-muted">
      <h1 className="select-none rounded-t-sm bg-accent px-1 font-bold">
        Security
      </h1>
      <ul className="flex flex-col gap-3 p-2">
        <li className="flex h-fit w-full justify-between items-center bg-muted">
          <h1 className="w-1/2 select-none font-medium">Use Pin</h1>
          <select
            className="w-1/2 cursor-pointer rounded-sm bg-accent font-medium"
            name="usePin"
            value={formState.usePin}
            onChange={(e) => {
              if (e.target.value === "Off") {
                // call a native dialog with tauri api //.. ask if user really wants to disable pin
                ConfirmTurnOffPin().then((confirmed) => {
                  if (confirmed) {
                    setFormState({ ...formState, usePin: "Off" });
                    setSavedChanges(true);
                    setSavedChangesFormState(formState);
                  }
                });
              } else if (e.target.value === "On") {
                setFormState({ ...formState, usePin: "On" });
              }
            }}
          >
            <option className="font-medium">On</option>
            <option className="font-medium">Off</option>
          </select>
        </li>
        {formState.usePin === "On" && currentUser?.pin && (
          <li className="flex h-fit w-full bg-muted">
            <h1 className="w-1/2 select-none font-medium">Pin</h1>
            <div className={cn("flex w-1/2 flex-row")}>
              {!locked && (
                <motion.div
                  className={cn(
                    "flex h-full cursor-pointer flex-row items-center justify-center rounded-l-sm bg-accent px-1",
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // copy the pin to clipboard
                    if (currentUser?.pin) {
                      writeText(currentUser.pin.toString());
                      ToastClickToSee();
                    }
                  }}
                >
                  <Copy
                    className={cn(
                      "h-5/6 w-4",
                      formState?.fontSize === "Medium" && "h-auto w-5",
                      formState?.fontSize === "Large" && "h-auto w-6",
                      formState?.fontSize === "XLarge" && "h-auto w-7",
                    )}
                  />
                </motion.div>
              )}
              <input
                className={cn(
                  "w-full rounded-l-sm bg-accent px-1 font-medium",
                  locked &&
                  "cursor-not-allowed select-none opacity-50 focus:outline-none",
                  !locked && "rounded-none",
                  currentUser.pin === "disabled" &&
                  formState.usePin === "On" &&
                  "animate-pulse text-white",
                )}
                type="password"
                name="pin"
                maxLength={4}
                pattern="[0-9]{4}"
                title="Numbers Only"
                placeholder={
                  currentUser.pin === "disabled" && formState.usePin === "On"
                    ? "Enter a pin #"
                    : `••••`
                }
                readOnly={locked}
                onChange={(e) => {
                  if (e.target.value.length === 4) {
                    // ask the user if they want to change the pin
                    if (currentUser.pin)
                      if (
                        currentUser?.id &&
                        e.target.value === currentUser.pin.toString()
                      ) {
                        AlertNoChangesMade().then(() => {
                          setLocked(true);
                        });
                      } else {
                        ConfirmChangePin().then((confirm) => {
                          if (confirm) {
                            setLocked(true);
                            if (currentUser?.pin) {
                              if (
                                currentUser?.id &&
                                e.target.value !== currentUser.pin.toString()
                              ) {
                                updateUserPin({
                                  userId: currentUser.id,
                                  newPin: e.target.value,
                                }).then(() => {
                                  setCurrentUser({
                                    ...currentUser,
                                    pin: e.target.value,
                                  });

                                  toast({
                                    title: "Pin Changed!",
                                    description: "Your pin has been updated.",
                                    duration: 1500,
                                  });
                                });
                                turnOnPin({ userId: currentUser.id });
                                setSavedChanges(true);
                                setSavedChangesFormState(formState);
                              }
                            }
                          }
                        });
                      }
                  }
                }}
              />
              <motion.div
                className="flex h-full cursor-pointer flex-row items-center justify-center rounded-r-sm bg-accent px-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setLocked(!locked);
                }}
              >
                {locked ? (
                  <Lock
                    className={cn(
                      "h-5/6 w-4",
                      formState?.fontSize === "Medium" && "h-auto w-5",
                      formState?.fontSize === "Large" && "h-auto w-6",
                      formState?.fontSize === "XLarge" && "h-auto w-7",
                    )}
                  />
                ) : (
                  <Unlock
                    className={cn(
                      "h-5/6 w-4 cursor-pointer ",
                      formState?.fontSize === "Medium" && "h-auto w-5",
                      formState?.fontSize === "Large" && "h-auto w-6",
                      formState?.fontSize === "XLarge" && "h-auto w-7",
                    )}
                  />
                )}
              </motion.div>
            </div>
          </li>
        )}
      </ul>
    </li>
  );
}
