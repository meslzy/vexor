import { ActionBindsSignature, ActionInputSignature } from "./action";

// @ts-ignore
const binder = <B, I, O>(action: ActionBindsSignature<B, I, O>, ...binds: B) => {
  // @ts-ignore
  return (action as Function).bind(null, ...binds) as ActionInputSignature<I, O>;
};

export {
  binder,
};
