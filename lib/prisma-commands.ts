"use server"

import prisma from "@/db";

export async function getUsers() {
    let users = await prisma.user.findMany();

    if (users.length === 0) {
        return null;
    } else {
        return users;
    }
}

export async function createNewUser({
    userPin
}: {
    userPin: string
}) {
    await prisma.user.create({
        data: {
            pin: userPin,
        }
    })
}

export async function addFolder({
    userId,
    folderPath
}: {
    userId: number,
    folderPath: string
}) {
    await prisma.folder.create({
        data: {
            user: {
                connect: {
                    id: userId
                }
            },
            path: folderPath

        }
    })
}

export async function getFolders({
    userId
}: {
    userId: number
}) {
    let folders = await prisma.folder.findMany({
        where: {
            userId: userId
        }
    })

    return folders;
}

export async function deleteFolder({
    folderPath,
}: {
    folderPath: string

}) {
    await prisma.folder.delete({
        where: {
            path: folderPath
        }
    })
}

export async function updateVideoWatched({
    videoPath,
}: {
    videoPath: string,
}) {

    // first check if the video exists, if not make it.
    // ps: videos ONLY get created HERE. 

    console.log("videoPath", videoPath);

    let video = await prisma.video.findUnique({
        where: {
            path: videoPath
        }
    })

    if (!video) {
        await prisma.video.create({
            data: {
                path: videoPath,
                watched: true
            }
        })
    } else {
        await prisma.video.update({
            where: {
                path: videoPath
            },
            data: {
                watched: true
            }
        })
    }


}

export async function getVideo({
    videoPath,
}: {
    videoPath: string,
}) {
    let video = await prisma.video.findUnique({
        where: {
            path: videoPath
        }
    })

    return video;
}