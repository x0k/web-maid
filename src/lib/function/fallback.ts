export type Fallback<Args extends unknown[], R> = (...args: Args) => R;

export function fallbackToDefault<Args extends unknown[], R>(
  defaultValue: R,
  ...actions: Fallback<Args, R>[]
) {
  return (...args: Args) => {
    let result = defaultValue;
    for (const action of actions) {
      result = action(...args);
      if (result) {
        return result;
      }
    }
    return result;
  };
}

export function fallbackToError<Args extends unknown[], R, E>(
  error: E,
  ...actions: Fallback<Args, R>[]
) {
  return (...args: Args) => {
    let result: R;
    for (const action of actions) {
      result = action(...args);
      if (result) {
        return result;
      }
    }
    throw error;
  };
}
