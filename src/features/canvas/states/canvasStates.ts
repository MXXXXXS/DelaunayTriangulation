import { types } from 'mobx-state-tree'

import { Point, Vertex } from '~/utils/pointUtils'

const PointModel = types.model({
  name: types.string,
  coord: types.array(types.number),
})

const VertexModel = types.model({
  name: types.string,
  formingPoints: types.array(types.string),
  neighbouringVertices: types.array(types.string),
  center: types.array(types.number),
  r2: types.number,
})

const CanvasModel = types
  .model({
    points: types.map(PointModel),
    vertices: types.map(VertexModel),
  })
  .actions((self) => ({
    setPoints(points: Map<string, Point>) {
      self.points.replace(mapToObj(points))
    },
    setVertex(vertices: Map<string, Vertex>) {
      self.vertices.replace(mapToObj(vertices))
    },
  }))

function mapToObj<K extends string, V>(map: Map<K, V>) {
  const obj = {} as Record<K, V>
  for (const [key, value] of map) {
    obj[key] = value
  }
  return obj
}

export const canvasStates = CanvasModel.create({
  points: {},
  vertices: {},
})
import { injectStores } from '@mobx-devtools/tools'

export const rootStates = {
  canvasStates,
} as const

injectStores(rootStates)
