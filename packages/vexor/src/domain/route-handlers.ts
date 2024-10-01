import { NextRequest, NextResponse } from "next/server";

import Vexor from "./vexor";

interface RouteHandlersConfig {
}

class RouteHandlers {
  vexor: Vexor;
  config?: RouteHandlersConfig;

  constructor(vexor: Vexor, config?: RouteHandlersConfig) {
    this.vexor = vexor;
    this.config = config;
  }

  GET = (request: NextRequest) => {
    return new NextResponse("GET");
  };
}

export type {
  RouteHandlersConfig,
};

export {
  RouteHandlers,
};
