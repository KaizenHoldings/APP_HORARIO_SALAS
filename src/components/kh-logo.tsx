import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function KhLogo({ width = 40, height = 40, isDark = false }: { width?: number; height?: number; isDark?: boolean }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 206.55 222.82">
      <Path
        d="M1487.47,748.16l0-.08h-50.23a120.75,120.75,0,0,1-71.73,78.6,180.49,180.49,0,0,1,56.21,24.73,170.24,170.24,0,0,0,65.74-103.25"
        transform="translate(-1280.94 -748.08)"
        fill="#a9c1d3"
      />
      <Path
        d="M1409.77,859.49a165.65,165.65,0,0,0-82.57-24.65V748.45h-46.26V970.89h46.26V884.32c50.84,1.88,95.62,36.9,110.06,86.58h50.23l0-.08a170.28,170.28,0,0,0-77.7-111.33"
        transform="translate(-1280.94 -748.08)"
        fill={isDark ? "#FFFFFF" : "#003144"}
      />
    </Svg>
  );
}
