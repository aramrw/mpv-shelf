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

    console.log(userObject);

    return (
        <Avatar className={cn("h-auto w-36 text-xl font-medium rounded-xl md:w-52 lg:w-64 xl:w-80 flex justify-center items-center  outline ",
            asChild && "h-auto w-full text-lg font-medium  outline",
            (asChild && userObject?.imagePath) && "md:w-3/4 rounded-none",
            (!asChild && !userObject?.imagePath) && "outline drop-shadow-md",
        )}>
            <AvatarImage src={userObject?.imagePath ? userObject?.imagePath : ""} alt={userObject?.id.toString()} className="object-cover" style={{
                backgroundImage: `url(${userObject?.imagePath})`,
                backgroundSize: "cover",
            }} />

            <AvatarFallback className={cn(`h-40 w-40 text-xl font-medium rounded select-none flex justify-center items-center`,
                asChild && "w-full text-lg font-medium",
                !asChild &&
                `md:w-52
                 md:h-52  
                 lg:w-64 
                 lg:h-64
                 xl:h-80
                 xl:w-80`,
                pathname.includes("/home") && "h-36 w-36"
            )}>
                <div className="flex h-full w-full flex-col items-center justify-center" style={{ backgroundColor: `${userObject?.color}` }}>
                    <span className={cn(
                        `flex mt-5 outline  
                        md:text-4xl 
                        md:px-4 
                        md:py-2 
                        lg:text-4xl 
                        lg:px-5 
                        lg:py-3 shadow-lg rounded-lg px-2 font-bold text-3xl py-0
                        `,
                        !asChild &&
                        `md:top-[17.2rem]
                         lg:top-[18.5rem] 
                         xl:top-48`,
                        !userObject?.id && "outline-none shadow-none",
                        !userObject?.id && "",
                    )}>{userObject?.id}</span>
                    {userObject?.id ? (
                        <UserIcon className="h-auto w-1/2" strokeWidth={1.5} />
                    ) : (
                        <UserPlus className="h-auto w-1/2" strokeWidth={1.5} />
                    )}
                </div>
            </AvatarFallback>


        </Avatar>
    )
}
