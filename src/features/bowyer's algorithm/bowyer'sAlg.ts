/* eslint-disable no-debugger */
import { entries, filter, intersection, intersectionWith, uniq } from 'lodash'

import { Circum, circum } from '~/utils/circum'
import {
  Contiguities,
  Contiguity,
  ContiguityDeletedStates,
  ContiguityName,
  Coord,
  createRandomPoints,
  distance2,
  each2,
  groupPairs,
  isPerpendicular,
  PointName,
  Range,
  splitter,
  VertexName,
} from '~/utils/pointUtils'
import { surroundingTriangle } from '~/utils/surroundingTriangle'

// 准备好存储结构

type FormingPoints = [PointName, PointName, PointName] | [PointName, PointName]
type NeighbouringVertices = [VertexName, VertexName, VertexName] | [VertexName]
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

const vertices = new Map<VertexName, Vertex>()

export function isSameContiguity(a: ContiguityName, b: ContiguityName) {
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

// p-1作为无穷远vertex的一个forming point
points.set('p-1', {
  name: 'p-1',
  coord: [NaN, NaN],
})
for (let i = -2; i > -5; i--) {
  // p-2, p-3, p-4 作为super triangle的三点
  const pn: PointName = `p${i}`
  points.set(pn, { name: pn, coord: initialThreePoints[-i - 2] })

  const vn: VertexName = `v${i + 1}`
  // 所有无穷远vertex都是负数标
  vertices.set(vn, {
    name: vn,
    center: [NaN, NaN],
    r2: Infinity,
    formingPoints: (
      [
        ['p-4', 'p-3'],
        ['p-2', 'p-4'],
        ['p-2', 'p-3'],
      ] as FormingPoints[]
    )[-i - 2],
    neighbouringVertices: ['v0'],
  })
}

vertices.set('v0', {
  name: 'v0',
  neighbouringVertices: ['v-1', 'v-1', 'v-1'], // v-1 为无穷远的vertex
  formingPoints: ['p-2', 'p-3', 'p-4'],
  ...circum(...initialThreePoints),
})

// 记录"接触"
const contiguities = new Contiguities()

contiguities.set(`p-4`, `p-3`, {
  name: 'p-4,p-3',
  deletedState: ContiguityDeletedStates.intact,
  vertices: ['v-1', 'v0'],
  points: ['p-4', 'p-3'],
})
contiguities.set(`p-2`, `p-4`, {
  name: 'p-2,p-4',
  deletedState: ContiguityDeletedStates.intact,
  vertices: ['v-2', 'v0'],
  points: ['p-2', 'p-4'],
})
contiguities.set(`p-2`, `p-3`, {
  name: 'p-2,p-3',
  deletedState: ContiguityDeletedStates.intact,
  vertices: ['v-3', 'v0'],
  points: ['p-2', 'p-3'],
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

  const { pointsContiguous, affectedContiguities } = verticesNeedDelete.reduce(
    ({ pointsContiguous, affectedContiguities }, v, index, arr) => {
      const {
        formingPoints,
        formingPoints: [a, b, c],
      } = vertices.get(v) as Vertex
      pointsContiguous.push(...formingPoints)
      affectedContiguities.push(contiguities.get(a, b) as Contiguity)
      if (c) {
        affectedContiguities.push(
          contiguities.get(c, b) as Contiguity,
          contiguities.get(c, a) as Contiguity
        )
      }
      if (index === arr.length - 1) {
        pointsContiguous = uniq(pointsContiguous)
        affectedContiguities = uniq(affectedContiguities)
      }
      return { pointsContiguous, affectedContiguities }
    },
    { pointsContiguous: [], affectedContiguities: [] } as {
      pointsContiguous: PointName[]
      affectedContiguities: Contiguity[]
    }
  )

  const newVertices: (Omit<Vertex, 'neighbouringVertices'> & {
    neighbouringVertices: VertexName[]
  })[] = []

  affectedContiguities.forEach((contiguity) => {
    const contiguityPoints = contiguity.points
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
        contiguities.delete(...contiguity.points)
        break
      }
    }
  })

  // 删除应该删除的vertices
  verticesNeedDelete.forEach((vertexName) => {
    vertices.delete(vertexName)
  })

  // 完善newVertices的neighbouringVertices
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
    // 上一步会导致存在两两重复, 需要去重
    // 还需要移除已删除的vertices
    newVertex.neighbouringVertices = filter(
      uniq(newVertex.neighbouringVertices),
      (vertexName) => !verticesNeedDelete.includes(vertexName)
    )
    if (
      !(
        newVertex.neighbouringVertices.length === 1 ||
        newVertex.neighbouringVertices.length === 3
      )
    ) {
      debugger
    }
    vertices.set(newVertex.name, newVertex as Vertex)
  })

  // 更新"接触"
  Array.from(vertices.entries()).forEach(
    ([vertexName, { formingPoints, neighbouringVertices }]) => {
      const isVirtualVertex = parseInt(vertexName.split(splitter)[1]) < 0
      if (isVirtualVertex) {
        // contiguities.set()
      } else {
        const [pa, pb, pc] = formingPoints.map(
          (p) => ({ ...points.get(p) } as Point)
        )
        const [va, vb, vc] = neighbouringVertices.map(
          // 这里返回新的对象, 在vertex 是无穷远时, vertices.get 会返回相同的对象, 导致each2判断错误
          (v) => ({ ...vertices.get(v) } as Vertex)
        )
        const pointPairs = groupPairs([pa, pb, pc])
        const vertexPairs = groupPairs([va, vb, vc])
        const matchedPoints = {
          [pa.name]: 0,
          [pb.name]: 0,
          [pc.name]: 0,
        }
        const matchedVertices = {
          [va.name]: 0,
          [vb.name]: 0,
          [vc.name]: 0,
        }
        each2(
          pointPairs,
          vertexPairs,
          ([pa, pb], [va, vb]) => {
            if (!vb) debugger
            // points连线和vertices连线垂直, 说明这两个points构成的"接触"就是这两个vertices连成的"接触"
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
            matchedPoints[pa.name] += 1
            matchedPoints[pb.name] += 1
            matchedVertices[va.name] += 1
            matchedVertices[vb.name] += 1
          }
        )
        // 无穷远的接触没法计算垂直, matchedPoints包含的情况之外的两点组合就对应无穷远的接触
        const [unusedPa, unusedPb] = entries(matchedPoints).reduce(
          (acc, [key, value]) => {
            if (value === 1) {
              acc.push(key)
            }
            return acc
          },
          [] as string[]
        ) as [PointName, PointName]
        const [unusedVa, unusedVb] = entries(matchedVertices).reduce(
          (acc, [key, value]) => {
            if (value === 1) {
              acc.push(key)
            }
            return acc
          },
          [] as string[]
        ) as [VertexName, VertexName]
        if (unusedPa && unusedPb) {
          contiguities.set(`${unusedPa}${splitter}${unusedPb}`, {
            deletedState: ContiguityDeletedStates.intact,
            vertices: [unusedVa, unusedVb],
          })
        }
      }
    }
  )
}

console.log(vertices)
console.log(points)

// eslint-disable-next-line no-debugger
debugger
