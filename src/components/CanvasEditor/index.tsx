import { useState, useCallback, useRef } from 'react'
import { Stage, Layer, Rect, Circle, RegularPolygon } from 'react-konva'
import { v4 as uuidv4 } from 'uuid'
import type { Shape, ShapeType, Point } from '@/types/shape'
import PropertiesPanel from './PropertiesPanel'
import './CanvasEditor.css'

const CanvasEditor = () => {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingShape, setDrawingShape] = useState<Shape | null>(null)
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType | null>(
    null
  )
  const [toolSettings] = useState({
    fill: '#ff0000',
    stroke: '#000000',
  })

  const stageRef = useRef<any>(null)

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

  const handleClick = useCallback(
    (e: any) => {
      if (!selectedShapeType) return

      const stage = e.target.getStage()
      if (!stage) return

      const pos = stage.getPointerPosition()
      if (!pos) return

      const initialSize = 50

      const newShape: Shape = {
        id: uuidv4(),
        type: selectedShapeType,
        x: (pos.x - offset.x) / scale,
        y: (pos.y - offset.y) / scale,
        width: initialSize,
        height: initialSize,
        fill: toolSettings.fill,
        stroke: toolSettings.stroke,
        strokeWidth: 2,
      }

      if (selectedShapeType === 'circle') {
        newShape.width = initialSize * 2
        newShape.height = initialSize * 2
      } else if (selectedShapeType === 'triangle') {
        newShape.width = initialSize
        newShape.height = (initialSize * Math.sqrt(3)) / 2
      }

      setShapes((prev) => [...prev, newShape])

      setSelectedShapeType(null)
    },
    [selectedShapeType, scale, offset, toolSettings]
  )

  const handleShapeSelection = (shapeType: ShapeType) => {
    if (selectedShapeType === shapeType) {
      setSelectedShapeType(null)
    } else {
      setSelectedShapeType(shapeType)
    }
  }

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

  const handleMouseDown = useCallback(
    (e: any) => {
      if (!selectedShapeType) return
      const stage = e.target.getStage()
      if (!stage || e.target !== stage) return

      const pos = stage.getPointerPosition()
      if (!pos) return

      setIsDrawing(true)

      setDrawingShape({
        id: 'temp-' + Date.now(),
        type: selectedShapeType,
        x: (pos.x - offset.x) / scale,
        y: (pos.y - offset.y) / scale,
        width: 0,
        height: 0,
        fill: toolSettings.fill,
        stroke: toolSettings.stroke,
        strokeWidth: 2,
      })
    },
    [selectedShapeType, scale, offset, toolSettings]
  )

  const handleMouseMove = useCallback(
    (e: any) => {
      if (!isDrawing || !drawingShape) return

      const stage = e.target.getStage()
      if (!stage) return

      const pos = stage.getPointerPosition()
      if (!pos) return
      const currentX = (pos.x - offset.x) / scale
      const currentY = (pos.y - offset.y) / scale

      const newWidth = currentX - drawingShape.x
      const newHeight = currentY - drawingShape.y

      setDrawingShape({
        ...drawingShape,
        width: newWidth,
        height: newHeight,
      })
    },
    [isDrawing, drawingShape, scale, offset]
  )

  const handleMouseUp = useCallback(() => {
    if (isDrawing && drawingShape) {
      if (
        Math.abs(drawingShape.width) > 5 &&
        Math.abs(drawingShape.height) > 5
      ) {
        setShapes((prev) => [
          ...prev,
          {
            ...drawingShape,
            id: Date.now().toString(),
            x:
              drawingShape.width > 0
                ? drawingShape.x
                : drawingShape.x + drawingShape.width,
            y:
              drawingShape.height > 0
                ? drawingShape.y
                : drawingShape.y + drawingShape.height,
            width: Math.abs(drawingShape.width),
            height: Math.abs(drawingShape.height),
          },
        ])
      }
      setDrawingShape(null)
      setIsDrawing(false)
    }
  }, [isDrawing, drawingShape])

  return (
    <div className='canvas-editor'>
      <div className='toolbar'>
        <button
          onClick={() => handleShapeSelection('rect')}
          className={selectedShapeType === 'rect' ? 'active' : ''}
        >
          Rectangle
        </button>
        <button
          onClick={() => handleShapeSelection('circle')}
          className={selectedShapeType === 'circle' ? 'active' : ''}
        >
          Circle
        </button>
        <button
          onClick={() => handleShapeSelection('triangle')}
          className={selectedShapeType === 'triangle' ? 'active' : ''}
        >
          Triangle
        </button>
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
        draggable={!selectedShapeType}
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
