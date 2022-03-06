import * as d3 from 'd3'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import styled from 'styled-components'

import { Rest } from '~/app'
import { Coord, Point, Vertex } from '~/utils/pointUtils'

import { points as pointsMap } from '../bowyersAlgorithm/bowyersAlgorithm'
import { canvasStates } from './states/canvasStates'

function plot({
  vertices,
  points,
  width = 200,
  height = 200,
}: {
  vertices: Vertex[]
  points: Point[]
  width?: number
  height?: number
}) {
  const svg = d3.create('svg').attr('viewBox', [0, 0, 200, 200])

  const scaleX = d3.scaleLinear().domain([0, 200]).range([0, width])
  const scaleY = d3.scaleLinear().domain([0, 200]).range([0, height])

  const g1 = svg.append('g')

  const g2 = svg.append('g')

  g1.selectAll('circle')
    .data(points)
    .join('circle')
    .attr('cx', (d: Point) => scaleX(d.coord[0]))
    .attr('cy', (d: Point) => scaleY(d.coord[1]))
    .attr('r', 2)
    .style('fill', 'red')

  g2.selectAll('circle')
    .data(vertices)
    .join('circle')
    .attr('cx', (d: Vertex) => scaleX(d.center[0]))
    .attr('cy', (d: Vertex) => scaleY(d.center[1]))
    .attr('r', 2)
    .style('fill', 'gray')

  vertices.forEach((vertex) => {
    const g3 = svg.append('g')
    const points = vertex.formingPoints.map(
      (p) => pointsMap.get(p)?.coord as Coord
    )
    points.push(points[0])
    g3.append('path')
      .attr('stroke-width', 1)
      .attr('stroke', 'orangered')
      .attr('fill', 'none')
      .attr(
        'd',
        d3
          .line()
          .x((d) => scaleX(d[0]))
          .y((d) => scaleY(d[1]))(points)
      )
  })

  return svg
}

const CanvasContainer = styled.div`
  margin: 10px;
  border: 1px solid orangered;
  width: 200px;
  height: 200px;
`

export const Canvas = observer(({ ...rest }: Rest) => {
  const canvasElRef = useRef<HTMLDivElement>(null)
  const vertices = Array.from(
    canvasStates.vertices.values()
  ) as unknown as Vertex[]
  const points = Array.from(canvasStates.points.values()) as unknown as Point[]
  useEffect(() => {
    const node = plot({ vertices, points }).node()
    const canvasEl = canvasElRef.current
    if (canvasEl && node) {
      canvasEl.innerHTML = ''
      canvasEl.append(node)
    }
  }, [vertices, points])
  return <CanvasContainer {...rest} ref={canvasElRef}></CanvasContainer>
})
