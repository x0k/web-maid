export function evalInScope<S>(js: string, scope: S) {
  return new Function(`with (this) { return (${js}); }`).call(scope);
}

export function evalInContext<C>(js: string, context: C) {
  return function () {
    return eval(js);
  }.call(context);
}
