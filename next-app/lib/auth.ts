import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		}),
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error("Missing email or password");
				}

				await dbConnect();

				const user = await User.findOne({ email: credentials.email });
				if (!user || !user.password) {
					throw new Error("Invalid email or password");
				}

				const isValid = await bcrypt.compare(
					credentials.password,
					user.password,
				);
				if (!isValid) {
					throw new Error("Invalid email or password");
				}

				return { id: user._id.toString(), name: user.name, email: user.email };
			},
		}),
	],
	callbacks: {
		async signIn({ user, account }) {
			if (account?.provider === "google") {
				await dbConnect();
				// Check if user exists in our DB
				const existingUser = await User.findOne({ email: user.email });

				if (!existingUser) {
					// Auto-register the Google user
					const newUser = await User.create({
						name: user.name || "Unknown",
						email: user.email || "",
						image: user.image || "",
					});
					user.id = (
						newUser as { _id: { toString: () => string } }
					)._id.toString();
				} else {
					user.id = (
						existingUser as { _id: { toString: () => string } }
					)._id.toString();
				}
			}
			return true;
		},
		async jwt({ token, user }) {
			// Upon initial sign in, attach the user id to the token
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		async session({ session, token }) {
			// Make the MongoDB id available to all API routes
			if (token?.id) {
				session.user.id = token.id as string;
			}
			return session;
		},
	},
	session: {
		strategy: "jwt",
	},
	pages: {
		signIn: "/login",
	},
	secret: process.env.NEXTAUTH_SECRET,
};
