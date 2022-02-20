/* eslint-disable no-debugger */
import { intersection, intersectionWith, uniq } from 'lodash'

import { Circum, circum } from '~/utils/circum'
import {
  Coord,
  createRandomPoints,
  distance2,
  each2,
  groupPairs,
  isPerpendicular,
  Range,
} from '~/utils/pointUtils'
import { surroundingTriangle } from '~/utils/surroundingTriangle'

// 准备好存储结构
export type PointName = `p${number}`
export type VertexName = `v${number}`
const splitter = ','
type Splitter = typeof splitter

type FormingPoints = [PointName, PointName, PointName]
type NeighbouringVertices = [VertexName, VertexName, VertexName]
interface Vertex extends Circum {
  name: VertexName
  formingPoints: FormingPoints
  neighbouringVertices: NeighbouringVertices
}

interface Point {
  name: PointName
  coord: Coord
}

const points = new Map<PointName, Point>()
points.set('p-1', {
  name: 'p-1',
  coord: [NaN, NaN],
})

const vertices = new Map<VertexName, Vertex>()
vertices.set('v-1', {
  name: 'v-1',
  center: [NaN, NaN],
  r2: Infinity,
  formingPoints: ['p-1', 'p-1', 'p-1'],
  neighbouringVertices: ['v-1', 'v-1', 'v-1'],
})

type ContiguityName = `${PointName}${Splitter}${PointName}`

enum ContiguityDeletedStates {
  intact,
  half,
  deleted,
}

interface Contiguity {
  deletedState: ContiguityDeletedStates
  vertices: [VertexName, VertexName]
}

export function isSameContiguity(a: ContiguityName, b: ContiguityName) {
  const [a0, a1] = a.split(splitter)
  const [b0, b1] = b.split(splitter)
  return (a0 === b0 && a1 === b1) || (a0 === b1 && a1 === b0)
}

// 准备一些散点
const totalPointCounts = 20
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
points.set(`p-2`, { name: 'p-2', coord: initialThreePoints[0] })
points.set(`p-3`, { name: 'p-3', coord: initialThreePoints[1] })
points.set(`p-4`, { name: 'p-4', coord: initialThreePoints[2] })

vertices.set('v0', {
  name: 'v0',
  neighbouringVertices: ['v-1', 'v-1', 'v-1'], // v-1 为无穷远的vertex
  formingPoints: ['p-2', 'p-3', 'p-4'],
  ...circum(...initialThreePoints),
})

// 记录"接触"
const contiguities = new Map<ContiguityName, Contiguity>()
contiguities.set(`p-4${splitter}p-3`, {
  deletedState: ContiguityDeletedStates.intact,
  vertices: ['v-1', 'v0'],
})
contiguities.set(`p-2${splitter}p-4`, {
  deletedState: ContiguityDeletedStates.intact,
  vertices: ['v-1', 'v0'],
})
contiguities.set(`p-2${splitter}p-3`, {
  deletedState: ContiguityDeletedStates.intact,
  vertices: ['v-1', 'v0'],
})

// 开始插入点
let vertexIndex = 1
for (let i = 0; i < totalPointCounts; i++) {
  addPoint(`p${i}`)
}

function addPoint(pq: PointName) {
  const pqCoord = points.get(pq) as Point

  const verticesNeedDelete: VertexName[] = []
  Array.from(vertices.entries()).forEach(([v, { r2, center }]) => {
    const vertexIsInvalid = distance2(center, pqCoord.coord) < r2
    if (vertexIsInvalid) {
      verticesNeedDelete.push(v)
    }
  })

  const pointsContiguous = uniq(
    verticesNeedDelete.reduce((acc, v) => {
      const { formingPoints } = vertices.get(v) as Vertex
      acc.push(...formingPoints)
      return acc
    }, [] as PointName[])
  )

  verticesNeedDelete.forEach((vertexName) => {
    vertices.delete(vertexName)
  })

  const newVertices: (Omit<Vertex, 'neighbouringVertices'> & {
    neighbouringVertices: VertexName[]
  })[] = []
  Array.from(contiguities.entries()).forEach(([contiguityName, contiguity]) => {
    const contiguityPoints = contiguityName.split(splitter) as [
      PointName,
      PointName
    ]
    const hasDeletedContiguousPoints = intersection(
      contiguityPoints,
      pointsContiguous
    )
    if (hasDeletedContiguousPoints.length === 0) return
    const [deletedState, reservedVertices] = contiguity.vertices.reduce(
      (acc, name) => {
        if (verticesNeedDelete.includes(name)) {
          acc[0]++
        } else {
          acc[1].push(name)
        }
        return acc
      },
      [0, []] as [ContiguityDeletedStates, VertexName[]]
    )
    switch (deletedState) {
      case ContiguityDeletedStates.half: {
        const newFormingPoints = [pq, ...contiguityPoints] as FormingPoints
        const newVertexName: VertexName = `v${vertexIndex++}`
        const { r2, center } = circum(
          ...(newFormingPoints.map((p) => points.get(p)?.coord as Coord) as [
            Coord,
            Coord,
            Coord
          ])
        )
        if (reservedVertices.length !== 1) {
          debugger
        }
        newVertices.push({
          center,
          r2,
          name: newVertexName,
          formingPoints: newFormingPoints,
          neighbouringVertices: reservedVertices,
        })
        break
      }
      case ContiguityDeletedStates.deleted: {
        contiguities.delete(contiguityName)
        break
      }
    }
  })

  // 完善新加的vertices的neighbouringVertices
  intersectionWith(
    newVertices,
    [...newVertices, ...Array.from(vertices.values())],
    (va, vb) => {
      if (va.name === vb.name) return false
      const sameFormingPoints = intersection(va.formingPoints, vb.formingPoints)
      //  具有两个相同forming points说明这两个vertex会构成一个"接触"
      if (sameFormingPoints.length === 2) {
        vb.neighbouringVertices.push(va.name)
        va.neighbouringVertices.push(vb.name)
      }
      return false
    }
  )

  // 添加新的vertices
  newVertices.forEach((newVertex) => {
    newVertex.neighbouringVertices = uniq(newVertex.neighbouringVertices)
    if (newVertex.neighbouringVertices.length !== 3) {
      debugger
    }
    vertices.set(newVertex.name, newVertex as Vertex)
  })

  // 更新"接触"
  Array.from(vertices.entries()).forEach(
    ([_, { formingPoints, neighbouringVertices }]) => {
      const [pa, pb, pc] = formingPoints.map((p) => points.get(p) as Point)
      const [va, vb, vc] = neighbouringVertices.map(
        (v) => ({ ...vertices.get(v) } as Vertex)
      )
      const pointPairs = groupPairs([pa, pb, pc])
      const vertexPairs = groupPairs([va, vb, vc])
      each2(
        pointPairs,
        vertexPairs,
        ([pa, pb], [va, vb]) => {
          if (!vb) debugger
          return isPerpendicular([pa.coord, pb.coord], [va.center, vb.center])
        },
        ([pa, pb], [va, vb]) => {
          if (!va || !vb) {
            debugger
          }
          const na: ContiguityName = `${pa.name}${splitter}${pb.name}`
          const nb: ContiguityName = `${pb.name}${splitter}${pa.name}`
          const contiguity: Contiguity = {
            deletedState: ContiguityDeletedStates.intact,
            vertices: [va.name, vb.name],
          }
          // 避免ContiguityName重复
          if (contiguities.get(na)) {
            contiguities.set(na, contiguity)
          } else if (contiguities.get(nb)) {
            contiguities.set(nb, contiguity)
          } else {
            contiguities.set(na, contiguity)
          }
        }
      )
    }
  )
}

console.log(vertices)
console.log(points)

// eslint-disable-next-line no-debugger
debugger
