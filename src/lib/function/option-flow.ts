type Fn<T, R, E> = (value: T) => R | E

type OptionGuard<E> = (value: unknown) => value is E

export function optionFlow<Err, A extends ReadonlyArray<unknown>, B>(
  guard: OptionGuard<Err>,
  ab: (...a: A) => B | Err,
): (...a: A) => B | Err
export function optionFlow<Err, A extends ReadonlyArray<unknown>, B, C>(
  guard: OptionGuard<Err>,
  ab: (...a: A) => B | Err,
  bc: Fn<B, C, Err>,
): (...a: A) => C | Err
export function optionFlow<Err, A extends ReadonlyArray<unknown>, B, C, D>(
  guard: OptionGuard<Err>,
  ab: (...a: A) => B | Err,
  bc: Fn<B, C, Err>,
  cd: Fn<C, D, Err>,
): (...a: A) => D | Err
export function optionFlow<Err, A extends ReadonlyArray<unknown>, B, C, D, E>(
  guard: OptionGuard<Err>,
  ab: (...a: A) => B | Err,
  bc: Fn<B, C, Err>,
  cd: Fn<C, D, Err>,
  de: Fn<D, E, Err>,
): (...a: A) => E | Err
export function optionFlow<Err, A extends ReadonlyArray<unknown>, B, C, D, E, F>(
  guard: OptionGuard<Err>,
  ab: (...a: A) => B | Err,
  bc: Fn<B, C, Err>,
  cd: Fn<C, D, Err>,
  de: Fn<D, E, Err>,
  ef: Fn<E, F, Err>,
): (...a: A) => F | Err
export function optionFlow<Err, A extends ReadonlyArray<unknown>, B, C, D, E, F, G>(
  guard: OptionGuard<Err>,
  ab: (...a: A) => B | Err,
  bc: Fn<B, C, Err>,
  cd: Fn<C, D, Err>,
  de: Fn<D, E, Err>,
  ef: Fn<E, F, Err>,
  fg: Fn<F, G, Err>,
): (...a: A) => G | Err
export function optionFlow<Err, A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H>(
  guard: OptionGuard<Err>,
  ab: (...a: A) => B | Err,
  bc: Fn<B, C, Err>,
  cd: Fn<C, D, Err>,
  de: Fn<D, E, Err>,
  ef: Fn<E, F, Err>,
  fg: Fn<F, G, Err>,
  gh: Fn<G, H, Err>,
): (...a: A) => H | Err
export function optionFlow<Err, A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H, I>(
  guard: OptionGuard<Err>,
  ab: (...a: A) => B | Err,
  bc: Fn<B, C, Err>,
  cd: Fn<C, D, Err>,
  de: Fn<D, E, Err>,
  ef: Fn<E, F, Err>,
  fg: Fn<F, G, Err>,
  gh: Fn<G, H, Err>,
  hi: Fn<H, I, Err>,
): (...a: A) => I | Err
export function optionFlow<Err, A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H, I, J>(
  guard: OptionGuard<Err>,
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
export function optionFlow<Err, A extends ReadonlyArray<unknown>>(
  guard: OptionGuard<Err>,
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