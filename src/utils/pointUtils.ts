import * as d3 from 'd3'
import { intersection } from 'lodash'

import { Circum } from '~/utils/circum'

export type Coord = [x: number, y: number]

type FormingPoints = [PointName, PointName, PointName]
type NeighbouringVertices = [VertexName, VertexName, VertexName]
export interface Vertex extends Circum {
  name: VertexName
  formingPoints: FormingPoints
  neighbouringVertices: NeighbouringVertices
}

export interface Point {
  name: PointName
  coord: Coord
}

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

export const groupPairs = <T>(array: T[]) => {
  const result: [T, T][] = []
  for (let i = 0; i < array.length; i++) {
    const ei = array[i]
    for (let j = i + 1; j < array.length; j++) {
      const ej = array[j]
      if (ei !== ej) {
        result.push([ei, ej])
      }
    }
  }
  return result
}

export type PointName = `p${number}`
export type VertexName = `v${number}`

export const findVertexByFormingPointNames = (
  vertices: Map<VertexName, Vertex>,
  formingPointNames: PointName[],
  ignoreVertics: VertexName[] = []
) =>
  Array.from(vertices.values()).reduce((acc, cur) => {
    if (ignoreVertics.includes(cur.name)) return acc
    if (
      intersection(cur.formingPoints, formingPointNames).length ===
      formingPointNames.length
    ) {
      acc.push(cur.name)
    }
    return acc
  }, [] as VertexName[])

export const findVertexByNeighbouringVertexName = (
  vertices: Map<VertexName, Vertex>,
  neighbouringVertexName: VertexName
) => {
  Array.from(vertices.values()).reduce((acc, cur) => {
    if (cur.neighbouringVertices.includes(neighbouringVertexName)) {
      acc.push(cur.name)
    }
    return acc
  }, [] as VertexName[])
}
