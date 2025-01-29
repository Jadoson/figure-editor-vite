import { useState, useCallback } from 'react'
import { Point, Shape } from '../types/shape'

export const useCanvasHandlers = () => {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })

  const handleWheel = useCallback((e: any) => {}, [scale, offset])

  return {
    scale,
    offset,
    handleWheel,
  }
}
