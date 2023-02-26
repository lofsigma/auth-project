import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  TRPCError,
} from "../trpc";

import base64url from "base64url";

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

import crypto from "crypto";

import * as argon2 from "argon2";

const rpName = "IdentityFlow";
const rpID = process.env.VERCEL_URL
  ? "auth-project-mu.vercel.app"
  : "localhost";
const origin = process.env.VERCEL_URL
  ? `https://${rpID}`
  : `http://${rpID}:3000`;

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
  getAllUsers: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany({
      include: {
        roles: true,
      },
    });
  }),
  getAllRoles: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.role.findMany({
      include: {
        users: true,
      },
    });
  }),
  isAdmin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.user.findFirst({
        where: {
          id: input.id,
          roles: {
            some: {
              name: "admin",
            },
          },
        },
      });
    }),
  createNewUser: protectedProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        birthDate: z.date(),
        newHire: z.boolean(),
        managerId: z.string(),
        personnelArea: z.string(),
        department: z.string(),
        costCenter: z.string(),
        roles: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pass = crypto.randomBytes(8).toString("hex");
      const hashedPass = await argon2.hash(pass);
      const user = await ctx.prisma.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          birthDate: input.birthDate,
          userName: input.firstName + input.lastName,
          password: hashedPass,
          newHire: input.newHire,
          ManagerId: input.managerId,
          personnelArea: input.personnelArea,
          department: input.department,
          costCenter: input.costCenter,
          roles: {
            connect: input.roles.split(",").map((role) => ({ name: role })),
          },
        },
      });
      console.log("mutate", pass, hashedPass, user);
      return {
        user: user,
        pass: pass,
      };
    }),
  addRole: protectedProcedure
    .input(z.object({ id: z.string(), role: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: {
          id: input.id,
        },
        data: {
          roles: {
            connect: [{ name: input.role }],
          },
        },
      });
    }),
  removeRole: protectedProcedure
    .input(z.object({ id: z.string(), role: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: {
          id: input.id,
        },
        data: {
          roles: {
            disconnect: [{ name: input.role }],
          },
        },
      });
    }),
  preRegister: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get user.
      const user = await ctx.prisma.user.findFirst({
        where: {
          id: input.id,
        },
      });

      // Get all user credentials.
      const credentials = await ctx.prisma.credential.findMany({
        where: {
          userId: input.id,
        },
      });

      // Generate registrationOptions.
      const options = generateRegistrationOptions({
        rpID,
        rpName,
        userID: input.id,
        userName: user?.userName ?? "",
        attestationType: "none",
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "preferred",
        },
        excludeCredentials: credentials.map((c) => ({
          id: base64url.toBuffer(c.id),
          type: "public-key",
          transports: c.transports,
        })),
      });

      // Insert challenge from registrationOptions.
      await ctx.prisma.challenge.upsert({
        where: {
          userId: input.id,
        },
        update: {
          challenge: options.challenge,
        },
        create: {
          userId: input.id,
          challenge: options.challenge,
        },
      });

      return options;
    }),
  register: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        credential: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // get challenge that corresponds to user.
      const challenge = await ctx.prisma.challenge.findFirst({
        where: {
          userId: input.id,
        },
      });

      console.log("challenge", challenge);

      let verification;
      try {
        verification = await verifyRegistrationResponse({
          response: input.credential,
          expectedRPID: rpID,
          expectedOrigin: origin,
          expectedChallenge: challenge?.challenge ?? "",
          requireUserVerification: true,
        });
      } catch (error) {
        console.log(error.message);
      }
      console.log("ver", verification);
      const { registrationInfo } = verification;
      const { credentialPublicKey, credentialID, counter } = registrationInfo;
      // add credential to db.
      console.log(
        "buffer from credentialId",
        Buffer.from(credentialID),
        credentialID,
        typeof credentialID
      );
      const credential = await ctx.prisma.credential.create({
        data: {
          userId: input.id,
          id: base64url(credentialID),
          transports: input.credential.transports ?? ["internal"],
          credentialPublicKey: Buffer.from(credentialPublicKey),
          counter,
        },
      });

      console.log("credential", credential);
    }),
  getCred: publicProcedure.query(async ({ ctx }) => {
    const credential = await ctx.prisma.credential.findFirst({
      where: {
        id: "WagpY1oSLBoinr9Q2plPJ3QMVE1vz3SpnCP_v6BcN9s",
      },
    });

    console.log("credential", credential);
  }),
  webauthn: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          userName: input.username,
        },
      });
      console.log("user", user);

      const credentials = await ctx.prisma.credential.findMany({
        where: {
          userId: user.id,
        },
      });

      console.log(
        "credentialss",
        credentials,
        credentials.map(({ id }) => new Uint8Array(id) as Buffer),
        credentials.map(({ id }) => console.log("type is", typeof id))
      );

      const options = generateAuthenticationOptions({
        allowCredentials: credentials.map((c) => ({
          id: base64url.toBuffer(c?.id),
          type: "public-key",
          transports: c.transports,
        })),
        userVerification: "preferred",
      });

      console.log("options", options);

      // save challenge.
      const challenge = await ctx.prisma.challenge.update({
        where: {
          userId: user.id,
        },
        data: {
          challenge: options.challenge,
        },
      });

      console.log("challenge", challenge);

      return options;
    }),
  deleteCredentials: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.credential.deleteMany({});
  }),
  getUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.user.findFirst({
        where: {
          id: input.id,
        },
        include: {
          roles: true,
        },
      });
    }),
  // getRole: protectedProcedure
  //   .input(z.object({ name: z.string(), id: z.string() }))
  //   .query(({ ctx, input }) => {
  //     return ctx.prisma.role.findFirst({
  //       where: {
  //         id: input.name,
  //         users: {
  //           id: {
  //             includes: id,
  //           },
  //         },
  //       },
  //       include: {
  //         users: true,
  //       },
  //     });
  //   }),
  getRoleAlt: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.user.findFirst({
        where: { id: ctx.session.user.id },
        include: {
          // roles: {
          //   where: {
          //     name: {
          //       equals: name,
          //     },
          //   },
          // },
          roles: {
            where: {
              name: {
                equals: input.name,
              },
            },
            select: {
              name: true,
              secret: true,
            },
          },
        },
      });
    }),
});
