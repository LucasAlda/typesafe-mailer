import { TRPCError } from "@trpc/server";

export const handleSingleSend = async (promise: Promise<unknown>, options?: { errorMessage: string }) => {
  try {
    const result = await promise;

    return result;
  } catch (err) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: options?.errorMessage || "Error enviando mail",
      cause: err as Error,
    });
  }
};

export const handleMultipleSend = async (promise: Promise<unknown>[], options?: { errorMessage: string }) => {
  try {
    const result = await Promise.allSettled(promise);

    const errors = (result.filter((res) => res.status === "rejected") as PromiseRejectedResult[]).map(
      (res) => res.reason
    );
    const success = (
      result.filter((res) => res.status === "fulfilled") as PromiseFulfilledResult<unknown>[]
    ).map((res) => res.value);

    return { errors, success };
  } catch (err) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: options?.errorMessage || "Error enviando mails",
      cause: err as Error,
    });
  }
};
