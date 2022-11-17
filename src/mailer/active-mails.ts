import { createMailer } from "./internals/mailer-creator";
import { example2Mail, exampleMail } from "./mails/example.mail";

export const mailerRouter = createMailer([exampleMail, example2Mail]);
