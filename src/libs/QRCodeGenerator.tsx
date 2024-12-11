import React, { useState, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';

interface AdvancedQRCodeProps {
  value: string;
  logoUrl?: string;
  logoPaddingStyle?: 'square' | 'circle';
  size?: number;
  bgColor?: string;
  fgColor?: string;
  qrStyle?: 'squares' | 'dots' | 'fluid';
  eyeRadius?: number | [number, number, number, number];
  eyeColor?: string;
  style?: React.CSSProperties;
}

const AdvancedQRCode: React.FC<AdvancedQRCodeProps> = ({
  value,
  logoUrl,
  logoPaddingStyle,
  size = 250,
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  qrStyle = 'squares',
  eyeRadius,
  eyeColor,
  style
}) => {
  const [logo, setLogo] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (logoUrl) {
      fetch(logoUrl)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = () => setLogo(reader.result as string);
          reader.readAsDataURL(blob);
        })
        .catch(error => {
          console.error('Error loading logo:', error);
          setLogo(undefined);
        });
    }
  }, [logoUrl]);




  return (
      <QRCode
        value={value}
        ecLevel='M'
        size={size}
        quietZone={20}
        bgColor={bgColor}
        fgColor={fgColor}
        logoImage={logo}
        removeQrCodeBehindLogo={false}
        logoWidth={size * .2}
        logoHeight={size * .2}
        logoOpacity={1}
        logoPadding={8}
        logoPaddingStyle={logoPaddingStyle}
        qrStyle={qrStyle}
        eyeRadius={eyeRadius}
        eyeColor={eyeColor}
        enableCORS={true}
        style={style}
      />
  );
};

export default AdvancedQRCode;