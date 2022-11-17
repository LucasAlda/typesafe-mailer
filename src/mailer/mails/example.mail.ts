import { createMail } from "mailer/internals/mail-creator";
import { z } from "zod";
import { MailerOptionsSchema } from "../internals/service";

export const exampleMail = createMail("example", {
  schema: z.object({
    mail: z.literal("example"),
    to: MailerOptionsSchema.shape.to,
  }),
  send: (body) => {
    return {
      to: body.to,
      subject: `Mail de prueba`,
      template: "example",
    };
  },
});

export const example2Mail = createMail("example-2", {
  schema: z.object({
    mail: z.literal("example-2"),
    to: MailerOptionsSchema.shape.to,
    name: z.string(),
  }),
  send: (body) => {
    return {
      to: body.to,
      subject: `Mail de prueba con fecha al ${body.name}`,
      template: "example",
      personalization: {
        name: body.name,
      },
    };
  },
});
