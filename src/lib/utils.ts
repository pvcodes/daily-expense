import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export const generateId = () => nanoid(6);

export const dateToString = (day: string | Date) => {
	if (typeof day === "string") {
		return new Date(day).toLocaleDateString("en-CA");
	} else {
		return day.toLocaleDateString("en-CA");
	}
};

export const compareDate = (a: Date, b: Date) =>
	a.toLocaleDateString("en-CA") === b.toLocaleDateString("en-CA");
