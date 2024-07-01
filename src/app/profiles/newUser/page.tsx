"use client";

import React, { createRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { SettingSchema } from "@/app/settings/page";
import { cn } from "@/lib/utils";
import { createNewUser } from "../../../../lib/prisma-commands/user/user-cmds";

export default function NewUser() {
  const [defaultSettings, _setDefaultSettings] = useState<SettingSchema>({
    fontSize: "Large",
    animations: "On",
    autoPlay: "Off",
    autoRename: "Off",
    usePin: "On",
    //persistOnDelete: "Off",
  });

  let router = useRouter();

  function PinInputNewUser() {
    const pinLength = 4;
    const [pins, setPins] = useState(Array(pinLength).fill(""));
    const inputRefs = Array(pinLength)
      .fill(0)
      .map(() => createRef());

    const handleChange = (value: any, index: number) => {
      const newPins = [...pins];
      newPins[index] = value;
      setPins(newPins);

      if (value.length === 1 && index < pinLength - 1) {
        (inputRefs[index + 1].current as HTMLInputElement).focus();
      }
    };

    const handleBackspace = (event: any, index: number) => {
      if (event.key === "Backspace" && !pins[index] && index > 0) {
        const newPins = [...pins];
        newPins[index - 1] = "";
        setPins(newPins);
        (inputRefs[index - 1].current as HTMLInputElement).focus();
      }
    };

    /* eslint-disable */
    useEffect(() => {
      (inputRefs[0].current as HTMLInputElement).focus();
    }, []);
    /* eslint-disable */

    useEffect(() => {
      console.log(pins.join(""));
      if (pins.join("").length === pinLength) {
        createNewUser({
          userPin: pins.join(""),
          formData: defaultSettings,
        }).then((_res: any) => {
          router.push("/profiles");
        });
      }
    }, [pins]);

    return (
      <AnimatePresence>
        <motion.main
          className="mt-4 flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          key={1}
        >
          <UserPlus
            className={cn(
              "h-auto w-20 md:w-[6.4rem] lg:w-[6.8rem] xl:w-28 text-primary",
            )}
          />
          <div className="my-4 flex space-x-2">
            {pins.map((pin, index) => (
              <input
                key={index}
                ref={inputRefs[index] as React.RefObject<HTMLInputElement>}
                type="tel" // Use "tel" to get the numeric keyboard on mobile devices
                maxLength={1}
                value={pin}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleBackspace(e, index)}
                className={cn(
                  "h-20 w-20 rounded border-2 border-muted text-center text-4xl md:h-[6rem] md:w-24 md:text-5xl lg:h-[6.5rem] lg:w-[6] lg:text-[3.5rem] xl:h-28 xl:w-28 xl:text-6xl shadow-md font-bold",
                )}
                pattern="[0-9]*" // Ensure only numbers can be inputted
              />
            ))}
          </div>
          <h2 className="mb-1 text-xl font-medium md:text-2xl lg:text-3xl xl:text-4xl">
            Enter a <b>pin #</b> to protect your account.
          </h2>
          <h3 className="mt-1 rounded-sm bg-accent px-1 text-base font-medium md:text-xl lg:text-2xl xl:text-2xl">
            <b>Note:</b> You can change / turn this off later.
          </h3>
        </motion.main>
      </AnimatePresence>
    );
  }

  return (
    <main>
      <PinInputNewUser />
    </main>
  );
}
