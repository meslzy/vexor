import { z } from "zod";

const input1 = z.object({
  first_name: z.string().min(3),
});
  
const input2 = z.object({
  last_name: z.string().min(3),
});
  
const output1 = z.object({
  full_name: z.string(),
});
  
const output2 = z.object({
  capitalized_full_name: z.string().transform((value) => value.toUpperCase()),
});

export {
  input1,
  input2,
  output1,
  output2,
};
