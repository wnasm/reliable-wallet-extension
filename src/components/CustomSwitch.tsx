import React from 'react';
import { Switch } from 'antd';
import type { SwitchProps } from 'antd';

interface CustomSwitchProps extends SwitchProps {
  activeColor?: string;
  inactiveColor?: string;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ 
  activeColor = 'pink',
  inactiveColor = 'rgba(255, 255, 255, 0.2)',
  checked,
  ...props 
}) => {
  return (
    <Switch
      {...props}
      checked={checked}
      style={{
        backgroundColor: checked ? activeColor : inactiveColor,
      }}
      className="custom-switch"
    />
  );
};

export default CustomSwitch; 