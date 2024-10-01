"use server";

import { ErrorCode, ServerError, ValidationError } from "vexor";
import { z } from "zod";

import { serverAction } from "~/server/vexor";

import { input1, input2, output1, output2 } from "./ping.schema";

const ping = serverAction.input(z.object({
  name: z.string(),
}));

export const pingAction = serverAction
  .context({
    first_name: "Mohammad",
  })
  .context({
    last_name: "Sly",
  })
  .meta({
    description: "Ping action",
  })
  .meta({
    requestName: "ping",
  })
  .binds<[
    id: z.ZodString,
]>([
    z.string(),
  ])
  .input(input1)
  .input(input2)
  .output(output2)
  .output(output1)
  .action((options) => {
    const { input } = options;

    if (input.first_name === "Mohammed") {
      throw ValidationError.create([
        {
          path: ["first_name"],
          message: "First name is not allowed",
        },
      ]);
    }

    if (input.first_name === "Mohammed") {
      throw new ServerError({
        code: ErrorCode.IM_A_TEAPOT,
      });
    }

    return {
      full_name: `${input.first_name} ${input.last_name}`,
      capitalized_full_name: `${input.first_name} ${input.last_name}`,
    };
  });
