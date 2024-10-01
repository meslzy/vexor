"use client";


import { binder } from "vexor";

import { pingAction } from "~/api/ping";
import { input1, input2 } from "~/api/ping.schema";
import { vexor } from "~/lib/vexor";

export default function Home() {
  console.count("Component rendered");

  const ping = binder(pingAction, "aa");

  const {handler, reset, formError, formTouched, errors, touched, register, submitCount, isSubmitting} = vexor.useFormAction({
    action: ping,
    schema: [input1, input2],
    initial: {
      first_name: "Mohammed",
      last_name: "Albalawi",
    },
    onSubmit: async (data) => {
      console.log({ data });
    },
  });

  return (
    <form action={handler} onReset={reset}>
      <h1>Home { submitCount } { formTouched ? "true" : "false" }</h1>
      <div>
        <label>first_name | touched: { touched.first_name ? "true" : "false" }</label>
        <br/>
        <input
          type={"text"}
          {...register("first_name")}
        />
        {
          errors.first_name && (
            <div>{ errors.first_name }</div>
          )
        }
      </div>
      <div>
        <label>last_name | touched: { touched.last_name ? "true" : "false" }</label>
        <br/>
        <input
          type={"text"}
          {...register("last_name")}
        />
        {
          errors.last_name && (
            <div>{ errors.last_name }</div>
          )
        }
      </div>
      <button type={"reset"}>reset</button>
      <button type={"submit"}>ping</button>

      {
        isSubmitting && (
          <div>Loading...</div>
        )
      }

      {
        formError && (
          <div>{ formError }</div>
        )
      }
    </form>
  );
}
