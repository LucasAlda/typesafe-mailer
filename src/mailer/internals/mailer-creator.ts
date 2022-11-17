import { publicProcedure, router } from "@trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import Mailer from "./service";
import type { createMail } from "./mail-creator";

type ActiveMailsType = ReturnType<typeof createMail>;

export const createMailer = <T extends ActiveMailsType>(activeMails: T[]) => {
  const a = activeMails.map((a) => a.schema) as [T["schema"], T["schema"], ...T["schema"][]];

  const activeMailsSchemas = z.discriminatedUnion("mail", a);

  const mailer = new Mailer();

  const send = publicProcedure.input(activeMailsSchemas).mutation(async ({ input }) => {
    const desiredMail = activeMails.find((a) => a.name === input.mail);

    if (!desiredMail) {
      return new TRPCError({
        code: "BAD_REQUEST",
        message: "Mail no encontrado",
      });
    }

    // eslint-disable-next-line
    // @ts-ignore
    const res = await mailer.sendMail({ ...desiredMail.send(input), name: desiredMail.name });

    return {
      messageId: res.messageId,
      input: input,
      success: true,
    };
  });

  const sendAll = publicProcedure.input(z.array(activeMailsSchemas)).mutation(async ({ input }) => {
    if (input.length < 1) {
      return new TRPCError({
        code: "BAD_REQUEST",
        message: "No hay mails para enviar",
      });
    }

    const desiredMail = input[0]?.mail ? activeMails.find((a) => a.name === input[0]?.mail) : null;

    if (!desiredMail || input.some((m) => m.mail !== desiredMail.name)) {
      return new TRPCError({
        code: "BAD_REQUEST",
        message: "Todos los mails deben ser del mismo tipo",
      });
    }

    // eslint-disable-next-line
    // @ts-ignore
    const res = await mailer.sendBulk(input.map((m) => ({ ...desiredMail.send(m), name: desiredMail.name })));

    return {
      bulkIds: res.bulkIds,
      input: input,
      success: true,
    };
  });

  return router({
    send,
    sendAll,
  });
};
