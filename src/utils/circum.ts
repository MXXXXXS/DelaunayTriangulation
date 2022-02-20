import { Coord } from './pointUtils'

export interface Circum {
  center: Coord
  r2: number
}
// https://www.ics.uci.edu/~eppstein/junkyard/circumcenter.html
export const circum = (a: Coord, b: Coord, c: Coord): Circum => {
  const [a_0, a_1] = a
  const [b_0, b_1] = b
  const [c_0, c_1] = c
  const D = (a_0 - c_0) * (b_1 - c_1) - (b_0 - c_0) * (a_1 - c_1)
  const p_0 =
    ((((a_0 - c_0) * (a_0 + c_0) + (a_1 - c_1) * (a_1 + c_1)) / 2) *
      (b_1 - c_1) -
      (((b_0 - c_0) * (b_0 + c_0) + (b_1 - c_1) * (b_1 + c_1)) / 2) *
        (a_1 - c_1)) /
    D
  const p_1 =
    ((((b_0 - c_0) * (b_0 + c_0) + (b_1 - c_1) * (b_1 + c_1)) / 2) *
      (a_0 - c_0) -
      (((a_0 - c_0) * (a_0 + c_0) + (a_1 - c_1) * (a_1 + c_1)) / 2) *
        (b_0 - c_0)) /
    D
  return { center: [p_0, p_1], r2: (c_0 - p_0) ** 2 + (c_1 - p_1) ** 2 }
}
