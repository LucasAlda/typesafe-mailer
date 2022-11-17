import type { MailerOptions } from "mailer/internals/service";
import type { z } from "zod";

export const createMail = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends z.ZodObject<{ mail: z.ZodLiteral<string> }, "strip", any, any, any>,
  U extends string
>(
  mail: U,
  {
    schema,
    send,
  }: {
    schema: T;
    send: (input: z.TypeOf<T>) => Omit<MailerOptions, "name">;
  }
) => {
  return {
    name: mail,
    schema,
    send,
  };
};
