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
