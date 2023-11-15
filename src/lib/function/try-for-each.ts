type Fn<T, R, E> = (value: T) => R | E;

type OptionGuard<E> = (value: unknown) => value is E;

export function makeTryForEach<Err>(
  isError: OptionGuard<Err>,
  defaultError: Err
) {
  return function tryForEach<R, D>(action: Fn<R, D, Err>) {
    function tryFor<T>(t1: Fn<T, R, Err>): Fn<T, D, Err>;
    function tryFor<T, T2>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>
    ): Fn<T | T2, D, Err>;
    function tryFor<T, T2, T3>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>,
      t3: Fn<T3, R, Err>
    ): Fn<T | T2 | T3, D, Err>;
    function tryFor<T, T2, T3, T4>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>,
      t3: Fn<T3, R, Err>,
      t4: Fn<T4, R, Err>
    ): Fn<T | T2 | T3 | T4, D, Err>;
    function tryFor<T, T2, T3, T4, T5>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>,
      t3: Fn<T3, R, Err>,
      t4: Fn<T4, R, Err>,
      t5: Fn<T5, R, Err>
    ): Fn<T | T2 | T3 | T4 | T5, D, Err>;
    function tryFor<T, T2, T3, T4, T5, T6>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>,
      t3: Fn<T3, R, Err>,
      t4: Fn<T4, R, Err>,
      t5: Fn<T5, R, Err>,
      t6: Fn<T6, R, Err>
    ): Fn<T | T2 | T3 | T4 | T5 | T6, D, Err>;
    function tryFor<T, T2, T3, T4, T5, T6, T7>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>,
      t3: Fn<T3, R, Err>,
      t4: Fn<T4, R, Err>,
      t5: Fn<T5, R, Err>,
      t6: Fn<T6, R, Err>,
      t7: Fn<T7, R, Err>
    ): Fn<T | T2 | T3 | T4 | T5 | T6 | T7, D, Err>;
    function tryFor<T, T2, T3, T4, T5, T6, T7, T8>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>,
      t3: Fn<T3, R, Err>,
      t4: Fn<T4, R, Err>,
      t5: Fn<T5, R, Err>,
      t6: Fn<T6, R, Err>,
      t7: Fn<T7, R, Err>,
      t8: Fn<T8, R, Err>
    ): Fn<T | T2 | T3 | T4 | T5 | T6 | T7 | T8, D, Err>;
    function tryFor<T, T2, T3, T4, T5, T6, T7, T8, T9>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>,
      t3: Fn<T3, R, Err>,
      t4: Fn<T4, R, Err>,
      t5: Fn<T5, R, Err>,
      t6: Fn<T6, R, Err>,
      t7: Fn<T7, R, Err>,
      t8: Fn<T8, R, Err>,
      t9: Fn<T9, R, Err>
    ): Fn<T | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9, D, Err>;
    function tryFor<T, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>,
      t3: Fn<T3, R, Err>,
      t4: Fn<T4, R, Err>,
      t5: Fn<T5, R, Err>,
      t6: Fn<T6, R, Err>,
      t7: Fn<T7, R, Err>,
      t8: Fn<T8, R, Err>,
      t9: Fn<T9, R, Err>,
      t10: Fn<T10, R, Err>
    ): Fn<T | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10, D, Err>;
    function tryFor<T, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>,
      t3: Fn<T3, R, Err>,
      t4: Fn<T4, R, Err>,
      t5: Fn<T5, R, Err>,
      t6: Fn<T6, R, Err>,
      t7: Fn<T7, R, Err>,
      t8: Fn<T8, R, Err>,
      t9: Fn<T9, R, Err>,
      t10: Fn<T10, R, Err>,
      t11: Fn<T11, R, Err>
    ): Fn<T | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11, D, Err>;
    function tryFor<T, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>,
      t3: Fn<T3, R, Err>,
      t4: Fn<T4, R, Err>,
      t5: Fn<T5, R, Err>,
      t6: Fn<T6, R, Err>,
      t7: Fn<T7, R, Err>,
      t8: Fn<T8, R, Err>,
      t9: Fn<T9, R, Err>,
      t10: Fn<T10, R, Err>,
      t11: Fn<T11, R, Err>,
      t12: Fn<T12, R, Err>
    ): Fn<
      T | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12,
      D,
      Err
    >;
    function tryFor<T, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(
      t1: Fn<T, R, Err>,
      t2: Fn<T2, R, Err>,
      t3: Fn<T3, R, Err>,
      t4: Fn<T4, R, Err>,
      t5: Fn<T5, R, Err>,
      t6: Fn<T6, R, Err>,
      t7: Fn<T7, R, Err>,
      t8: Fn<T8, R, Err>,
      t9: Fn<T9, R, Err>,
      t10: Fn<T10, R, Err>,
      t11: Fn<T11, R, Err>,
      t12: Fn<T12, R, Err>,
      t13: Fn<T13, R, Err>
    ): Fn<
      T | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13,
      D,
      Err
    >;
    function tryFor(
      ...transformers: Fn<unknown, R, Err>[]
    ): Fn<unknown, D, Err> {
      return (value) => {
        for (let i = 0; i < transformers.length; i++) {
          const result = transformers[i](value);
          if (isError(result)) {
            continue;
          }
          const result2 = action(result);
          if (!isError(result2)) {
            return result2;
          }
        }
        return defaultError;
      };
    }
    return tryFor;
  }
}
