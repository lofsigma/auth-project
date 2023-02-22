import { z } from "zod";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

import crypto from "crypto";

import * as argon2 from "argon2";

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
      console.log("mutate", pass, hashedPass);
      return {
        user: ctx.prisma.user.create({
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
        }),
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
