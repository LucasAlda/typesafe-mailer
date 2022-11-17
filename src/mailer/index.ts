export { createMail } from "./internals/mail-creator";
export { createMailer } from "./internals/mailer-creator";
export { mailerRouter } from "./active-mails";
export { default as Mailer } from "./internals/service/mailer.service";
import { send, sendAll } from "./internals/send-mail";

export const mailer = { send, sendAll };

export default mailer;
