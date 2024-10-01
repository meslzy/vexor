import { Default } from "./common";
import { RouteHandlers, RouteHandlersConfig } from "./route-handlers";
import { ServerAction, ServerActionConfig } from "./server-action";
import { useFormAction, FormActionConfig } from "./use-form-action";

interface VexorConfig {
}

class Vexor {
  config?: VexorConfig;

  constructor(config?: VexorConfig) {
    this.config = config;
  }

  serverAction = <C = Default, M = Default>(config?: ServerActionConfig<C, M>) => {
    return new ServerAction<C, M>(this, config);
  };

  routeHandlers = (config?: RouteHandlersConfig) => {
    return new RouteHandlers(this, config);
  };

  useFormAction = <I extends Record<string, any>, O>(config: FormActionConfig<I, O>) => {
    return useFormAction<I, O>(this, config);
  };
}

const createVexor = (config?: VexorConfig) => {
  return new Vexor(config);
};

export type {
  VexorConfig,
};

export {
  createVexor,
};

export default Vexor;
