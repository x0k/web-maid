export type Comparator<T> = (a: T, b: T) => boolean

export class SortedApi<T> {
  constructor(
    public readonly items: T[],
    public readonly compare: Comparator<T>
  ) {}

  swap(first: number, second: number) {
    const tmp = this.items[first]
    this.items[first] = this.items[second]
    this.items[second] = tmp
  }

  findIndex(item: T) {
    let low = 0
    let high = this.items.length - 1
    while (low <= high) {
      const mid = (low + high) >> 1
      const guess = this.items[mid]
      if (item === guess) {
        return mid
      }
      if (this.compare(guess, item)) {
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    return -1
  }

  findInsertPosition(item: T) {
    let low = 0
    let high = this.items.length - 1
    let mid = 0
    while (low <= high) {
      mid = (low + high) >> 1
      if (this.compare(this.items[mid], item)) {
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    return low
  }

  insert(item: T) {
    this.items.splice(this.findInsertPosition(item), 0, item)
  }

  remove(item: T) {
    const index = this.findIndex(item)
    if (index >= 0) {
      this.items.splice(index, 1)
    }
  }

  invalidateOrder(index: number): number {
    const item = this.items[index]
    if (index > 0 && !this.compare(this.items[index - 1], item)) {
      return -1
    }
    if (
      index < this.items.length - 1 &&
      !this.compare(item, this.items[index + 1])
    ) {
      return 1
    }
    return 0
  }

  fixOrder(index: number, direction: number): void {
    const item = this.items[index]
    const lastIndex = this.items.length - 1
    let newIndex = index + direction
    this.swap(index, newIndex)
    if (direction < 0) {
      while (newIndex > 0 && !this.compare(this.items[newIndex - 1], item)) {
        this.swap(newIndex, --newIndex)
      }
    } else {
      while (
        newIndex < lastIndex &&
        !this.compare(item, this.items[newIndex + 1])
      ) {
        this.swap(newIndex, ++newIndex)
      }
    }
  }

  invalidateAndFixOrder(index: number): void {
    const order = this.invalidateOrder(index)
    if (order !== 0) {
      this.fixOrder(index, order)
    }
  }
}
