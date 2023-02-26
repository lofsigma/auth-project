import type { GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { env } from "../env.mjs";
import { prisma } from "./db";
import * as argon2 from "argon2";
import base64url from "base64url";

import { verifyAuthenticationResponse } from "@simplewebauthn/server";

const rpName = "IdentityFlow";
const rpID = process.env.VERCEL_URL
  ? "auth-project-mu.vercel.app"
  : "localhost";
const origin = process.env.VERCEL_URL
  ? `https://${rpID[0]}`
  : `http://${rpID[1]}:3000`;

/**
 * Module augmentation for `next-auth` types.
 * Allows us to add custom properties to the `session` object and keep type
 * safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 **/
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // roles: string[] | undefined;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks,
 * etc.
 *
 * @see https://next-auth.js.org/configuration/options
 **/
export const authOptions: NextAuthOptions = {
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.id = account.providerAccountId;
      }
      return token;
    },
  },
  adapter: PrismaAdapter(prisma),
  session: {
    // Set to jwt in order to CredentialsProvider works properly
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    // EmailProvider({
    //   server: {
    //     host: process.env.EMAIL_SERVER_HOST,
    //     port: process.env.EMAIL_SERVER_PORT,
    //     auth: {
    //       user: process.env.EMAIL_SERVER_USER,
    //       pass: process.env.EMAIL_SERVER_PASSWORD,
    //     },
    //   },
    //   from: process.env.EMAIL_FROM,
    //   // maxAge: 24 * 60 * 60, // How long email links are valid for (default 24h)
    // }),
    CredentialsProvider({
      id: "webauthn",
      name: "webauthn",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
      },
      async authorize(credentials, req) {
        if (!credentials) return null;

        const user = await prisma.user.findFirst({
          where: {
            userName: credentials.username,
          },
        });

        if (!user) return null;

        const challenge = await prisma.challenge.findFirst({
          where: {
            userId: user.id,
          },
        });

        const {
          id,
          rawId,
          type,
          clientDataJSON,
          authenticatorData,
          signature,
          userHandle,
        } = req.body;

        const credential = {
          id,
          rawId,
          type,
          response: {
            clientDataJSON,
            authenticatorData,
            signature,
            userHandle,
          },
        };

        if (!challenge) return null;

        // get credential
        const cred = await prisma.credential.findFirst({
          where: { id: credential.id },
        });

        let verification;
        try {
          verification = await verifyAuthenticationResponse({
            expectedChallenge: challenge.challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator: {
              credentialPublicKey: cred.credentialPublicKey,
              credentialID: base64url.toBuffer(cred.id),
              counter: cred.counter,
            },
            response: credential as any,
          });

          console.log(verification);
        } catch (error) {
          console.log(error.message);
        }
        console.log(verification);
        const { verified } = verification;

        const { authenticationInfo } = verification;
        const { newCounter } = authenticationInfo;

        await prisma.credential.update({
          where: {
            id: base64url(authenticationInfo.credentialID),
          },
          data: {
            counter: newCounter,
          },
        });

        console.log("verified", verified);
        console.log("user", user);

        return verified ? user : null;
      },
    }),
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      id: "password",
      name: "password",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        // const user = { id: "1", name: "J Smith", email: "jsmith@example.com" }

        // if (user) {
        //   // Any object returned will be saved in `user` property of the JWT
        //   return user
        // } else {
        //   // If you return null then an error will be displayed advising the user to check their details.
        //   return null

        //   // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        // }
        console.log("right place", credentials);

        if (!credentials) return null;

        const user = await prisma.user.findFirst({
          where: {
            userName: credentials.username,
          },
        });

        if (!user) return null;

        // console.log("pass", typeof credentials.password);
        return (await argon2.verify(user.password, credentials.password))
          ? user
          : null;

        // const hashPassword = await argon2.hash(credentials?.password)

        // console.log('user', user, hashPassword == user.password);
        // return (await argon2.hash(credentials?.password)) == user.password ? user : null
      },
    }),
    /**
     * ...add more providers here
     *
     * Most other providers require a bit more work than the Discord provider.
     * For example, the GitHub provider requires you to add the
     * `refresh_token_expires_in` field to the Account model. Refer to the
     * NextAuth.js docs for the provider you want to use. Example:
     * @see https://next-auth.js.org/providers/github
     **/
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the
 * `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 **/
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
