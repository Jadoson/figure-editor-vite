import { useState, useEffect } from 'react'
import type { Shape, ShapeType } from '@/types/shape'

const PropertiesPanel = ({
  shape,
  onUpdate,
}: {
  shape?: Shape | null
  onUpdate: (s: Shape) => void
}) => {
  const [formValues, setFormValues] = useState<Shape | null>(null)

  useEffect(() => {
    if (shape) {
      setFormValues(shape)
    }
  }, [shape])

  if (!shape || !formValues) return null

  const handleChange = (field: keyof Shape, value: string | number) => {
    setFormValues((prev) => ({
      ...prev!,
      [field]: value,
    }))
  }

  return (
    <div className='properties-panel'>
      <label>
        Type:
        <select
          value={formValues.type}
          onChange={(e) => handleChange('type', e.target.value as ShapeType)}
        >
          <option value='rect'>Rectangle</option>
          <option value='circle'>Circle</option>
          <option value='triangle'>Triangle</option>
        </select>
      </label>

      <label>
        Width:
        <input
          type='number'
          value={formValues.width}
          onChange={(e) => handleChange('width', Number(e.target.value))}
        />
      </label>

      <label>
        Height:
        <input
          type='number'
          value={formValues.height}
          onChange={(e) => handleChange('height', Number(e.target.value))}
        />
      </label>

      <label>
        Fill:
        <input
          type='color'
          value={formValues.fill}
          onChange={(e) => handleChange('fill', e.target.value)}
        />
      </label>

      <label>
        Stroke:
        <input
          type='color'
          value={formValues.stroke}
          onChange={(e) => handleChange('stroke', e.target.value)}
        />
      </label>

      <button onClick={() => onUpdate(formValues)}>Apply Changes</button>
    </div>
  )
}

export default PropertiesPanel
