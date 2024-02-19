import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils";
import { User } from "@prisma/client"

export function UserAvatar({
    userObject,
    asChild
}: {
    userObject: User
    asChild?: boolean
}) {

    console.log(userObject);


    return (
        <Avatar className={cn("h-20 w-20 text-xl font-medium",
            asChild && "h-auto text-lg font-medium my-2 mx-2"
        )}>
            <AvatarImage src={userObject.imagePath ? userObject.imagePath : ""} alt={userObject.id.toString()} className="object-contain" style={{ backgroundImage: `url(${userObject.imagePath})` }} />
            <AvatarFallback className={cn("bg-accent font-bold",
                asChild && "h-16 w-16 text-lg font-bold"
            )}>{userObject.id}</AvatarFallback>
        </Avatar>
    )
}
