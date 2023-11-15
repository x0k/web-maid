
type Fn<T, R, E> = (value: T) => R | E

type OptionGuard<E> = (value: unknown) => value is E

export function makeOptionFlow<Err>(guard: OptionGuard<Err>) {
  function optionFlow<A extends ReadonlyArray<unknown>, B>(
    ab: (...a: A) => B | Err,
  ): (...a: A) => B | Err
  function optionFlow<A extends ReadonlyArray<unknown>, B, C>(
    ab: (...a: A) => B | Err,
    bc: Fn<B, C, Err>,
  ): (...a: A) => C | Err
  function optionFlow<A extends ReadonlyArray<unknown>, B, C, D>(
    ab: (...a: A) => B | Err,
    bc: Fn<B, C, Err>,
    cd: Fn<C, D, Err>,
  ): (...a: A) => D | Err
  function optionFlow<A extends ReadonlyArray<unknown>, B, C, D, E>(
    ab: (...a: A) => B | Err,
    bc: Fn<B, C, Err>,
    cd: Fn<C, D, Err>,
    de: Fn<D, E, Err>,
  ): (...a: A) => E | Err
  function optionFlow<A extends ReadonlyArray<unknown>, B, C, D, E, F>(
    ab: (...a: A) => B | Err,
    bc: Fn<B, C, Err>,
    cd: Fn<C, D, Err>,
    de: Fn<D, E, Err>,
    ef: Fn<E, F, Err>,
  ): (...a: A) => F | Err
  function optionFlow<A extends ReadonlyArray<unknown>, B, C, D, E, F, G>(
    ab: (...a: A) => B | Err,
    bc: Fn<B, C, Err>,
    cd: Fn<C, D, Err>,
    de: Fn<D, E, Err>,
    ef: Fn<E, F, Err>,
    fg: Fn<F, G, Err>,
  ): (...a: A) => G | Err
  function optionFlow<A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H>(
    ab: (...a: A) => B | Err,
    bc: Fn<B, C, Err>,
    cd: Fn<C, D, Err>,
    de: Fn<D, E, Err>,
    ef: Fn<E, F, Err>,
    fg: Fn<F, G, Err>,
    gh: Fn<G, H, Err>,
  ): (...a: A) => H | Err
  function optionFlow<A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H, I>(
    ab: (...a: A) => B | Err,
    bc: Fn<B, C, Err>,
    cd: Fn<C, D, Err>,
    de: Fn<D, E, Err>,
    ef: Fn<E, F, Err>,
    fg: Fn<F, G, Err>,
    gh: Fn<G, H, Err>,
    hi: Fn<H, I, Err>,
  ): (...a: A) => I | Err
  function optionFlow<A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H, I, J>(
    ab: (...a: A) => B | Err,
    bc: Fn<B, C, Err>,
    cd: Fn<C, D, Err>,
    de: Fn<D, E, Err>,
    ef: Fn<E, F, Err>,
    fg: Fn<F, G, Err>,
    gh: Fn<G, H, Err>,
    hi: Fn<H, I, Err>,
    ij: Fn<I, J, Err>,
  ): (...a: A) => J | Err
  function optionFlow<A extends ReadonlyArray<unknown>>(
    firstFn: Fn<A, unknown, Err>,
    ...fns: Array<Fn<unknown, unknown, Err>>
  ): unknown {
    if (fns.length === 0) {
      return firstFn
    }
    return (...args: A) => {
      //@ts-expect-error typescript
      let result = firstFn(...args)
      let i = 0
      while (!guard(result) && i < fns.length) {
        result = fns[i++](result)
      }
      return result
    }
  }
  return optionFlow
}