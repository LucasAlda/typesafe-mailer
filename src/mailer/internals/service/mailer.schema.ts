import z from "zod";

export const RecipientSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
});
export const PersonSchema = z.union([RecipientSchema, z.string()]);

export const AttachmentSchema = z.object({
  content: z.string(),
  filename: z.string(),
});

export const AttachmentPathSchema = z.object({
  path: z.string(),
  absolute: z.boolean().optional(),
});
export const AttachmentAcceptableSchema = z.union([AttachmentSchema, AttachmentPathSchema]);

export const PersonalizationSchema = z.object({});

export type Recipient = z.TypeOf<typeof RecipientSchema>;
export type Person = z.TypeOf<typeof PersonSchema>;

export type Attachment = z.TypeOf<typeof AttachmentSchema>;
export type AttachmentPath = z.TypeOf<typeof AttachmentPathSchema>;
export type AttachmentAcceptable = z.TypeOf<typeof AttachmentAcceptableSchema>;

export type Personalization = z.TypeOf<typeof PersonalizationSchema>;

export const MailerOptionsSchema = z.object({
  name: z.string(),
  from: PersonSchema.optional(),
  to: z.union([z.array(PersonSchema), z.string()]),
  cc: z.union([z.array(PersonSchema), z.string()]).optional(),
  bcc: z.union([z.array(PersonSchema), z.string()]).optional(),
  replyTo: PersonSchema.optional(),
  subject: z.string(),
  personalization: z.union([z.array(PersonalizationSchema), PersonalizationSchema]).optional(),
  template: z.string().optional(),
  templateId: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z.array(AttachmentAcceptableSchema).optional(),
});

export type MailerOptions = z.TypeOf<typeof MailerOptionsSchema>;

// export type MailerOptions = {
//   from?: Person;
//   to: string | Person[];
//   cc?: string | Person[];
//   bcc?: string | Person[];
//   replyTo?: Person;
//   subject: string;
//   personalization?: Array<{ [key: string]: any }> | { [key: string]: any };
//   templateId: string;
//   html?: string;
//   text?: string;
//   attachments?: Attachment[] | AttachmentPath[];
// };

export type MailerWithTemplateOptions = MailerOptions;
