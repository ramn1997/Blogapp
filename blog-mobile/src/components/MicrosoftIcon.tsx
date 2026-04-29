import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MicrosoftIconProps {
  size?: number;
}

const MicrosoftIcon = ({ size = 24 }: MicrosoftIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21">
      <Path fill="#f25022" d="M1 1h9v9H1z" />
      <Path fill="#00a4ef" d="M1 11h9v9H1z" />
      <Path fill="#7fba00" d="M11 1h9v9h-9z" />
      <Path fill="#ffb900" d="M11 11h9v9h-9z" />
    </Svg>
  );
};

export default MicrosoftIcon;
