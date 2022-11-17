import { mailerRouter } from "mailer";
import { router } from "../trpc";
import { exampleRouter } from "./example";

export const appRouter = router({
  example: exampleRouter,
  mails: mailerRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
