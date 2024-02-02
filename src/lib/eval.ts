export function evalInScope<S>(js: string, scope: S) {
  return new Function(`with (this) { ${js} }`).call(scope);
}

export function evalInContext<C>(js: string, context: C) {
  return new Function(js).call(context);
}
