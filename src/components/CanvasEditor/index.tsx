import { useState, useCallback, useRef } from 'react'
import { Stage, Layer, Rect, Circle, RegularPolygon } from 'react-konva'
import type { Shape, ShapeType, Point } from '@/types/shape'
import PropertiesPanel from './PropertiesPanel'
import './CanvasEditor.css'

const CanvasEditor = () => {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType | null>(
    null
  ) // Выбранная фигура
  const [toolSettings] = useState({
    fill: '#ff0000',
    stroke: '#000000',
  })

  const stageRef = useRef<any>(null)

  // Обработчик зума
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

  // Обработчик клика на холст
  const handleClick = useCallback(
    (e: any) => {
      if (!selectedShapeType) return // Если фигура не выбрана, ничего не делаем

      const stage = e.target.getStage()
      if (!stage) return

      const pos = stage.getPointerPosition()
      if (!pos) return

      const initialSize = 50 // Начальный размер фигуры

      // Создаем фигуру в зависимости от выбранного типа
      const newShape: Shape = {
        id: Date.now().toString(),
        type: selectedShapeType,
        x: (pos.x - offset.x) / scale,
        y: (pos.y - offset.y) / scale,
        width: initialSize,
        height: initialSize,
        fill: toolSettings.fill,
        stroke: toolSettings.stroke,
        strokeWidth: 2,
      }

      // Для круга и треугольника корректируем размеры
      if (selectedShapeType === 'circle') {
        newShape.width = initialSize * 2 // Диаметр круга
        newShape.height = initialSize * 2
      } else if (selectedShapeType === 'triangle') {
        newShape.width = initialSize
        newShape.height = (initialSize * Math.sqrt(3)) / 2 // Высота треугольника
      }

      // Добавляем фигуру
      setShapes((prev) => [...prev, newShape])

      // Сбрасываем выбор фигуры
      setSelectedShapeType(null)
    },
    [selectedShapeType, scale, offset, toolSettings]
  )

  // Обработчик выбора фигуры
  const handleShapeSelection = (shapeType: ShapeType) => {
    if (selectedShapeType === shapeType) {
      // Если выбрана та же фигура, сбрасываем выбор
      setSelectedShapeType(null)
    } else {
      // Иначе выбираем новую фигуру
      setSelectedShapeType(shapeType)
    }
  }

  // Обработчик обновления фигуры
  const handleUpdateShape = (updated: Shape) => {
    setShapes((prev) =>
      prev.map((shape) => (shape.id === updated.id ? updated : shape))
    )
  }

  // Обработчик перетаскивания фигуры
  const handleDragEnd = useCallback((id: string, pos: Point) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id ? { ...shape, x: pos.x, y: pos.y } : shape
      )
    )
  }, [])

  return (
    <div className='canvas-editor'>
      {/* Панель инструментов */}
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

      {/* Холст */}
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleWheel}
        onClick={handleClick}
        scale={{ x: scale, y: scale }}
        offset={offset}
        draggable={!selectedShapeType} // Перетаскивание только если фигура не выбрана
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
        </Layer>
      </Stage>

      {/* Панель свойств */}
      {selectedId && (
        <PropertiesPanel
          shape={shapes.find((s) => s.id === selectedId)}
          onUpdate={handleUpdateShape}
        />
      )}
    </div>
  )
}

// Компонент фигуры (без изменений)
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
