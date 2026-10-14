import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_ROOM_KEY = '@salas_tablet_configured_room';
const STORAGE_THEME_KEY = '@salas_tablet_theme_preference';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ConfiguredRoom {
  nombre: string;
  email: string;
}

export async function getConfiguredRoom(): Promise<ConfiguredRoom | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_ROOM_KEY);
    if (!json) return null;
    return JSON.parse(json) as ConfiguredRoom;
  } catch (error) {
    console.warn('Error reading configured room from storage:', error);
    return null;
  }
}

export async function saveConfiguredRoom(room: ConfiguredRoom): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_ROOM_KEY, JSON.stringify(room));
  } catch (error) {
    console.error('Error saving configured room to storage:', error);
  }
}

export async function clearConfiguredRoom(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_ROOM_KEY);
  } catch (error) {
    console.error('Error clearing configured room from storage:', error);
  }
}

export async function getThemePreference(): Promise<ThemePreference> {
  try {
    const pref = await AsyncStorage.getItem(STORAGE_THEME_KEY);
    if (pref === 'light' || pref === 'dark') {
      return pref as ThemePreference;
    }
    return 'system';
  } catch (error) {
    return 'system';
  }
}

export async function saveThemePreference(theme: ThemePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_THEME_KEY, theme);
  } catch (error) {
    console.error('Error saving theme to storage:', error);
  }
}
