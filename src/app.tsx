import './features/bowyersAlgorithm/bowyersAlgorithm'

import { cloneDeep } from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import { HTMLAttributes } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'

import { getNextDiagram } from './features/bowyersAlgorithm/bowyersAlgorithm'
import { Canvas } from './features/canvas/Canvas'
import { canvasStates } from './features/canvas/states/canvasStates'
export type Rest = HTMLAttributes<HTMLDivElement>

const AppContainer = styled.div`
  border: 1px solid aquamarine;
  padding: 10px;
  display: grid;
  height: 300px;
  grid-template-areas:
    'operations lists'
    'canvas lists';
`

export const ListContainer = styled.div`
  width: max-content;
  max-height: 300px;
  overflow: auto;
`

export const List = ({ list }: { list: { id: string; text: string }[] }) => {
  return (
    <ListContainer>
      {list.map((listItem) => {
        return <div key={listItem.id}>{listItem.text}</div>
      })}
    </ListContainer>
  )
}

const App = observer(function App() {
  const points = Array.from(canvasStates.points.values()).map((point) => {
    const text =
      point.name + ': ' + point.coord.map((coord) => Math.round(coord)).join()
    return {
      id: point.name,
      text,
    }
  })
  const vertices = Array.from(canvasStates.vertices.values()).map((vertex) => {
    const text =
      vertex.name +
      ': ' +
      vertex.center.map((coord) => Math.round(coord)).join()
    return {
      id: vertex.name,
      text,
    }
  })
  return (
    <AppContainer>
      <div
        style={{
          gridArea: 'operations',
          border: '1px solid rgb(149,180,54)',
        }}
        onClick={() => {
          const { points, vertices } = getNextDiagram()
          canvasStates.setPoints(cloneDeep(points))
          canvasStates.setVertex(cloneDeep(vertices))
        }}
      >
        添加点
      </div>
      <div
        className="list"
        style={{
          gridArea: 'lists',
          display: 'flex',
          justifyContent: 'space-around',
        }}
      >
        <List list={points}></List>
        <List list={vertices}></List>
      </div>
      <Canvas
        style={{
          gridArea: 'canvas',
        }}
      ></Canvas>
    </AppContainer>
  )
})

ReactDOM.render(<App></App>, document.body.querySelector('#root'))
