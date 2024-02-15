export function moveItemBeforeInPlace<T>(
  items: T[],
  movedIndex: number,
  beforeIndex: number
) {
  if (beforeIndex === movedIndex || beforeIndex - 1 === movedIndex) {
    return movedIndex
  }
  const moved = items[movedIndex]
  if (movedIndex > beforeIndex) {
    for (let i = movedIndex; i > beforeIndex; i--) {
      items[i] = items[i - 1]
    }
    items[beforeIndex] = moved
    return beforeIndex
  } else {
    for (let i = movedIndex; i < beforeIndex - 1; i++) {
      items[i] = items[i + 1]
    }
    items[beforeIndex - 1] = moved
    return beforeIndex - 1
  }
}
