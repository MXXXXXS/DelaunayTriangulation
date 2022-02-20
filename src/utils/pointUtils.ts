import * as d3 from 'd3'

import { PointName } from "../features/bowyer's algorithm/bowyer'sAlg"

export type Coord = [x: number, y: number]

const mathRandomDomain = [0, 1]
const mathRandomDomainScale = (domain: Coord) =>
  d3.scaleLinear().domain(mathRandomDomain).range(domain)

export type Range = [min: number, max: number]

export const createRandomPoints = (
  count: number,
  domain: [xDomain: Range, yDomain: Range]
) => {
  const points: Coord[] = []
  const mathRandomScaleX = mathRandomDomainScale(domain[0])
  const mathRandomScaleY = mathRandomDomainScale(domain[0])
  for (let i = 0; i < count; i++) {
    points.push([
      mathRandomScaleX(Math.random()),
      mathRandomScaleY(Math.random()),
    ])
  }
  return points
}

export function getRandomPointName(totalPointCounts: number): PointName {
  return `p${Math.round(Math.random() * totalPointCounts)}`
}

export const distance2 = (a: Coord, b: Coord) => {
  const [a0, a1] = a
  const [b0, b1] = b
  return (a0 - b0) ** 2 + (a1 - b1) ** 2
}

export const isPerpendicular = (
  lineA: [Coord, Coord],
  lineB: [Coord, Coord]
) => {
  const v1 = [lineA[1][0] - lineA[0][0], lineA[1][1] - lineA[0][1]]
  const v2 = [lineB[1][0] - lineB[0][0], lineB[1][1] - lineB[0][1]]
  // https://en.wikipedia.org/wiki/Machine_epsilon
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON
  const dotProduct = v1[0] * v2[0] + v1[1] * v2[1]
  return isNaN(dotProduct) ? true : dotProduct < Number.EPSILON
}

export const groupPairs = <T>(array: T[]) => {
  const result: [T, T][] = []
  for (let i = 0; i < array.length; i++) {
    const ei = array[i]
    for (let j = 0; j < array.length; j++) {
      const ej = array[j]
      if (ei !== ej) {
        result.push([ei, ej])
      }
    }
  }
  return result
}

export const each2 = <I, J>(
  arrI: I[],
  arrJ: J[],
  isMatch: (ei: I, ej: J) => boolean,
  whenMatch: (ei: I, ej: J) => void
) => {
  const aI = [...arrI]
  const aJ = [...arrJ]
  for (let i = 0; i < aI.length; i++) {
    const ei = aI[i]
    for (let j = 0; j < aJ.length; j++) {
      const ej = aJ[j]
      if (isMatch(ei, ej)) {
        whenMatch(ei, ej)
        aI.splice(i, 1)
        aJ.splice(j, 1)
        i = -1
        break
      }
    }
  }
}
