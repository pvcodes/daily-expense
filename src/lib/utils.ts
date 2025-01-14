import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export const generateId = () => nanoid(6);

export const dateToString = (day: string) =>
	new Date(day).toLocaleDateString("en-CA");
