import path from "path";
import log from "pino";

const logger = log({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss",
      messageFormat: "{filename}: {msg}",
      ignore: "pid,hostname,filename",
    },
  },
}).child({ filename: path.basename(__filename) });

export default logger;
