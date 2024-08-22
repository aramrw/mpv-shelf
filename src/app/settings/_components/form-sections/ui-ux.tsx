import { ALargeSmall, Move3d } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function UiUxSection({ formState, setFormState }: { formState: any, setFormState: (value: any) => void }) {
  return (
    <li className="flex h-fit flex-col justify-center bg-muted outline outline-zinc-200">
      <h1 className="select-none bg-accent p-1 font-bold">
        UI / UX
      </h1>
      <ul className="flex flex-col gap-3 p-2.5">
        <li className="flex h-fit w-full bg-muted">
          <div className="flex w-1/2 items-center justify-start gap-1">
            <h1 className="select-none font-medium">Font Size</h1>
            <ALargeSmall
              className={cn(
                "h-auto w-4 stroke-[2.2]",
                formState?.fontSize === "Medium" && "h-auto w-5",
                formState?.fontSize === "Large" && "h-auto w-6",
                formState?.fontSize === "XLarge" && "h-auto w-7",
              )}
            />
          </div>
          <select
            className="w-1/2 cursor-pointer rounded-sm bg-accent font-medium"
            name="fontSize"
            value={formState.fontSize}
            onChange={(e) => {
              setFormState({ ...formState, fontSize: e.target.value });
            }}
          >
            <option className="font-medium">Small</option>
            <option className="font-medium">Medium</option>
            <option className="font-medium">Large</option>
            <option className="font-medium">XLarge</option>
          </select>
        </li>
        <li className="flex h-fit w-full bg-muted">
          <div className="flex w-1/2 items-center justify-start gap-1">
            <h1 className="select-none font-medium">Animations</h1>
            <motion.div
              whileHover={
                formState.animations === "On" ? { scale: 1.2 } : undefined
              }
              whileTap={
                formState.animations === "On" ? { scale: 0.8 } : undefined
              }
              transition={
                formState.animations
                  ? { type: "spring", stiffness: 800, damping: 17 }
                  : undefined
              }
            >
              <Move3d
                className={cn(
                  "h-auto w-3.5 cursor-pointer stroke-[2.5]",
                  formState?.fontSize === "Medium" && "h-auto w-4",
                  formState?.fontSize === "Large" && "h-auto w-5",
                  formState?.fontSize === "XLarge" && "h-auto w-6",
                )}
              />
            </motion.div>
          </div>
          <select
            className="w-1/2 cursor-pointer rounded-sm bg-accent font-medium"
            name="animations"
            value={formState.animations}
            onChange={(e) => {
              setFormState({ ...formState, animations: e.target.value });
            }}
          >
            <option className="font-medium">On</option>
            <option className="font-medium">Off</option>
          </select>
        </li>
      </ul>
    </li>
  );
}
