"use client";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils";
import { User } from "@prisma/client"
import { UserIcon, UserPlus } from "lucide-react";
import { usePathname } from "next/navigation";

export function UserAvatar({
    userObject,
    asChild
}: {
    userObject: User
    asChild?: boolean
}) {
    const pathname = usePathname();

    //console.log("userAvatar");

    return (
        <Avatar className={cn("h-auto w-40 text-xl font-medium rounded-sm md:w-52 lg:w-64 xl:w-80 flex justify-center items-center outline drop-shadow-lg shadow-md text-background",
            asChild && "h-auto w-full text-lg font-medium outline rounded",
            (asChild && userObject?.imagePath) && "md:w-3/4 rounded-none",
            (asChild && userObject?.imagePath) && "h-40 md:w-40 rounded-sm",
            (asChild && !userObject?.imagePath) && "outline drop-shadow-md",
            asChild && userObject.imagePath && "w-full outline-none",
        )}>
            <AvatarImage src={userObject?.imagePath ? userObject?.imagePath : ""} alt={userObject?.id.toString()} className={cn("object-cover drop-shadow-md",
                asChild && "w-5/6 lg:w-[60%]",
            )} />

            <AvatarFallback className={cn(`h-40 w-40 text-xl font-medium rounded-sm select-none flex justify-center items-center`,
                asChild && "w-full text-lg font-medium",
                !asChild &&
                `md:w-52
                 md:h-52  
                 lg:w-64 
                 lg:h-64
                 xl:h-80
                 xl:w-80`,
                pathname.includes("/login") && "h-40 w-40"
            )}>
                <div className="flex h-full w-full flex-col items-center justify-center" style={{ backgroundColor: `${userObject?.color}` }}>
                    <span className={cn(
                        `flex outline outline-2 text-center  
                        md:text-2xl 
                        md:pb-0.5
                        lg:text-4xl
                        lg:mt-3
                        xl:pb-1.5
                        xl:text-5xl 
                        rounded-sm px-2 font-bold text-lg
                        drop-shadow-md`,
                        !userObject?.id && "outline-none shadow-none",
                        asChild && "text-lg md:text-xl lg:text-2xl xl:text-3xl",
                    )}>{userObject?.id}</span>
                    {userObject?.id ? (
                        <UserIcon className="h-auto w-1/2 drop-shadow-md" strokeWidth={1.3} />
                    ) : (
                        <UserPlus className="h-auto w-1/2 text-tertiary drop-shadow-md" strokeWidth={1.3} />
                    )}
                </div>
            </AvatarFallback>


        </Avatar>
    )
}
