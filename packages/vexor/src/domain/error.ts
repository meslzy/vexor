import {isNotFoundError} from "next/dist/client/components/not-found";
import {isRedirectError} from "next/dist/client/components/redirect";

interface Code {
  status: number;
  message: string;
}

enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  PAYMENT_REQUIRED = "PAYMENT_REQUIRED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
  REQUEST_TIMEOUT = "REQUEST_TIMEOUT",
  CONFLICT = "CONFLICT",
  PRECONDITION_FAILED = "PRECONDITION_FAILED",
  PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE",
  IM_A_TEAPOT = "IM_A_TEAPOT",
  UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY",
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
  BAD_GATEWAY = "BAD_GATEWAY",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  INSUFFICIENT_STORAGE = "INSUFFICIENT_STORAGE",
}

const codes: Record<ErrorCode, Code> = {
  BAD_REQUEST: {
    status: 400,
    message: "The server could not understand the request due to invalid syntax or a client error.",
  },
  UNAUTHORIZED: {
    status: 401,
    message: "The request was not completed because it lacks valid authentication credentials.",
  },
  PAYMENT_REQUIRED: {
    status: 402,
    message: "Payment is required to process the request. This status code is reserved for future use.",
  },
  FORBIDDEN: {
    status: 403,
    message: "The server understood the request but refuses to authorize it due to insufficient permissions.",
  },
  NOT_FOUND: {
    status: 404,
    message: "The requested resource could not be found on the server.",
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    message: "The request method is known by the server but is not supported by the target resource.",
  },
  REQUEST_TIMEOUT: {
    status: 408,
    message: "The server timed out waiting for the request. The connection was closed before the server could process the request.",
  },
  CONFLICT: {
    status: 409,
    message: "The request could not be completed due to a conflict with the current state of the resource.",
  },
  PRECONDITION_FAILED: {
    status: 412,
    message: "The server does not meet one of the preconditions that the client placed on the request.",
  },
  PAYLOAD_TOO_LARGE: {
    status: 413,
    message: "The request entity is larger than what the server is willing or able to process.",
  },
  UNSUPPORTED_MEDIA_TYPE: {
    status: 415,
    message: "The server refuses to process the request because the payload is in an unsupported format.",
  },
  IM_A_TEAPOT: {
    status: 418,
    message: "The server refuses to brew coffee because it is, permanently, a teapot. (Just for fun!)",
  },
  UNPROCESSABLE_ENTITY: {
    status: 422,
    message: "The server understands the content type and syntax of the request but was unable to process the contained instructions.",
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    message: "The user has sent too many requests in a given amount of time (rate limiting).",
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: "The server encountered an unexpected condition that prevented it from fulfilling the request.",
  },
  NOT_IMPLEMENTED: {
    status: 501,
    message: "The server does not support the functionality required to fulfill the request.",
  },
  BAD_GATEWAY: {
    status: 502,
    message: "The server, while acting as a gateway or proxy, received an invalid response from the upstream server.",
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: "The server is currently unable to handle the request due to temporary overload or maintenance.",
  },
  INSUFFICIENT_STORAGE: {
    status: 507,
    message: "The server is unable to store the representation needed to complete the request.",
  },
};

interface ServerErrorConfig {
  code: ErrorCode;
  message?: string;
  cause?: unknown;
}

class ServerError extends Error {
  readonly name = "ServerError";
  readonly code: ErrorCode;
  readonly status: number;

  constructor(config: ServerErrorConfig) {
    const code = codes[config.code];
    super(config.message ?? code.message, {
      cause: config.cause,
    });
    this.code = config.code;
    this.status = code.status;
  }

  static isServerError(error: unknown): error is ServerError {
    return (
      error instanceof ServerError ||
      (
        error !== null &&
        typeof error === "object" &&
        error["name"] === "ServerError"
      )
    );
  }

  static fromError(cause: Error) {
    return new ServerError({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: cause.message,
      cause,
    });
  }

  static default(cause?: unknown) {
    return new ServerError({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "An unexpected error occurred.",
      cause,
    });
  }

  serialize() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
    } as ServerError;
  }
}

interface ValidationIssue {
  message: string;
  path?: Array<PropertyKey>;
}

interface ValidationErrorConfig {
  issues: ValidationIssue[];
}

class ValidationError extends Error {
  readonly name = "ValidationError";

  issues: ValidationIssue[];

  constructor(config: ValidationErrorConfig) {
    super();
    this.issues = config.issues;
  }

  static isValidationError(error: unknown): error is ValidationError {
    return (
      error instanceof ValidationError ||
      (
        error !== null &&
        typeof error === "object" &&
        error["name"] === "ValidationError")
    );
  }

  static create(issues: ValidationIssue[]) {
    return new ValidationError({
      issues,
    });
  }

  serialize() {
    return {
      name: this.name,
      message: this.message,
      issues: this.issues,
    } as ValidationError;
  }
}

interface NextErrorConfig {
  originalError: Error & {
    digest?: string;
  };
}

class NextError extends Error {
  readonly name = "NextError";

  readonly originalError: Error & {
    digest?: string;
  };

  constructor(config: NextErrorConfig) {
    super();
    this.originalError = config.originalError;
  }

  static isNextError(error: unknown): error is NextError {
    return (
      isNotFoundError(error) ||
      isRedirectError(error)
    );
  }
}

type TypeError<Message extends string> = Message & {
  readonly __errorType: unique symbol;
};

export {
  ErrorCode,
};

export type {
  ServerErrorConfig,
  ValidationIssue,
  ValidationErrorConfig,
  NextErrorConfig,
  TypeError,
};

export {
  NextError,
  ServerError,
  ValidationError,
};
