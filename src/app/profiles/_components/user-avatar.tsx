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

    const imageDataUrl = userObject.image ? `data:image/jpeg;base64,${userObject.image}` : null;



    return (
        <Avatar className="h-20 w-20 text-xl font-medium">
            <AvatarImage src={imageDataUrl ? imageDataUrl : "https://github.com/account"} alt={userObject.id.toString()} />
            <AvatarFallback>{userObject.id}</AvatarFallback>
        </Avatar>
    )
}
