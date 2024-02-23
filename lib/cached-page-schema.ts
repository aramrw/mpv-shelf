import { z } from 'zod';
import { User, Folder, Global, Video, Settings } from '@prisma/client';

const SettingsSchema = z.object({
    id: z.number(),
    theme: z.string(),
    fontSize: z.string(),
    animations: z.string(),
    autoRename: z.string(),
    usePin: z.string(),
    userId: z.number(),
});

const FolderSchema = z.object({
    id: z.number(),
    path: z.string(),
    userId: z.number(),
    // user: UserSchema, // Include if you need to nest user info within folders
});

const VideoSchema = z.object({
    id: z.number(),
    path: z.string(),
    watched: z.boolean(),
    userId: z.number(),
    // user: UserSchema, // Include if you need to nest user info within videos
});

const UserSchema = z.object({
    id: z.number(),
    pin: z.string(),
    imagePath: z.string(),
    color: z.string(),
    folders: FolderSchema.array(),
    videos: VideoSchema.array(),
});

const GlobalSchema = z.object({
    id: z.string(),
    userId: z.number(),
});

// Cached page state assuming it includes folder paths and current user information
const CachedPageStateSchema = z.object({
    folderPaths: z.array(z.string()),
    currentUser: UserSchema,
    settings: SettingsSchema,

});