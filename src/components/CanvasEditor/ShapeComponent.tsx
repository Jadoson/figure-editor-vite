import { Rect, Circle, RegularPolygon } from 'react-konva'
import { Shape } from '../../types/shape'

const ShapeComponent = ({
  shape,
  onClick,
  onDragEnd,
}: {
  shape: Shape
  isSelected: boolean
  onClick?: () => void
  onDragEnd?: (pos: Point) => void
}) => {
  const commonProps = {
    x: shape.x,
    y: shape.y,
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: 2,
    draggable: true,
    onClick,
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

export default ShapeComponent
