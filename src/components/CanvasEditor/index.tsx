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
  const [stagePosition, setStagePosition] = useState<Point>({ x: 0, y: 0 })
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
  const [isDraggingShape, setIsDraggingShape] = useState(false)

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
      const mousePointTo = {
        x: (pointer.x - stagePosition.x) / oldScale,
        y: (pointer.y - stagePosition.y) / oldScale,
      }
      setStagePosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      })
      setScale(newScale)
    },
    [scale, stagePosition]
  )
  const handleShapeSelection = (shapeType: ShapeType) => {
    setSelectedShapeType((prev) => (prev === shapeType ? null : shapeType))
  }

  const handleMouseDown = useCallback(
    (e: any) => {
      if (!selectedShapeType) return
      const stage = e.target.getStage()
      if (!stage || e.target !== stage) return
      const absolutePos = stage.getRelativePointerPosition()
      setIsDrawing(true)
      setDrawingShape({
        id: 'temp-' + uuidv4(),
        type: selectedShapeType,
        x: absolutePos.x,
        y: absolutePos.y,
        width: 0,
        height: 0,
        fill: toolSettings.fill,
        stroke: toolSettings.stroke,
        strokeWidth: 2,
      })
    },
    [selectedShapeType, toolSettings]
  )

  const handleMouseMove = useCallback(
    (e: any) => {
      if (!isDrawing || !drawingShape) return
      const stage = e.target.getStage()
      if (!stage) return
      const absolutePos = stage.getRelativePointerPosition()
      const newWidth = absolutePos.x - drawingShape.x
      const newHeight = absolutePos.y - drawingShape.y

      const minWidth = 1
      const minHeight = 1

      setDrawingShape({
        ...drawingShape,
        width: Math.max(newWidth, minWidth),
        height: Math.max(newHeight, minHeight),
      })
    },
    [isDrawing, drawingShape]
  )
  const handleMouseUp = useCallback(() => {
    if (isDrawing && drawingShape) {
      const minWidth = 1
      const minHeight = 1

      const finalWidth = Math.abs(drawingShape.width)
      const finalHeight = Math.abs(drawingShape.height)

      if (finalWidth >= minWidth && finalHeight >= minHeight) {
        setShapes((prev) => [
          ...prev,
          {
            ...drawingShape,
            id: uuidv4(),
            width: finalWidth,
            height: finalHeight,
            x:
              drawingShape.width > 0
                ? drawingShape.x
                : drawingShape.x + drawingShape.width,
            y:
              drawingShape.height > 0
                ? drawingShape.y
                : drawingShape.y + drawingShape.height,
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

  const handleDragEnd = useCallback((id: string, newPos: Point) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id ? { ...shape, x: newPos.x, y: newPos.y } : shape
      )
    )
    setIsDraggingShape(false)
  }, [])

  const handleDragStart = useCallback(() => {
    setIsDraggingShape(true)
  }, [])

  const handleStageDragMove = useCallback(
    (e: any) => {
      if (!isDraggingShape) {
        setStagePosition({
          x: e.target.x(),
          y: e.target.y(),
        })
      }
    },
    [isDraggingShape]
  )

  const handleStageClick = useCallback(
    (e: any) => {
      const target = e.target
      const clickedOnShape = shapes.some((shape) => {
        const shapeNode = target.findOne(`#${shape.id}`)
        return shapeNode !== undefined
      })

      if (!clickedOnShape) {
        setSelectedId(null)
      }
    },
    [shapes]
  )

  return (
    <div className='canvas-editor'>
      <div className='toolbar'>
        <button
          onClick={() => handleShapeSelection('rect')}
          className={selectedShapeType === 'rect' ? 'active' : ''}
        >
          □
        </button>
        <button
          onClick={() => handleShapeSelection('circle')}
          className={selectedShapeType === 'circle' ? 'active' : ''}
        >
          ○
        </button>
        <button
          onClick={() => handleShapeSelection('triangle')}
          className={selectedShapeType === 'triangle' ? 'active' : ''}
        >
          △
        </button>
      </div>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        scale={{ x: scale, y: scale }}
        x={stagePosition.x}
        y={stagePosition.y}
        draggable={!selectedShapeType}
        onDragMove={handleStageDragMove}
      >
        <Layer>
          {shapes.map((shape) => (
            <ShapeComponent
              key={shape.id}
              shape={shape}
              isSelected={shape.id === selectedId}
              onSelect={() => setSelectedId(shape.id)}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
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
  onDragStart,
}: {
  shape: Shape
  isSelected: boolean
  onSelect?: () => void
  onDragEnd?: (pos: Point) => void
  onDragStart?: () => void
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
    onDragStart: () => {
      if (onDragStart) {
        onDragStart()
      }
    },
  }

  switch (shape.type) {
    case 'rect':
      return (
        <Rect
          {...commonProps}
          width={Math.max(shape.width, 1)}
          height={Math.max(shape.height, 1)}
        />
      )
    case 'circle':
      return <Circle {...commonProps} radius={Math.max(shape.width / 2, 0.5)} />
    case 'triangle':
      return (
        <RegularPolygon
          {...commonProps}
          sides={3}
          radius={Math.max(Math.max(shape.width, shape.height) / 2, 0.5)}
        />
      )
    default:
      return null
  }
}

export default CanvasEditor
