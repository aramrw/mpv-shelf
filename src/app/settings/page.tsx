"use client";

import React, { useEffect, useState } from "react";
import { z } from "zod";
import { closeDatabase } from "../../../lib/prisma-commands/misc-cmds";
import { User } from "@prisma/client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { UserAvatar } from "../profiles/_components/user-avatar";
import ProfileSignOutButton from "./_components/profile-buttons/profile-sign-out-button";
import ProfilePictureButton from "./_components/profile-buttons/profile-picture-button";
import ProfileDeleteButton from "./_components/profile-buttons/profile-delete-button";
import UiUxSection from "./_components/form-sections/ui-ux";
import ApplicationSection from "./_components/form-sections/application";
import SecuritySection from "./_components/form-sections/security";
import {
  getCurrentUserGlobal,
  setCurrentUserGlobal,
} from "../../../lib/prisma-commands/global/global-cmds";
import { getUsers } from "../../../lib/prisma-commands/user/user-cmds";
import {
  getUserSettings,
  updateUserPin,
  updateSettings,
} from "../../../lib/prisma-commands/settings/setting-cmds";
import AddNewProfileButton from "./_components/profile-buttons/add-new-profile-button";
import SaveChangesButton from "./_components/save-changes-button";
import DataSection from "./_components/form-sections/data";

const formSchema = z.object({
  fontSize: z.enum(["Small", "Medium", "Large", "XLarge"]),
  animations: z.enum(["On", "Off"]),
  autoPlay: z.enum(["On", "Off"]),
  autoRename: z.enum(["On", "Off"]),
  usePin: z.enum(["On", "Off"]),
});

export type SettingSchema = z.infer<typeof formSchema>;

export default function Settings() {
  const [formState, setFormState] = useState({
    fontSize: "Large",
    animations: "On",
    autoPlay: "Off",
    autoRename: "Off",
    usePin: "On",
  });

  const [currentUser, setCurrentUser] = useState<User>();
  const [locked, setLocked] = useState(true);
  const [hasMultipleProfiles, setHasMultipleProfiles] = useState(false);
  const [savedChanges, setSavedChanges] = useState(true);

  // this will be used to compare the form state [updated-state] with the savedChangeState [initial-state]
  const [savedChangesFormState, setSavedChangesFormState] = useState({} as any);

  let router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (currentUser?.pin === "disabled" && formState.usePin === "On") {
    }
    // Collect form data directly from the form elements
    const formData = new FormData(e.currentTarget);
    const formValues = {
      fontSize: formData.get("fontSize"),
      animations: formData.get("animations"),
      autoPlay: formData.get("autoPlay"),
      autoRename: formData.get("autoRename"),
      usePin: formData.get("usePin"),
    };

    let newPin = formData.get("pin");

    // Validate form data
    const validationResult = formSchema.safeParse(formValues);
    if (!validationResult.success) {
      console.error("Validation failed", validationResult.error);
      return;
    }

    //console.log(validationResult.data);
    if (currentUser?.id)
      updateSettings({
        formData: validationResult.data,
        userId: currentUser?.id,
      }).then(() => {
        if (currentUser?.pin) {
          if (newPin && newPin !== currentUser?.pin.toString()) {
            updateUserPin({
              userId: currentUser.id,
              newPin: newPin.toString(),
            });
          } else if (formState.usePin === "Off") {
            updateUserPin({ userId: currentUser.id, newPin: "disabled" });
          }
        }
      });
  };

  // fetch the user object from db on start
  useEffect(() => {
    getUsers().then((users) => {
      if (users) {
        getCurrentUserGlobal().then((GLOBAL_USER) => {
          for (const user of users) {
            if (user.id === GLOBAL_USER?.userId) {
              setCurrentUser(user);
              break;
            }
          }
        });

        if (users.length > 1) {
          setHasMultipleProfiles(true);
        }
      }
    });
  }, []);

  // fetch the settings object from db on start && update the formState with it
  useEffect(() => {
    if (currentUser?.id) {
      getUserSettings({ userId: currentUser?.id }).then((settings) => {
        console.log(settings);
        if (settings) {
          setFormState(settings);
          setSavedChangesFormState(settings);
          setSavedChanges(true);
        }
      });
    }
  }, [currentUser]);

  // check if the user has a pin set, if not, disable the pin option
  useEffect(() => {
    if (currentUser?.pin === "disabled" && formState.usePin === "On") {
      setLocked(false);
    }
  }, [currentUser, formState.usePin]);

  // reset the savedChanges state when the formState updates
  useEffect(() => {
    setSavedChanges(false);
  }, [formState]);

  const handleUserGlobal = () => {
    //router.prefetch('/');
    setCurrentUserGlobal({ userId: -1 })
      .then(() => {
        return closeDatabase();
      })
      .finally(() => {
        router.push("/");
      });
  };

  // const handleSetFormState = (value: any) => {
  //   setFormState(value);
  // };

  const handleSetSavedChanges = (value: boolean) => {
    setSavedChanges(value);
  };

  const handleSetSavedChangesFormState = (value: any) => {
    setSavedChangesFormState(value);
  };

  const handleSetLocked = (value: boolean) => {
    setLocked(value);
  };

  const handleSetCurrentUser = (value: User) => {
    setCurrentUser(value);
  };

  return (
    <motion.main
      className={cn(
        "h-fit pb-2 w-full",
        formState?.fontSize === "Medium" && "text-lg",
        formState?.fontSize === "Large" && "text-xl",
        formState?.fontSize === "XLarge" && "text-2xl",
      )}
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, bounce: 1, type: "spring", damping: 10 }}
    >
      <form
        className="h-fit w-full md:px-16 lg:px-32 xl:px-48"
        onSubmit={handleSubmit}
      >
        <ul className="flex h-full w-full flex-col gap-2 p-2">
          <li className="flex h-fit flex-col justify-center rounded-b-sm bg-muted">
            <h1 className="select-none rounded-t-sm bg-accent px-1 font-bold">
              User
            </h1>
            <ul className="flex flex-col gap-3 p-2">
              {hasMultipleProfiles && (
                <li className="fit flex max-h-96 w-full items-center justify-between gap-2 bg-muted">
                  <div className="flex h-fit w-full flex-row items-center justify-between gap-4 rounded-sm bg-monotone p-5">
                    {currentUser && (
                      <>
                        <motion.div
                          className="flex w-[50%] cursor-pointer items-center justify-center rounded-sm"
                          // whileHover={{ scale: 2 }}
                          // transition={{ duration: 1 }}
                          style={{
                            background: `url(${currentUser?.imagePath})`,
                            backgroundSize: "cover",
                          }}
                        >
                          <UserAvatar userObject={currentUser} asChild />
                        </motion.div>
                        <div className="flex h-fit w-full flex-col items-center justify-between gap-4 rounded-sm bg-monotone">
                          <ProfileSignOutButton
                            formState={formState}
                            currentUser={currentUser}
                            handleUserGlobal={handleUserGlobal}
                          />
                          <ProfilePictureButton
                            currentUser={currentUser}
                            formState={formState}
                          />
                          {hasMultipleProfiles && (
                            <>
                              <ProfileDeleteButton
                                currentUser={currentUser}
                                formState={formState}
                              />
                              {/* <ProfileMalButton formState={formState} /> */}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              )}

              {!hasMultipleProfiles && (
                <li className="flex h-fit w-full items-center justify-center bg-muted">
                  <AddNewProfileButton formState={formState} router={router} />
                </li>
              )}
            </ul>
          </li>
          <UiUxSection formState={formState} setFormState={setFormState} />
          <ApplicationSection
            formState={formState}
            setFormState={setFormState}
          />
          <SecuritySection
            formState={formState}
            setFormState={setFormState}
            setCurrentUser={handleSetCurrentUser}
            setLocked={handleSetLocked}
            setSavedChangesFormState={handleSetSavedChangesFormState}
            setSavedChanges={handleSetSavedChanges}
            currentUser={currentUser}
            locked={locked}
          />
          <DataSection
            formState={formState}
            currentUser={currentUser}
          />
        </ul>

        <AnimatePresence mode="wait">
          <SaveChangesButton
            formState={formState}
            savedChanges={savedChanges}
            savedChangesFormState={savedChangesFormState}
            setSavedChanges={setSavedChanges}
            setSavedChangesFormState={setSavedChangesFormState}
          />
        </AnimatePresence>
      </form>
    </motion.main>
  );
}
