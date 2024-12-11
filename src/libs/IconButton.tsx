import React, { SVGProps } from 'react';
import { IconType } from 'react-icons';

import "../css/icons.css";

interface IconButtonProps {
  icon: IconType | string | React.ReactElement;
  onClick: () => void;
  size?: number;
  backgroundColor?: string;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  size = 24,
  backgroundColor = '',
  color = 'white',
  style,
  className = ''
}) => {
  const buttonStyle: React.CSSProperties = {
    backgroundColor,
    ...style,
  };

  const renderIcon = () => {
    if (typeof icon === 'string') {
      // Если иконка передана как URL строки (например, путь к изображению)
      return <img src={icon} alt="Icon" style={{ width: `${size}px`, height: `${size}px` }} />;
    } else if (React.isValidElement(icon)) {
      // Если иконка это React-элемент, например, SVG-иконка
      return React.cloneElement(icon, { 
        width: size, 
        height: size, 
        fill: color 
      } as SVGProps<SVGSVGElement>);
    } else if (typeof icon === 'function') {
      // Если это компонент иконки, например, из `react-icons`
      const IconComponent = icon as IconType;
      return <IconComponent size={size} color={color} />;
    } else {
      throw new Error('Invalid icon type');
    }
  };

  return (
    <button
      onClick={onClick}
      className={`icon-button ${className}`}
      style={buttonStyle}
    >
      {renderIcon()}
    </button>
  );
};

export default IconButton;
