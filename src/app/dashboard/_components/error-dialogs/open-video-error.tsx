import { message } from "@tauri-apps/api/dialog";

export default async function OpenVideoError(error: string) {
	await message(`${error}`, { title: `Error Opening Video`, type: 'error' });
}
