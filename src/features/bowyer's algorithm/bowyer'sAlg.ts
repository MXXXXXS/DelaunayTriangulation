import { Circum, circum } from '~/utils/circum'
import {
  Coord,
  createRandomPoints,
  getRandomPointName,
  Range,
} from '~/utils/pointUtils'
import { surroundingTriangle } from '~/utils/surroundingTriangle'

// 准备好存储结构
export type PointName = `p${number}`
export type VertexName = `v${number}`

const points = new Map<PointName, Coord>()

const vertices = new Map<VertexName, Circum>()

const formingPointsMap = new Map<
  VertexName,
  [PointName, PointName, PointName]
>()

const neighbouringVerticesMap = new Map<
  VertexName,
  [VertexName, VertexName, VertexName]
>()

// 准备一些散点
const totalPointCounts = 20
const domainX: Range = [0, 100]
const domainY: Range = [0, 100]

const pointCoords = createRandomPoints(totalPointCounts, [domainX, domainY])

pointCoords.forEach((coord, index) => {
  points.set(`p${index}`, coord)
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

vertices.set('v0', circum(...initialThreePoints))

// 开始插入点

const pq = getRandomPointName(totalPointCounts)
