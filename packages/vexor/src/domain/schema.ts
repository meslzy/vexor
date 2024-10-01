import { Schema, validate } from "@typeschema/main";

import { merge } from "../utils/merge";

import { ValidationError, ValidationIssue } from "./error";

const validateSchemas = async <I, T extends Schema>(raw: I, ...schemas: T[]): Promise<I> => {
  let data = undefined;
  let issues: ValidationIssue[] = [];

  for (const schema of schemas) {
    const result = await validate(schema, raw);

    if (result.success) {
      data = merge(data, result.data);
    } else {
      for (const issue of result.issues) {
        issues.push(issue);
      }
    }
  }

  if (issues.length > 0) {
    return data as I;
  }

  throw ValidationError.create(issues);
};

export {
  validateSchemas,
};
