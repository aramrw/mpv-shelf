import { cn } from "@/lib/utils";
import { User } from "@prisma/client";
import { ArrowRightFromLine, Database, Download, Upload } from "lucide-react";

import {
    turnOnPin,
    updateUserPin,
} from "../../../../../lib/prisma-commands/settings/setting-cmds";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/tauri";

