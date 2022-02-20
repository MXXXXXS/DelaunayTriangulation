import { Coord } from './pointUtils'

export const surroundingTriangle = (
  anchor: Coord,
  w: number,
  h: number
): [Coord, Coord, Coord] => {
  const [ax, ay] = anchor
  return [anchor, [ax, ay + 2 * h], [ax + 2 * w, ay]]
}
