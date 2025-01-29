import { useState, useCallback, useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Circle, RegularPolygon } from 'react-konva'
import type { Shape, ShapeType, Point } from '@/types/shape'
import PropertiesPanel from './PropertiesPanel'
import './CanvasEditor.css'

const CanvasEditor = () => {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [drawingShape, setDrawingShape] = useState<Shape | null>(null)
  // const [shapeType, setShapeType] = useState<ShapeType>('rect')
  // const [fillColor, setFillColor] = useState('#ff0000')
  // const [strokeColor, setStrokeColor] = useState('#000000')
  const [isDrawing, setIsDrawing] = useState(false)
  const [toolSettings] = useState({
    type: 'rect' as ShapeType,
    fill: '#ff0000',
    stroke: '#000000',
  })

  const stageRef = useRef<any>(null)

  const defaultShape: Partial<Shape> = {
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2,
    width: 50,
    height: 50,
  }

  const handleWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault()
      const scaleBy = 1.1
      const stage = stageRef.current
      if (!stage) return

      const oldScale = scale
      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const newScale =
        e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

      setOffset({
        x: pointer.x - (pointer.x - offset.x) * (newScale / oldScale),
        y: pointer.y - (pointer.y - offset.y) * (newScale / oldScale),
      })
      setScale(newScale)
    },
    [scale, offset]
  )

  const handleMouseDown = useCallback(
    (e: any) => {
      const stage = e.target.getStage()
      if (!stage || e.target !== stage) return

      const pos = stage.getPointerPosition()
      if (!pos) return

      setIsDrawing(true)

      setDrawingShape({
        id: 'temp-' + Date.now(),
        type: toolSettings.type,
        x: (pos.x - offset.x) / scale,
        y: (pos.y - offset.y) / scale,
        width: 0,
        height: 0,
        fill: toolSettings.fill,
        stroke: toolSettings.stroke,
        strokeWidth: 2,
      })
    },
    [scale, offset, toolSettings]
  )

  const handleMouseMove = useCallback(
    (e: any) => {
      if (!isDrawing || !drawingShape) return

      const stage = e.target.getStage()
      if (!stage) return

      const pos = stage.getPointerPosition()
      if (!pos) return

      const newWidth = (pos.x - offset.x) / scale - drawingShape.x
      const newHeight = (pos.y - offset.y) / scale - drawingShape.y

      setDrawingShape({
        ...drawingShape,
        width: Math.max(newWidth, 5),
        height: Math.max(newHeight, 5),
      })
    },
    [isDrawing, drawingShape, scale, offset]
  )
  const handleMouseUp = useCallback(() => {
    if (isDrawing && drawingShape) {
      if (drawingShape.width > 0 && drawingShape.height > 0) {
        setShapes((prev) => [
          ...prev,
          {
            ...drawingShape,
            id: Date.now().toString(),
          },
        ])
      }
      setDrawingShape(null)
      setIsDrawing(false)
    }
  }, [isDrawing, drawingShape])

  const handleUpdateShape = (updated: Shape) => {
    setShapes((prev) =>
      prev.map((shape) => (shape.id === updated.id ? updated : shape))
    )
  }

  const handleDragEnd = useCallback((id: string, pos: Point) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id ? { ...shape, x: pos.x, y: pos.y } : shape
      )
    )
  }, [])

  const handleClick = useCallback(
    (e: any) => {
      const initialSize = 50
      const stage = e.target.getStage()
      if (!stage) return

      const pos = stage.getPointerPosition()
      if (!pos) return

      const x = (pos.x - offset.x) / scale
      const y = (pos.y - offset.y) / scale

      setShapes((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: toolSettings.type,
          x: (pos.x - offset.x) / scale,
          y: (pos.y - offset.y) / scale,
          width: initialSize,
          height: initialSize,
          fill: toolSettings.fill,
          stroke: toolSettings.stroke,
          strokeWidth: 2,
        },
      ])
    },
    [scale, offset, toolSettings]
  )

  return (
    <div className='canvas-editor'>
      <div className='toolbar'>
        <select
          value={toolSettings.type}
          onChange={(e) => (toolSettings.type = e.target.value as ShapeType)}
        >
          <option value='rect'>Rectangle</option>
          <option value='circle'>Circle</option>
          <option value='triangle'>Triangle</option>
        </select>
        <input
          type='color'
          value={toolSettings.fill}
          onChange={(e) => (toolSettings.fill = e.target.value)}
        />
        <input
          type='color'
          value={toolSettings.stroke}
          onChange={(e) => (toolSettings.stroke = e.target.value)}
        />
      </div>

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleWheel}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        scale={{ x: scale, y: scale }}
        offset={offset}
        draggable
      >
        <Layer>
          {shapes.map((shape) => (
            <ShapeComponent
              key={shape.id}
              shape={shape}
              isSelected={shape.id === selectedId}
              onSelect={() => setSelectedId(shape.id)}
              onDragEnd={handleDragEnd}
            />
          ))}

          {isDrawing && drawingShape && (
            <ShapeComponent shape={drawingShape} isSelected={false} />
          )}
        </Layer>
      </Stage>

      {selectedId && (
        <PropertiesPanel
          shape={shapes.find((s) => s.id === selectedId)}
          onUpdate={handleUpdateShape}
        />
      )}
    </div>
  )
}

const ShapeComponent = ({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
}: {
  shape: Shape
  isSelected: boolean
  onSelect?: () => void
  onDragEnd?: (pos: Point) => void
}) => {
  const commonProps = {
    x: shape.x,
    y: shape.y,
    fill: shape.fill,
    stroke: isSelected ? '#00ff00' : shape.stroke,
    strokeWidth: shape.strokeWidth,
    draggable: true,
    onClick: onSelect,
    onDragEnd: (e: any) => {
      if (onDragEnd) {
        onDragEnd({
          x: e.target.x(),
          y: e.target.y(),
        })
      }
    },
  }

  switch (shape.type) {
    case 'rect':
      return <Rect {...commonProps} width={shape.width} height={shape.height} />
    case 'circle':
      return <Circle {...commonProps} radius={shape.width / 2} />
    case 'triangle':
      return (
        <RegularPolygon
          {...commonProps}
          sides={3}
          radius={Math.max(shape.width, shape.height) / 2}
        />
      )
    default:
      return null
  }
}

export default CanvasEditor
