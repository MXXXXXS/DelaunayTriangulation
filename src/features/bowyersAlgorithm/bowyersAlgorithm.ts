/* eslint-disable no-debugger */
// import assert from 'assert'
import { intersection, remove, uniq } from 'lodash'

import { circum } from '~/utils/circum'
import {
  Coord,
  createRandomPoints,
  distance2,
  findVertexByFormingPointNames,
  groupPairs,
  PointName,
  Range,
  VertexName,
} from '~/utils/pointUtils'
import { Point, Vertex } from '~/utils/pointUtils'
import { surroundingTriangle } from '~/utils/surroundingTriangle'

// 准备好存储结构
export const points = new Map<PointName, Point>()

const vertices = new Map<VertexName, Vertex>()

// 准备一些散点
const totalPointCounts = 6
const domainX: Range = [0, 100]
const domainY: Range = [0, 100]

const pointCoords = createRandomPoints(totalPointCounts, [domainX, domainY])

pointCoords.forEach((coord, index) => {
  points.set(`p${index}`, {
    name: `p${index}`,
    coord,
  })
})

// 准备第一张Voronoi diagram

// 随机选取三个点构建第一张图...
// 然后开始逐个插入点来构建Voronoi diagram
// 加入点Q会导致现有的图不成立...标记需要删除的vertex...

// 等等, 万一加入的Q离初始三点很远, 现有的图还是成立的, 咋办?
// 算法的步骤有个前提: 每次会在已构建好的图内部插入点, 来保证加入点后现有图会不成立

// 看来初始的三个点不能随意选, 三个点围成的三角形应该能包含所有的点
// super triangle的引入原因就在此

// 找一个super triangle
// 现有的点的凸包是一个矩形, 选矩形最小外接三角形作为super triangle
// 以矩形的两条相邻边作为三角形的两边, 矩形对角线斜率即三角形斜率

const initialThreePoints = surroundingTriangle(
  [domainX[0], domainY[0]],
  domainX[1] - domainX[0],
  domainY[1] - domainY[0]
)

// p-1, p-2, p-3 作为super triangle的三点
for (let i = -1; i > -4; i--) {
  const pn: PointName = `p${i}`
  points.set(pn, { name: pn, coord: initialThreePoints[-i - 1] })
}

// v-1 作为无穷远的vertex, 第一个vertex是 v0
vertices.set('v0', {
  name: 'v0',
  formingPoints: [`p-1`, `p-2`, 'p-3'],
  neighbouringVertices: ['v-1', 'v-1', 'v-1'],
  ...circum(
    points.get('p-1')?.coord as Coord,
    points.get('p-2')?.coord as Coord,
    points.get('p-3')?.coord as Coord
  ),
})

let vertexIndex = 1
let pointIndex = 0
const pointsAdded: PointName[] = ['p-1', 'p-2', 'p-3']
export function getNextDiagram() {
  if (pointIndex < totalPointCounts) {
    const pq: PointName = `p${pointIndex}`
    addPoint(pq)
    pointsAdded.push(pq)
    vertexIndex++
    pointIndex++
  }
  const pointsMap = pointsAdded.reduce((acc, pointName) => {
    acc.set(pointName, points.get(pointName) as Point)
    return acc
  }, new Map<PointName, Point>())
  return { vertices, points: pointsMap }
}

function addPoint(pq: PointName) {
  const pqCoord = points.get(pq) as Point

  // 插入点q后, 会有vertex不再成立. 找出这些vertices, 标记为需要删除的vertices
  const verticesNeedDelete: VertexName[] = []
  for (const [v, { r2, center }] of vertices) {
    const vertexIsInvalid = distance2(center, pqCoord.coord) < r2
    if (vertexIsInvalid) {
      verticesNeedDelete.push(v)
    }
  }
  for (const [_, vertex] of vertices) {
    remove(vertex.neighbouringVertices, (vertexName) => {
      return verticesNeedDelete.includes(vertexName)
    })
  }

  // 找出q周围的points, 即被删除的vertices的forming points
  const pointsContiguousToQ: PointName[] = uniq(
    verticesNeedDelete.reduce((pointsContiguousToQAcc, vertexName) => {
      const vertex = vertices.get(vertexName)
      if (vertex) {
        pointsContiguousToQAcc.push(...vertex.formingPoints)
      }
      return pointsContiguousToQAcc
    }, [] as PointName[])
  )

  // 删除应该删除的vertices
  verticesNeedDelete.forEach((vertexName) => {
    vertices.delete(vertexName)
  })

  // 计算新形成的vertices, pointsContiguousToQ中任意2个points和Q构成一个新的vertex
  const newVertices: (Omit<Vertex, 'neighbouringVertices'> & {
    neighbouringVertices: VertexName[]
  })[] = []
  groupPairs(pointsContiguousToQ).forEach(([pointA, pointB]) => {
    const pqCoord = points.get(pq)?.coord as Coord
    const pointACoord = points.get(pointA)?.coord as Coord
    const pointBCoord = points.get(pointB)?.coord as Coord

    const { center, r2 } = circum(pqCoord, pointACoord, pointBCoord)
    newVertices.push({
      name: `v${vertexIndex++}`,
      formingPoints: [pq, pointA, pointB],
      neighbouringVertices: [],
      center,
      r2,
    })
  })

  // 找出新形成的vertices的neighbouringVertices
  // 1. 半删除接触的保留vertex
  newVertices.forEach((newVertex) => {
    const { formingPoints } = newVertex
    const [_, pa, pb] = formingPoints
    const result = findVertexByFormingPointNames(vertices, [pa, pb])
    if (result.length === 1) {
      newVertex.neighbouringVertices.push(result[0])
      // assert.equal(newVertex.neighbouringVertices.length, 1)
    }
    // assert.ok(result.length < 2)
  })
  // 2. 新形成的vertex之间
  groupPairs(newVertices).forEach(([vertexA, vertexB]) => {
    const result = intersection(vertexA.formingPoints, vertexB.formingPoints)
    if (result.length === 2) {
      // assert.ok(vertexB.neighbouringVertices.length < 3)
      vertexB.neighbouringVertices.push(vertexA.name)
      vertexA.neighbouringVertices.push(vertexB.name)
    }
  })
  newVertices.forEach((vertex) => {
    // assert.ok(vertex.neighbouringVertices.length <= 3)
    vertices.set(vertex.name, vertex as Vertex)
  })
}

// console.log(vertices)
// console.log(points)

// eslint-disable-next-line no-debugger
// debugger
