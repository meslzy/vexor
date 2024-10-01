import crypto from "node:crypto";

import { createMiddleware } from "vexor";

import { vexor } from "~/lib/vexor";

const tracerMiddleware = createMiddleware((options) => {
  return options.next({
    meta: {
      requestId: crypto.randomUUID(),
    },
  });
});

const loggerMiddleware = tracerMiddleware.extends(async (options) => {
  console.log("Request ID:", options.meta.requestId);
  return options.next();
});

export const serverAction = vexor.serverAction()
  .use(tracerMiddleware)
  .use(loggerMiddleware);

export const routeHandlers = vexor.routeHandlers();
