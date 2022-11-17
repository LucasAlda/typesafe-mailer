import { env } from "env/server.mjs";
import fs from "fs";
import handlebars from "handlebars";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import MailerSend, { Recipient, EmailParams, Attachment, BulkEmails } from "mailersend";
import path from "path";
import { prisma } from "server/db/client";
import logger from "utils/logger";

import type { MailerOptions } from "./mailer.schema";

const NODE_ENV = env.NODE_ENV;
// const NODE_ENV = "production";

const getRecipients = (recipients: MailerOptions["to"] | undefined): Recipient[] => {
  if (!recipients) return [];
  return (typeof recipients === "string" ? recipients.split(";") : recipients).map((recipient) => {
    if (recipient instanceof Recipient) return recipient;

    return new Recipient(recipient);
  });
};

const getAttachments = (attachments: MailerOptions["attachments"]): Attachment[] => {
  if (!attachments) return [];
  return attachments.map((attachment) => {
    if ("content" in attachment) return attachment;

    return new Attachment(
      fs.readFileSync(("absolute" in attachment ? "" : env.FILES_DIR) + attachment.path, {
        encoding: "base64",
      }),
      attachment.path.split("/").pop()
    );
  });
};

const getPersonalization = (
  personalization: MailerOptions["personalization"],
  recipients: Recipient[]
): unknown[] => {
  if (!personalization) return [];
  if (Array.isArray(personalization)) return personalization;

  return recipients.map((recipient) => {
    return {
      email: recipient.email,
      data: personalization,
    };
  });
};

const getLocalTemplate = (template: string) => {
  const bodyPath = path.join(process.cwd(), `/src/mailer/templates/${template}.hbs`);
  const templatePath = path.join(process.cwd(), `/src/mailer/templates/${template}.template.hbs`);

  const bodyExists = fs.existsSync(bodyPath);
  const templateExists = fs.existsSync(templatePath);

  if (!bodyExists) throw new Error(`No existe el template: ${template}`);

  const mailBody = fs.readFileSync(bodyPath, "utf-8");
  let hbs = mailBody;

  if (templateExists) {
    const template = fs.readFileSync(templatePath, "utf-8");
    hbs = handlebars.compile(template)({ body: mailBody });
  }

  return hbs;
};

class Mailer {
  mailersend: MailerSend;

  constructor() {
    this.mailersend = new MailerSend({
      api_key: env.MAILERSEND_API_KEY,
    });
  }
  async sendMail(mailOptions: MailerOptions) {
    let recipients = getRecipients(mailOptions.to);
    let cc = getRecipients(mailOptions.cc);
    let bcc = getRecipients(mailOptions.bcc);

    if (NODE_ENV !== "production") {
      recipients = [new Recipient(env.TEST_MAIL_1)];
      cc = [];
      bcc = [];
    }

    const attachments = getAttachments(mailOptions.attachments);

    const personalization = getPersonalization(mailOptions.personalization, recipients);

    const emailParams = new EmailParams()
      .setTags([mailOptions.name])
      .setFrom(env.SENDER_EMAIL)
      .setFromName(env.SENDER_NAME)
      .setRecipients(recipients)
      .setCc(cc)
      .setBcc(bcc)
      .setAttachments(attachments)
      .setSubject((NODE_ENV !== "production" ? "TEST - " : "") + mailOptions.subject)
      .setText(mailOptions.text)
      .setHtml(mailOptions.html)
      .setTemplateId(mailOptions.templateId)
      .setPersonalization(personalization);

    if (mailOptions.template) emailParams.setHtml(getLocalTemplate(mailOptions.template));

    try {
      const res = await this.mailersend.send(emailParams);

      if (!res.headers.get("x-message-id") || res.headers.get("x-bulk-id").length <= 0) {
        throw new Error("MailerSend: No se pudo enviar el correo");
      }

      logger.info(
        ` \n\tMAIL ENVIADO! \n\tasunto: "${mailOptions.subject}", \n\treceptor: "${recipients
          .map((r) => r.email)
          .join(", ")}"\n\tmessage-id: ${res.headers.get("x-message-id")}`
      );

      prisma.sent_mails.create({
        data: {
          data: JSON.stringify(mailOptions),
          message_id: res.headers.get("x-message-id"),
          email_name: mailOptions.name,
        },
      });

      return { messageId: res.headers.get("x-message-id"), mail: mailOptions };
    } catch (err) {
      console.log("Error enviando mail a: ", mailOptions.to, "subject: ", mailOptions.subject);
      throw {
        mail: mailOptions,
        err,
      };
    }
  }
  async sendBulk(mailsOptions: MailerOptions[]) {
    const bulks: BulkEmails[] = [];

    let bulk = 0;
    let i = 0;
    if (NODE_ENV !== "production") {
      mailsOptions = mailsOptions.slice(0, 2);
      if (mailsOptions[0]?.to) mailsOptions[0].to = env.TEST_MAIL_1;
      if (mailsOptions[1]?.to) mailsOptions[1].to = env.TEST_MAIL_2;
    }

    mailsOptions.forEach((mailOptions) => {
      const recipients = getRecipients(mailOptions.to);
      const cc = getRecipients(mailOptions.cc);
      const bcc = getRecipients(mailOptions.bcc);

      const attachments = getAttachments(mailOptions.attachments);

      const personalization = getPersonalization(mailOptions.personalization, recipients);

      const emailParams = new EmailParams()
        .setTags([mailOptions.name])
        .setFrom(env.SENDER_EMAIL)
        .setFromName(env.SENDER_NAME)
        .setRecipients(recipients)
        .setCc(cc)
        .setBcc(bcc)
        .setAttachments(attachments)
        .setSubject((NODE_ENV !== "production" ? "TEST - " : "") + mailOptions.subject)
        .setText(mailOptions.text)
        .setHtml(mailOptions.html)
        .setTemplateId(mailOptions.templateId)
        .setPersonalization(personalization);

      if (mailOptions.template) emailParams.setHtml(getLocalTemplate(mailOptions.template));

      if (i >= 400) {
        i = 0;
        bulk++;
      }
      if (!bulks[bulk]) bulks[bulk] = new BulkEmails();
      bulks[bulk].addEmail(emailParams);

      i++;
    });

    try {
      const bulkIds: string[] = [];
      for await (const bulkEmail of bulks) {
        // const bulkEmail = bulks[i];
        const res = await this.mailersend.sendBulk(bulkEmail);

        const bulkRes = await res.json();
        bulkIds.push(bulkRes.bulk_email_id);
      }

      if (bulkIds.filter((b) => !b || b.length <= 0).length < bulks.length) {
        throw new Error("MailerSend: No se pudo enviar el correo");
      }

      logger.info(` \n\tBULK MAIL ENVIADO! bulk-ids: ${bulkIds.join(", ")}`);
      return { bulkIds };
    } catch (err) {
      console.log("Error enviando BULK");
      throw {
        err,
      };
    }
  }
  async bulkStatus(bulkId: string) {
    const res = await this.mailersend.getBulkEmailRequestStatus({
      bulk_email_id: bulkId,
    });
    const status = await res.json();
    return status;
  }
}

export default Mailer;
