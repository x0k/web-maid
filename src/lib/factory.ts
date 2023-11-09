export interface Factory<T, R> {
  Create(config: T): R
}
