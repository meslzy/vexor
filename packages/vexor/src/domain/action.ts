import { Default, InferType, InferPolyOutput, InferBinaryInput, InferBinaryOutput } from "./common";
import { ValidationError, ServerErrorConfig } from "./error";

type ActionResult<O, $O> = InferBinaryInput<O, $O>;

type ActionOptions<C, M, B, I> = {
  context: InferType<C, undefined>;
  meta: InferType<M, undefined>;
  binds: InferPolyOutput<B, void>;
  input: InferBinaryOutput<I, void>;
};

type ActionFunction<C, M, B, I, O, $O> = (options: ActionOptions<C, M, B, I>) => Promise<ActionResult<O, $O>> | ActionResult<O, $O>;

//

type ActionSuccessResponse<O> = {
  ok: true;
  output: O;
  error: undefined;
};

type ActionFailureResponse = {
  ok: false;
  output?: undefined;
  error: ServerErrorConfig | ValidationError;
};

type ActionResponse<O> = ActionSuccessResponse<O> | ActionFailureResponse;

type ActionInputSignature<I, O> = (input: I) => Promise<ActionResponse<O>>;

// @ts-ignore
type ActionBindsSignature<B, I, O> = (...args: [...binds: B, input: I]) => Promise<ActionResponse<O>>;

type ActionSignature<B, I, O> = (
  B extends Default ? (
    ActionInputSignature<I, O>
  ) : (
    ActionBindsSignature<B, I, O>
  )
);

export type {
  ActionFunction,
  ActionSignature,
  ActionInputSignature,
  ActionBindsSignature,
  ActionResponse,
};
