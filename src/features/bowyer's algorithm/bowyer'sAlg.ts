import { circumcenter } from '~/utils/circumcenter'
import { createRandomPoints } from '~/utils/createRandomPoints'
import { Coord } from '~/utils/createRandomPoints'

// 准备好存储结构
type PointName = `p${number}`
type VertexName = `v${number}`

const points = new Map<PointName, Coord>()

const vertices = new Map<VertexName, Coord>()

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

const pointCoords = createRandomPoints(totalPointCounts, [
  [0, 100],
  [0, 100],
])

pointCoords.forEach((coord, index) => {
  points.set(`p${index}`, coord)
})

// 准备第一张Voronoi diagram
function getRandomPointName(): PointName {
  return `p${Math.round(Math.random() * totalPointCounts)}`
}

const initialThreePoints: [PointName, PointName, PointName] = [
  getRandomPointName(),
  getRandomPointName(),
  getRandomPointName(),
]

const v1Coord = circumcenter(
  ...(initialThreePoints.map((pointName) => points.get(pointName) as Coord) as [
    Coord,
    Coord,
    Coord
  ])
)

vertices.set('v1', v1Coord)

// TODO 开始逐个插入点来构建Voronoi diagram
