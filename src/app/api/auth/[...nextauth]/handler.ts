import NextAuth, { type NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "~/server/prisma";
import argon2 from "argon2";
import { type JWT } from "next-auth/jwt";

// Extend the NextAuth User type to include `id` and `role`
declare module "next-auth" {
  interface User {
    id: number;
    email: string;
    role: string;
  }
  interface Session {
    user: {
      departmentId?: number;
      id: number;
      email: string;
      role: string;
    };
  }
}

// JWT type to include `id` and `role`
declare module "next-auth/jwt" {
  interface JWT {
    id: number; // Keeping id as number here
    role: string;
  }
}

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("Missing credentials");
        }

        const { email, password } = credentials;

        // Find the user in the database
        const user = await db.user.findUnique({ where: { email } });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.password) {
          throw new Error("Password not set for this user");
        }

        // Verify the password
        const isValid = await argon2.verify(user.password, password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        // Return the user object, including `id`, `email`, and `role`
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    // Include `id` and `role` in the session
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;

      }
      return session;
    },

    // Include `id` and `role` in the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; 
        token.role = user.role;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
