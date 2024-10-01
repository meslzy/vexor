import { Default, InferType, InputType, ResolveType, InferPolyOutput, InferBinaryOutput, OverridePolyOutput, OverrideBinaryOutput } from "./common";
import { NextError, ServerError, ValidationError } from "./error";

interface Middleware {
  fn: Function;
  contextOffset: number;
  metaOffset: number;
  bindsOffset: number;
  inputOffset: number;
  outputOffset: number;
}

type MiddlewareSuccessResult<C, M, B, I, O> = {
  ok: true;
  context: InferType<C, undefined>;
  meta: InferType<M, undefined>;
  binds: InferPolyOutput<B, undefined>;
  input: InferBinaryOutput<I, undefined>;
  output: O;
  error: null;
};

type MiddlewareFailureResult<C, M, B, I> = {
  ok: false;
  context: InferType<C, undefined>;
  meta: InferType<M, undefined>;
  binds: InferPolyOutput<B, undefined>;
  input: InferBinaryOutput<I, undefined>;
  error: ServerError | ValidationError | NextError;
  output: null;
};

type MiddlewareResult<C, M, B, I, O> = MiddlewareSuccessResult<C, M, B, I, O> | MiddlewareFailureResult<C, M, B, I>;

type NextMiddlewareOptions<$C, $M, $B, $I> = {
  context?: $C;
  meta?: $M;
  binds?: $B;
  input?: $I;
};

type MiddlewareOptions<C, M, B, I, O> = {
  context: InferType<C, undefined>;
  meta: InferType<M, undefined>;
  binds: InferPolyOutput<B, undefined>;
  input: InferBinaryOutput<I, undefined>;
  next: <$C = Default, $M = Default, $B = Default, $I = Default>(options?: NextMiddlewareOptions<InputType<C, $C>, InputType<M, $M>, $B, $I>) => Promise<MiddlewareResult<ResolveType<C, $C>, ResolveType<M, $M>, OverridePolyOutput<B, $B>, OverrideBinaryOutput<I, $I, false>, InferBinaryOutput<O>>>;
};

type MiddlewareFunction<C, $C, M, $M, B, $B, I, $I, O, $O> = (options: MiddlewareOptions<C, M, B, I, O>) => Promise<MiddlewareResult<ResolveType<C, $C>, ResolveType<M, $M>, OverridePolyOutput<B, $B>, OverrideBinaryOutput<I, $I, false>, $O>>;

interface MiddlewareFactory<C, $C, M, $M, B, $B, I, $I, O, $O> {
  fn: MiddlewareFunction<C, $C, M, $M, B, $B, I, $I, O, $O>;
  extends: <EC = Default, EM = Default, EB = Default, EI = Default, EO = Default>(fn: MiddlewareFunction<ResolveType<C, $C>, EC, ResolveType<M, $M>, EM, OverridePolyOutput<B, $B>, EB, OverrideBinaryOutput<I, $I, false>, EI, OverrideBinaryOutput<O, $O, true>, EO>) => (
    MiddlewareFactory<ResolveType<C, $C>, EC, ResolveType<M, $M>, EM, OverridePolyOutput<B, $B>, EB, OverrideBinaryOutput<I, $I, false>, EI, OverrideBinaryOutput<O, $O, true>, EO>
  );
}

const createMiddleware = <C = Default, $C = Default, M = Default, $M = Default, B = Default, $B = Default, I = Default, $I = Default, O = Default, $O = Default>(fn: MiddlewareFunction<C, $C, M, $M, B, $B, I, $I, O, $O>) => {
  return {
    fn,
    extends: (fn) => {
      return createMiddleware(fn);
    },
  } as MiddlewareFactory<C, $C, M, $M, B, $B, I, $I, O, $O>;
};

export type {
  Middleware,
  MiddlewareResult,
  MiddlewareOptions,
  MiddlewareFunction,
  MiddlewareFactory,
};

export {
  createMiddleware,
};
