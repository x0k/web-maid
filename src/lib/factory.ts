export interface Factory<T, R> {
  Create(value: T): R
}
