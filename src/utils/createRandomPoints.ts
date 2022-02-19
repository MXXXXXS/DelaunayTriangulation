import * as d3 from 'd3'

export type Coord = [x: number, y: number]

const mathRandomDomain = [0, 1]
const mathRandomDomainScale = (domain: Coord) =>
  d3.scaleLinear().domain(mathRandomDomain).range(domain)

export const createRandomPoints = (
  count: number,
  domain: [xDomain: Coord, yDomain: Coord]
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
