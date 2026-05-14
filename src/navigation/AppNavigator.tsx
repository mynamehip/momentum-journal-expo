import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context';
import { useTheme } from '../theme';
import { LoginForm as LoginScreen, RegisterForm as SignupScreen, ForgetPasswordForm as ForgotPasswordScreen } from '../screens/auth';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/Home';
import StatsScreen from '../screens/Stats';
import SocialScreen from '../screens/Social';
import SettingsScreen from '../screens/Settings';
import CreateScreen from '../screens/Create';
import EntryDetailScreen from '../screens/EntryDetail';
import GroupDetailScreen from '../screens/GroupDetail';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const AuthNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
    );
};

const MainTabNavigator = () => {
    const { colors } = useTheme();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    return (
        <>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: colors.card,
                        borderTopColor: colors.border,
                        height: 60 + insets.bottom,
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                        paddingTop: 10,
                    },
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textSecondary,
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontWeight: '500',
                    },
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName: keyof typeof Ionicons.glyphMap;

                        switch (route.name) {
                            case 'Journal':
                                iconName = focused ? 'home' : 'home-outline';
                                break;
                            case 'Stats':
                                iconName = focused ? 'pie-chart' : 'pie-chart-outline';
                                break;
                            case 'Create':
                                iconName = 'add-circle';
                                break;
                            case 'Social':
                                iconName = focused ? 'people' : 'people-outline';
                                break;
                            case 'Settings':
                                iconName = focused ? 'settings' : 'settings-outline';
                                break;
                            default:
                                iconName = 'ellipse';
                        }

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                })}
            >
                <Tab.Screen name="Journal" component={HomeScreen} />
                <Tab.Screen name="Stats" component={StatsScreen} />
                <Tab.Screen
                    name="Create"
                    component={HomeScreen}
                    options={{
                        tabBarButton: () => (
                            <TouchableOpacity
                                onPress={() => setShowCreateModal(true)}
                                style={styles.createButton}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.createButtonInner, { backgroundColor: colors.primary }]}>
                                    <Ionicons name="add" size={28} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        ),
                    }}
                />
                <Tab.Screen name="Social" component={SocialScreen} />
                <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>

            <CreateScreen
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSaved={() => setShowCreateModal(false)}
            />
        </>
    );
};

const AppNavigator: React.FC = () => {
  const { isDarkMode, colors } = useTheme();
    const { user, loading, isGuest } = useAuth();

  if (loading) {
      return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {/* You might want a better loading screen */}
          </View>
      );
  }

  const customTheme = isDarkMode
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      };

  return (
    <NavigationContainer theme={customTheme}>
                        {user || isGuest ? (
                            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                                <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
                                <RootStack.Screen name="EntryDetail" component={EntryDetailScreen} />
                                <RootStack.Screen name="GroupDetail" component={GroupDetailScreen} />
                            </RootStack.Navigator>
                        ) : (
                            <AuthNavigator />
                        )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  createButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default AppNavigator;
