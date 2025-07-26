import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";

import { db } from "~/server/db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || typeof credentials.email !== 'string' ||
              !credentials?.password || typeof credentials.password !== 'string') {
            throw new Error('Invalid credentials format');
          }

          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user?.hashedPassword) {
            throw new Error('Invalid credentials');
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const isValid = await bcrypt.compare(
            credentials.password,
            user.hashedPassword
          );

          if (!isValid) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user.id,
            name: user.name ?? null,
            email: user.email,
            image: user.image ?? null,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error('Authorization error:', error.message);
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    session: ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;