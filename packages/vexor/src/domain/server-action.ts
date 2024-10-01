import { Schema } from "@typeschema/main";

import { merge } from "../utils/merge";

import { ActionFunction, ActionResponse, ActionSignature } from "./action";
import { Default, InputType, ResolveType, ResolvePoly, InferPolyInput, InferBinaryInput, InferBinaryOutput, OverridePolyOutput, ResolveBinarySchema, OverrideBinaryOutput } from "./common";
import { NextError, ServerError, ValidationError } from "./error";
import { Factory, FactoryManager } from "./factory";
import { Middleware, MiddlewareResult, MiddlewareFactory, MiddlewareFunction } from "./middleware";
import { validateSchemas } from "./schema";
import Vexor from "./vexor";

interface ServerActionConfig<C = Default, M = Default> {
  context?: C;
  meta?: M;
}

interface ServerActionFactory {
  contextFactory?: Factory<any>;
  metaFactory?: Factory<any>;
  bindsFactory?: Factory<Schema[]>;
  inputFactory?: Factory<Schema>;
  outputFactory?: Factory<Schema>;
  middlewareFactory?: Factory<Middleware>;
}

class ServerAction<C = Default, M = Default, B = Default, I = Default, O = Default> {
  private readonly vexor: Vexor;

  private factory?: ServerActionFactory;

  private get contextFactory() {
    return (
      this.factory?.contextFactory ??
      new Factory()
    );
  }

  private get metaFactory() {
    return (
      this.factory?.metaFactory ??
      new Factory<any>()
    );
  }

  private get bindsFactory() {
    return (
      this.factory?.bindsFactory ??
      new Factory<Schema[]>()
    );
  }

  private get inputFactory() {
    return (
      this.factory?.inputFactory ??
      new Factory<Schema>()
    );
  }

  private get outputFactory() {
    return (
      this.factory?.outputFactory ??
      new Factory<Schema>()
    );
  }

  private get middlewareFactory() {
    return (
      this.factory?.middlewareFactory ??
      new Factory<Middleware>()
    );
  }

  constructor(vexor: Vexor, config?: ServerActionConfig<C, M>) {
    this.vexor = vexor;
    this.factory = {
      contextFactory: this.contextFactory.extend(config?.context),
      metaFactory: this.metaFactory.extend(config?.meta),
    };
  }

  //

  extend = <C, M, B, I, O>(factory?: ServerActionFactory) => {
    factory = {
      ...this.factory,
      ...factory,
    };
    const serverAction = new ServerAction<C, M, B, I, O>(this.vexor);
    serverAction.factory = factory as ServerActionFactory;
    return serverAction;
  };

  //

  context = <$C>(context: InputType<C, $C>) => {
    return this.extend<ResolveType<C, $C>, M, B, I, O>({
      contextFactory: this.contextFactory.extend(context),
    });
  };

  meta = <$M>(meta: InputType<M, $M>) => {
    return this.extend<C, ResolveType<M, $M>, B, I, O>({
      metaFactory: this.metaFactory.extend(meta),
    });
  };

  //

  binds = <S extends Schema[]>(schemas: S) => {
    return this.extend<C, M, ResolvePoly<B, S>, I, O>({
      bindsFactory: this.bindsFactory.extend(schemas),
    });
  };

  input = <S extends Schema>(schema: S) => {
    return this.extend<C, M, B, ResolveBinarySchema<I, S>, O>({
      inputFactory: this.inputFactory.extend(schema),
    });
  };

  output = <S extends Schema>(schema: S) => {
    return this.extend<C, M, B, I, ResolveBinarySchema<O, S, true>>({
      outputFactory: this.outputFactory.upextend(schema),
    });
  };

  //

  use = <$C = Default, $M = Default, $B = Default, $I = Default, $O = Default>(middleware: MiddlewareFunction<C, $C, M, $M, B, $B, I, $I, O, $O> | MiddlewareFactory<C, $C, M, $M, B, $B, I, $I, O, $O>) => {
    let fn = middleware as MiddlewareFunction<C, $C, M, $M, B, $B, I, $I, O, $O>;

    if (!(middleware instanceof Function)) {
      fn = middleware.fn;
    }

    return this.extend<ResolveType<C, $C>, ResolveType<M, $M>, OverridePolyOutput<B, $B>, OverrideBinaryOutput<I, $I, false>, OverrideBinaryOutput<O, $O, true>>({
      middlewareFactory: this.middlewareFactory.extend({
        fn,
        contextOffset: this.contextFactory.offset,
        metaOffset: this.metaFactory.offset,
        bindsOffset: this.bindsFactory.offset,
        inputOffset: this.inputFactory.offset,
        outputOffset: this.outputFactory.offset,
      }),
    });
  };

  //

  action = <$O>(fn: ActionFunction<C, M, B, I, O, $O>) => {
    return (
      async (...args: any[]) => {
        let bindsArg: any = undefined;
        let inputArg: any = undefined;

        if (this.bindsFactory.empty) {
          const index = args.findLastIndex((arg) => arg instanceof FormData);

          if (index === -1) {
            inputArg = args.at(0);
          } else {
            bindsArg = args.slice(0, index);
            inputArg = args.at(index);
          }
        } else {
          bindsArg = args.slice(0, this.bindsFactory.offset);
          inputArg = args.slice(this.bindsFactory.offset).at(0);
        }

        let actionResponse = {
          ok: true,
        } as ActionResponse<InferBinaryOutput<O, $O>>;

        let middlewareResult = {
          ok: true,
        } as MiddlewareResult<C, M, B, I, InferBinaryOutput<O, $O>>;

        const contextManger = new FactoryManager(this.contextFactory);
        const metaManger = new FactoryManager(this.metaFactory);

        const bindsManger = new FactoryManager(this.bindsFactory);
        const inputManger = new FactoryManager(this.inputFactory);
        const outputManger = new FactoryManager(this.outputFactory);

        if (this.bindsFactory.empty) {
          middlewareResult.binds = bindsArg;
        }

        if (this.inputFactory.empty) {
          middlewareResult.input = inputArg;
        }

        const invoke = async (index: number) => {
          let middleware = this.middlewareFactory.at(index);

          if (middleware) {
            if (contextManger.canApply(middleware.contextOffset)) {
              middlewareResult.context = await contextManger.apply(middleware.contextOffset, (values) => {
                return values.reduce((acc, value) => {
                  return merge(acc, value);
                }, middlewareResult.context);
              });
            }

            if (metaManger.canApply(middleware.metaOffset)) {
              middlewareResult.meta = await metaManger.apply(middleware.metaOffset, (values) => {
                return values.reduce((acc, value) => {
                  return merge(acc, value);
                }, middlewareResult.meta);
              });
            }

            if (bindsManger.canApply(middleware.bindsOffset)) {
              middlewareResult.binds = await bindsManger.apply(middleware.bindsOffset, async (schemasPack) => {
                const value = await Promise.all(
                  bindsArg.map(async (binds: any[], index: number) => {
                    const schemas = schemasPack[index] || [];
                    return await validateSchemas(binds, ...schemas);
                  }),
                );

                return merge(middlewareResult.binds, value);
              });
            }

            if (inputManger.canApply(middleware.inputOffset)) {
              middlewareResult.input = await inputManger.apply(middleware.inputOffset, async (schemas) => {
                const value = await validateSchemas(inputArg, ...schemas);
                return merge(middlewareResult.input, value);
              });
            }

            try {
              let result = await middleware.fn({
                context: middlewareResult.context,
                meta: middlewareResult.meta,
                next: async (options?: any) => {
                  if (options?.context) {
                    middlewareResult.context = merge(middlewareResult.context, options.context);
                  }

                  if (options?.meta) {
                    middlewareResult.meta = merge(middlewareResult.meta, options.meta);
                  }

                  if (options?.binds) {
                    middlewareResult.binds = merge(middlewareResult.binds, options.input);
                  }

                  if (options?.input) {
                    middlewareResult.input = merge(middlewareResult.input, options.input);
                  }

                  await invoke(index + 1);

                  return middlewareResult;
                },
              });

              if (result.ok) {
                if (outputManger.canApply(middleware.outputOffset)) {
                  result.output = await outputManger.apply(middleware.outputOffset, (values) => {
                    return values.reduce((acc, value) => {
                      return merge(acc, value);
                    }, result.output);
                  });
                }
              }

              middlewareResult = result;
            } catch (error: unknown) {
              middlewareResult.ok = false;

              if (NextError.isNextError(error)) {
                middlewareResult.error = error;
                return;
              }

              if (ValidationError.isValidationError(error)) {
                middlewareResult.error = error;
                return;
              }

              if (ServerError.isServerError(error)) {
                middlewareResult.error = error;
                return;
              }

              if (error instanceof Error) {
                middlewareResult.error = ServerError.fromError(error);
                return;
              }

              middlewareResult.error = ServerError.default(error);
            }

            return;
          }

          try {
            if (!middlewareResult.ok) {
              return;
            }

            if (contextManger.canApply(this.contextFactory.offset)) {
              middlewareResult.context = await contextManger.apply(this.contextFactory.offset, (values) => {
                return values.reduce((acc, value) => {
                  return merge(acc, value);
                }, middlewareResult.context);
              });
            }

            if (metaManger.canApply(this.metaFactory.offset)) {
              middlewareResult.meta = await metaManger.apply(this.metaFactory.offset, (values) => {
                return values.reduce((acc, value) => {
                  return merge(acc, value);
                }, middlewareResult.meta);
              });
            }

            if (bindsManger.canApply(this.bindsFactory.offset)) {
              middlewareResult.binds = await bindsManger.apply(this.bindsFactory.offset, async (schemasPack) => {
                const value = await Promise.all(
                  bindsArg.map(async (binds, index) => {
                    const schemas = schemasPack[index] || [];
                    return await validateSchemas(binds, ...schemas);
                  }),
                );

                return merge(middlewareResult.binds, value);
              });
            }

            if (inputManger.canApply(this.inputFactory.offset)) {
              middlewareResult.input = await inputManger.apply(this.inputFactory.offset, async (schemas) => {
                const value = await validateSchemas(inputArg, ...schemas);
                return merge(middlewareResult.input, value);
              });
            }

            let output = await fn({
              context: middlewareResult.context,
              meta: middlewareResult.meta,
              binds: middlewareResult.binds,
              input: middlewareResult.input,
            });

            if (outputManger.canApply(this.outputFactory.offset)) {
              output = await outputManger.apply(this.outputFactory.offset, async (schemas) => {
                const value = await validateSchemas(output, ...schemas);
                return merge(middlewareResult.input, value);
              });
            }

            middlewareResult.output = output as InferBinaryOutput<O, $O>;
          } catch (error: unknown) {
            middlewareResult.ok = false;

            if (error instanceof ValidationError) {
              middlewareResult.error = error;
              return;
            }

            if (error instanceof ServerError) {
              middlewareResult.error = error;
              return;
            }

            if (error instanceof Error) {
              middlewareResult.error = ServerError.fromError(error);
              return;
            }

            middlewareResult.error = ServerError.default(error);
          }
        };

        middlewareResult.ok = true;

        await invoke(0);

        if (middlewareResult.ok) {
          actionResponse.ok = true;
          actionResponse.output = middlewareResult.output;
          actionResponse.error = undefined;
        } else {
          if (middlewareResult.error instanceof NextError) {
            throw middlewareResult.error.originalError;
          }

          actionResponse.ok = false;
          actionResponse.output = undefined;
          actionResponse.error = middlewareResult.error.serialize();
        }

        return actionResponse;
      }
    ) as ActionSignature<InferPolyInput<B>, InferBinaryInput<I, void>, InferBinaryOutput<O, $O>>;
  };
}

export type {
  ServerActionConfig,
};

export {
  ServerAction,
};
