import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils";
import { User } from "@prisma/client"
import { UserIcon } from "lucide-react";
import Image from "next/image";

export function UserAvatar({
    userObject,
    asChild
}: {
    userObject: User
    asChild?: boolean
}) {

    console.log(userObject);


    return (
        <Avatar className={cn("h-auto w-40 text-xl font-medium rounded-sm md:w-60 lg:w-80 xl:w-96 ",
            asChild && "h-auto w-full text-lg font-medium",
            (asChild && userObject.imagePath) && "md:w-3/4"
        )}>
            <AvatarImage src={userObject.imagePath ? userObject.imagePath : ""} alt={userObject.id.toString()} className="object-contain" style={{
                backgroundImage: `url(${userObject.imagePath})`,
                backgroundSize: "cover",
            }} />

            <AvatarFallback className={cn(`h-40 w-40 text-xl font-medium rounded-sm  select-none`,
                asChild && "w-full text-lg font-medium",
                !asChild &&
                `md:w-60
                md:h-60  
                lg:w-80 
                lg:h-80
                xl:h-96
                xl:w-96`
            )}>
                <div className="flex h-full w-full flex-col items-center justify-center">
                    <span className="rounded-sm bg-accent p-1">{userObject.id}</span>
                    <UserIcon className="" size={80} />
                </div>

            </AvatarFallback>


        </Avatar>
    )
}
