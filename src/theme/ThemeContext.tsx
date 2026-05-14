import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, pinkColors, darkPinkColors, aquaColors, darkAquaColors, greenColors, darkGreenColors, AppColors } from './colors';
import { STORAGE_KEYS } from '../constants';

export type ThemeType = 'default' | 'pink' | 'aqua' | 'green';

interface ThemeContextType {
  isDarkMode: boolean;
  themeType: ThemeType;
  toggleTheme: () => void;
  setThemeType: (type: ThemeType) => void;
  colors: AppColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [themeType, setThemeTypeState] = useState<ThemeType>('default');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedDark = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (savedDark !== null) {
        setIsDarkMode(savedDark === 'dark');
      }
      const savedType = await AsyncStorage.getItem('theme_type');
      if (savedType !== null) {
        setThemeTypeState(savedType as ThemeType);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, newValue ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setThemeType = async (type: ThemeType) => {
    setThemeTypeState(type);
    try {
      await AsyncStorage.setItem('theme_type', type);
    } catch (error) {
      console.error('Error saving theme type:', error);
    }
  };

  const colors = useMemo(() => {
    if (themeType === 'pink') {
      return isDarkMode ? darkPinkColors : pinkColors;
    }
    if (themeType === 'aqua') {
      return isDarkMode ? darkAquaColors : aquaColors;
    }
    if (themeType === 'green') {
      return isDarkMode ? darkGreenColors : greenColors;
    }
    return isDarkMode ? darkColors : lightColors;
  }, [isDarkMode, themeType]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeType, toggleTheme, setThemeType, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
