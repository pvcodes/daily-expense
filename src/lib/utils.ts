import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const generateId = () => {
	const nanoid = customAlphabet(
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
		6
	);
	return nanoid();
};

export const dateToString = (day: string | Date) => {
	if (typeof day === "string") {
		return new Date(day).toLocaleDateString("en-CA");
	} else {
		return day.toLocaleDateString("en-CA");
	}
};

export const compareDate = (a: Date, b: Date) =>
	a.toLocaleDateString("en-CA") === b.toLocaleDateString("en-CA");

export const getDateInMMYYYY = (date: Date) =>
	new Intl.DateTimeFormat("en", {
		month: "2-digit",
		year: "numeric",
	})
		.format(date)
		.replace("/", "-");
