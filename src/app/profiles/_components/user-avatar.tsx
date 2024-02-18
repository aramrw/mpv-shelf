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
            asChild && "h-auto w-1/6 text-lg font-medium"
        )}>
            <AvatarImage src={userObject.imagePath ? userObject.imagePath : ""} alt={userObject.id.toString()} className="object-contain" style={{ backgroundImage: `url(${userObject.imagePath})` }} />
            <AvatarFallback>{userObject.id}</AvatarFallback>
        </Avatar>
    )
}
