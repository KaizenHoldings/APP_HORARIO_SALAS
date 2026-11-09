import type { StyleProp, ViewStyle } from 'react-native';

export interface RoomPhotoProps {
  /** `require('...jpg')` o `{ uri }`. */
  source: number | { uri: string };
  style?: StyleProp<ViewStyle>;
  /** Radio del desenfoque del halo, en px. */
  blur?: number;
}
