import { useState } from 'react';
import './EstimationPicker.css';

const ESTIMATION_SIZES = {
  XS: { label: 'XS - Muy pequeña', hours: 1, description: 'Cambio trivial o corrección menor' },
  S: { label: 'S - Pequeña', hours: 2, description: 'Tarea simple, 1-2 horas' },
  M: { label: 'M - Mediana', hours: 8, description: 'Tarea estándar, jornada completa' },
  L: { label: 'L - Grande', hours: 16, description: 'Tarea compleja, 2 días' },
  XL: { label: 'XL - Muy grande', hours: 40, description: 'Feature completa, 1 semana' }
};

function EstimationPicker({ value = 'M', onChange, required = false }) {
  const [selectedSize, setSelectedSize] = useState(value);

  const handleSelect = (size) => {
    setSelectedSize(size);
    if (onChange) {
      onChange(size, ESTIMATION_SIZES[size].hours);
    }
  };

  return (
    <div className="estimation-picker">
      <label className="estimation-label">
        Estimación de esfuerzo {required && <span className="required">*</span>}
      </label>
      
      <div className="estimation-sizes">
        {Object.entries(ESTIMATION_SIZES).map(([size, data]) => (
          <div
            key={size}
            className={`estimation-size ${selectedSize === size ? 'selected' : ''}`}
            onClick={() => handleSelect(size)}
          >
            <div className="size-badge">{size}</div>
            <div className="size-info">
              <div className="size-hours">{data.hours}h</div>
              <div className="size-description">{data.description}</div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedSize && (
        <div className="estimation-summary">
          Esta tarea tomará aproximadamente <strong>{ESTIMATION_SIZES[selectedSize].hours} horas</strong>
        </div>
      )}
    </div>
  );
}

export default EstimationPicker;
