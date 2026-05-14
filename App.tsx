import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import { AuthProvider } from './src/context';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts } from 'expo-font';

const AppContent: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [loaded, error] = useFonts({
    'Mynerve': require('./assets/fonts/Mynerve-Regular.ttf'),
    'Mansalva': require('./assets/fonts/Mansalva-Regular.ttf')
  });

  React.useEffect(() => {
    if (error) console.error('Font loading error:', error);
  }, [error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
