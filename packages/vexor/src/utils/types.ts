type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type Intersect<T, U> = {
  [P in keyof T | keyof U]: P extends keyof U ? U[P] : P extends keyof T ? T[P] : never;
};

type MergeTuples<T extends readonly any[], U extends readonly any[]> = [...T, ...U];

type Merge<T, U> = T extends readonly any[] ? (
  U extends readonly any[] ? (
    MergeTuples<T, U>
  ) : (
    U
  )
) : T extends object ? (
  U extends object ? (
    Prettify<Intersect<T, U>>
  ) : (
    U
  )
) : (
  U
);

export type {
  Merge,
};
