"use client";

import React from "react";

import { Schema } from "@typeschema/main";
import objectPath, { Path } from "object-path";

import { ActionInputSignature } from "./action";
import { ServerError, ValidationError } from "./error";
import { validateSchemas } from "./schema";
import Vexor from "./vexor";

interface FormActionConfig<I extends Record<string, string>, O> {
  action: ActionInputSignature<I, O>;
  onSubmit?: (output: O) => Promise<void> | void;
  schema?: Schema | Schema[];
  initial?: I;
  initialErrors?: Partial<Record<keyof I, string>>;
  initialTouched?: Partial<Record<keyof I, boolean>>;
  initialFormError?: string;
  initialFormTouched?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

const useFormAction = <I extends Record<string, any>, O>(vexor: Vexor, config: FormActionConfig<I, O>) => {
  config = React.useMemo(() => ({
    validateOnChange: true,
    validateOnBlur: true,
    ...config,
  }), [config]);

  const defaultFields = React.useMemo<I>(() => {
    return config.initial ?? ({} as I);
  }, [config.initial]);

  const prevfields = React.useRef(defaultFields);

  const [fields, setFeilds] = React.useState<I>(defaultFields);

  //

  const defaultFormTouched = React.useMemo(() => {
    return config.initialFormTouched ?? false;
  }, [config.initialFormTouched]);

  const [formTouched, setFormTouched] = React.useState(defaultFormTouched);

  const defaultFormError = React.useMemo(() => {
    return config.initialFormError ?? "";
  }, [config.initialFormError]);

  const [formError, setFormError] = React.useState(defaultFormError);

  //

  const defaultTouched = React.useMemo<Partial<Record<keyof I, boolean>>>(() => {
    return config.initialTouched ?? {};
  }, [config.initialTouched]);

  const [touched, setTouched] = React.useState(defaultTouched);

  const defaultErrors = React.useMemo<Partial<Record<keyof I, string>>>(() => {
    return config.initialErrors ?? {};
  }, [config.initialErrors]);

  const [errors, setErrors] = React.useState(defaultErrors);

  //

  const [submitCount, setSubmitCount] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isValidation, setIsValidation] = React.useState(false);

  //

  const setFeildsState = React.useCallback((state: ((prevFields: I) => I) | I) => {
    const prev = prevfields.current;
    const next = typeof state === "function" ? state(prev) : state;
    prevfields.current = next;
    setFeilds(next);
  }, [setFeilds]);

  const setFeildValue = React.useCallback(<Key extends keyof I>(key: Key, value: I[Key]) => {
    setFeildsState((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
  }, [setFeildsState]);

  const setFieldTouched = React.useCallback(<Key extends keyof I>(key: Key, touched: boolean) => {
    setTouched((prev) => {
      return {
        ...prev,
        [key]: touched,
      };
    });
  }, [setTouched]);

  const setFieldError = React.useCallback(<Key extends keyof I>(key: Key, error: string) => {
    setErrors((prev) => {
      return {
        ...prev,
        [key]: error,
      };
    });
  }, [setErrors]);

  //

  const validate = React.useCallback(async (data) => {
    if (!config.schema) {
      return;
    }

    try {
      const schemas = Array.isArray(config.schema) ? config.schema : [config.schema];
      await validateSchemas(data, ...schemas);
      setErrors({});
    } catch (error: unknown) {
      if (ValidationError.isValidationError(error)) {
        return setErrors(() => {
          const errors = {} as Record<keyof I, string>;

          for (const { path, message } of error.issues) {
            if (path === undefined) {
              setFormError(message);
            } else {
              objectPath.set(error, path as Path, message);
            }
          }

          return errors;
        });
      }

      throw error;
    }
  }, [config.schema]);

  //

  const handleChange = React.useCallback((event: React.ChangeEvent<any>) => {
    const { name, value } = event.target;

    const data = {
      ...fields,
      [name]: value,
    };

    setFeilds(data);

    if (config.validateOnChange) {
      validate(data);
    }
  }, [config.validateOnChange, fields, validate]);

  const handleBlur = React.useCallback((event: React.FocusEvent<any>) => {
    const { name } = event.target;
    setFieldTouched(name, true);
    if (config.validateOnBlur) {
      validate(fields);
    }
  }, [config.validateOnBlur, fields, setFieldTouched, validate]);

  const register = React.useCallback((name: string) => {
    return {
      name,
      value: fields[name],
      onChange: handleChange,
      onBlur: handleBlur,
    };
  }, [fields, handleChange, handleBlur]);

  //

  const reset = React.useCallback(() => {
    prevfields.current = defaultFields;
    setFeildsState(defaultFields);
    setTouched(defaultTouched);
    setErrors(defaultErrors);
    setFormTouched(defaultFormTouched);
    setFormError(defaultFormError);
  }, [defaultErrors, defaultFields, defaultFormError, defaultFormTouched, defaultTouched, setFeildsState]);

  const submit = React.useCallback(async (data?: I) => {
    if (isSubmitting) {
      return;
    }

    setSubmitCount((prev) => prev + 1);
    setIsSubmitting(true);
    setFormTouched(true);
    setFormError("");

    data = data ?? fields;

    try {
      if (config.schema) {
        setIsValidation(true);
        const schemas = Array.isArray(config.schema) ? config.schema : [config.schema];
        data = await validateSchemas(data, ...schemas);
        setErrors({});
      }

      const response = await config.action(data);

      if (response.ok) {
        if (config.onSubmit) {
          await config.onSubmit(response.output);
        }

        return response.output;
      }

      throw response.error;
    } catch (error: unknown) {
      if (ValidationError.isValidationError(error)) {
        return setErrors(() => {
          const errors = {} as Record<keyof I, string>;

          for (const { path, message } of error.issues) {
            if (path === undefined) {
              setFormError(message);
            } else {
              objectPath.set(error, path as Path, message);
            }
          }

          return errors;
        });
      }

      if (ServerError.isServerError(error)) {
        return setFormError(error.message);
      }

      if (error instanceof Error) {
        return setFormError(error.message);
      }

      return setFormError("Unknown error");
    } finally {
      setIsSubmitting(false);
      setIsValidation(false);
    }
  }, [config, fields, isSubmitting]);

  const handler = async (event: FormData | React.FormEvent<HTMLFormElement>) => {
    if (event instanceof FormData) {
      const data = Object.fromEntries(event.entries()) as I;
      await submit(data);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const formData = new FormData(event.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries()) as I;
    await submit(data);
  };

  return {
    fields,
    formError,
    formTouched,
    touched,
    errors,
    //
    submitCount,
    isSubmitting,
    isValidation,
    //
    setFeildsState,
    setFeildValue,
    setFieldError,
    setFieldTouched,
    //
    handleChange,
    handleBlur,
    register,
    //
    reset,
    submit,
    handler,
  };
};

export type {
  FormActionConfig,
};

export {
  useFormAction,
};
