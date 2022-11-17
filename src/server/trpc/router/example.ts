import { z } from "zod";

import { router, publicProcedure } from "../trpc";
import { Mailer } from "mailer";

const mailer = new Mailer();

export const exampleRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().nullish() }).nullish())
    .query(async ({ input }) => {
      const data = await mailer.bulkStatus("637430afdb7328fde40f80b1");

      return {
        greeting: data,
      };
    }),
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),
});
