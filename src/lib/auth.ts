import db from "@/db";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";

export const authOptions = {
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "text", placeholder: "" },
				password: {
					label: "Password",
					type: "password",
					placeholder: "",
				},
			},
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			async authorize(credentials: any) {
				try {
					if (!credentials) return null;
					const user = await db.user.findFirst({
						where: {
							email: credentials.email,
						},
					});

					if (
						user &&
						(await bcrypt.compare(
							credentials.password,
							user.password
						))
					) {
						return {
							id: user.id,
							email: user.email,
							name: user.name,
						};
					}
				} catch (error) {
					console.error(error, "123213");
					return null;
				}
			},
		}),
	],
	callbacks: {
		async session({ session, token }) {
			if (session?.user) {
				session.user.id = parseInt(token.sub as string, 10);
			}
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET || "secr3t",
	pages: {
		signIn: "/signin",
	},
} satisfies NextAuthOptions;
