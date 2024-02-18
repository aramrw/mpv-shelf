import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { User } from "@prisma/client"

export function UserAvatar({
    userObject
}: {
    userObject: User
}) {

    console.log(userObject);


    return (
        <Avatar className="h-20 w-20 text-xl font-medium">
            <AvatarImage src={userObject.imagePath ? userObject.imagePath : ""} alt={userObject.id.toString()} className="object-contain" style={{ backgroundImage: `url(${userObject.imagePath})` }} />
            <AvatarFallback>{userObject.id}</AvatarFallback>
        </Avatar>
    )
}
