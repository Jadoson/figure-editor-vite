export type ShapeType = 'rect' | 'circle' | 'triangle'

export interface Point {
  x: number
  y: number
}

export interface Shape {
  id: string
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
}

export interface PositionUpdate {
  id: string
  x: number
  y: number
}
