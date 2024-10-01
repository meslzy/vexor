import { Infer, Schema, InferIn } from "@typeschema/main";

import { Merge } from "../utils/types";

import { TypeError } from "./error";

type Default = "Default" & {
  readonly $: unique symbol;
};

type Value<V> = "Value" & {
  readonly $value: V;
};

type Shape<S> = "Shape" & {
  readonly $shape: S;
};

type InputType<T, $T> = T extends Default ? (
  $T
) : (
  T extends Shape<infer Shape> ? (
    Shape
  ) : (
    T extends Value<unknown> ? (
      $T
    ) : (
      T
    )
  )
);

type ResolveType<T, $T> = T extends Default ? (
  $T extends Default ? (
    Default
  ) : (
    Value<$T>
  )
) : (
  T extends Shape<unknown> ? (
    T
  ) : (
    T extends Value<infer V> ? (
      $T extends Default ? (
        Value<V>
      ) : (
        Value<Merge<V, $T>>
      )
    ) : (
      Shape<T>
    )
  )
);

type InferType<T, Fallback = Default> = T extends Default ? (
  Fallback
) : (
  T extends Shape<infer S> ? (
    S
  ) : (
    T extends Value<infer V> ? (
      V
    ) : (
      T
    )
  )
);

type Binary<I, O> = "Binary" & {
  readonly $input: I;
  readonly $output: O;
};

type ResolveBinarySchema<T, S extends Schema, Reverse extends boolean = false> = T extends Default ? (
  Binary<InferIn<S>, Infer<S>>
) : (
  T extends Binary<infer I, infer O> ? (
    Reverse extends true ? (
      Binary<Merge<I, InferIn<S>>, Merge<Infer<S>, O>>
    ) : (
      Binary<Merge<InferIn<S>, I>, Merge<O, Infer<S>>>
    )
  ) : (
    TypeError<"Could not resolve binary schema">
  )
);

type OverrideBinaryOutput<T, $T, Reverse extends boolean = false> = T extends Default ? (
  $T extends Default ? (
    Default
  ) : (
    Binary<Default, $T>
  )
) : (
  $T extends Default ? (
    T
  ) : (
    T extends Binary<infer I, infer O> ? (
      Reverse extends true ? (
        Binary<I, Merge<$T, O>>
      ) : (
        Binary<I, Merge<O, $T>>
      )
    ) : (
      TypeError<"Could not override binary output">
    )
  )
);

type InferBinaryInput<T, Fallback = Default> = T extends Default ? (
  Fallback
) : (
  T extends Binary<infer I, unknown> ? (
    I extends Default ? (
      Fallback
    ) : (
      I
    )
  ) : (
    Fallback
  )
);

type InferBinaryOutput<T, Fallback = Default> = T extends Default ? (
  Fallback
) : (
  T extends Binary<unknown, infer O> ? (
    O extends Default ? (
      Fallback
    ) : (
      O
    )
  ) : (
    Fallback
  )
);

type Poly<I, O> = "Poly" & {
  readonly $input: I;
  readonly $output: O;
};

type ResolvePoly<T, S extends Schema[]> = T extends Default ? (
  Poly<
    {
      [K in keyof S]: InferIn<S[K]>;
    },
    {
      [K in keyof S]: Infer<S[K]>;
    }
  >
) : (
  T extends Poly<infer I, infer O> ? (
    Poly<
      [
        // @ts-ignore
        ...I,
        ...{
          [K in keyof S]: InferIn<S[K]>;
        },
      ], [
        // @ts-ignore
        ...O,
        ...{
          [K in keyof S]: Infer<S[K]>;
        },
      ]
    >
  ) : (
    TypeError<"Could not resolve poly schema">
  )
);

type OverridePolyOutput<T, $T> = T extends Default ? (
  $T extends Default ? (
    Default
  ) : (
    Poly<Default, {
      [K in keyof $T]: $T[K];
    }>
  )
) : (
  $T extends Default ? (
    T
  ) : (
    T extends Poly<infer I, unknown> ? (
      Poly<
        I,
        $T
      >
    ) : (
      TypeError<"Could not override poly output">
    )
  )
);

type InferPolyInput<T, Fallback = Default> = T extends Default ? (
  Fallback
) : (
  T extends Poly<infer I, unknown> ? (
    I extends Default ? (
      Fallback
    ) : (
      I
    )
  ) : (
    Fallback
  )
);

type InferPolyOutput<T, Fallback = Default> = T extends Default ? (
  Fallback
) : (
  T extends Poly<unknown, infer O> ? (
    O extends Default ? (
      Fallback
    ) : (
      O
    )
  ) : (
    Fallback
  )
);

export {
  Default,
  InputType,
  ResolveType,
  InferType,
  //
  ResolveBinarySchema,
  OverrideBinaryOutput,
  InferBinaryInput,
  InferBinaryOutput,
  //
  ResolvePoly,
  OverridePolyOutput,
  InferPolyInput,
  InferPolyOutput,
};
