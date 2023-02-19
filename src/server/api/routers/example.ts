import { z } from "zod";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

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
    return ctx.prisma.user.findMany();
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
      return;
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
