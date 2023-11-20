export function evalInScope<S>(js: string, scope: S) {
  return new Function(`with (this) { return (${js}); }`).call(scope);
}

export function evalInContext<C>(js: string, context: C) {
  return new Function(`return (${js});`).call(context);
}
