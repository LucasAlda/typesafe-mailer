import { createTRPCProxyClient, httpBatchLink, loggerLink } from "@trpc/client";
import type { inferProcedureInput } from "@trpc/server";
import type { AppRouter } from "server/trpc/router/_app";
import superjson from "superjson";

type MailsSchemas = inferProcedureInput<AppRouter["mails"]["send"]>;
type Mail = MailsSchemas["mail"];

type selectMail<T extends Mail> = MailsSchemas & { mail: T };

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export const send = async <T extends Mail>(mail: T, body: Omit<selectMail<T>, "mail">) => {
  return client.mails.send.mutate({ mail, ...body } as selectMail<T>);
};

export const sendAll = async <T extends Mail>(mail: T, body: Omit<selectMail<T>, "mail">[]) => {
  return client.mails.sendAll.mutate(body.map((m) => ({ ...m, mail })) as selectMail<T>[]);
};

const client = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" || (opts.direction === "down" && opts.result instanceof Error),
    }),
  ],
});

const mailer = {
  send,
  sendAll,
};

export default mailer;
