import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppState } from './src/store/AppContext';
import { useT } from './src/i18n/useT';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreenWrapper from './src/screens/HomeScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ReassessScreen from './src/screens/ReassessScreen';
import ErrorBoundary from './src/components/ErrorBoundary';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeScreen({ navigation }: any) {
  return (
    <HomeScreenWrapper
      onNavigateToFeedback={() => navigation.navigate('Feedback')}
    />
  );
}

function Reassess({ navigation }: any) {
  return <ReassessScreen onDone={() => navigation.goBack()} />;
}

function SettingsTab({ navigation }: any) {
  return <SettingsScreen onReassess={() => navigation.navigate('Reassess')} />;
}

function MainTabs() {
  const t = useT();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f0f0f0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t.tabs.home }}
      />
      <Tab.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{ tabBarLabel: t.tabs.feedback }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsTab}
        options={{ tabBarLabel: t.tabs.settings }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { onboardingDone, loading } = useAppState();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboardingDone ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Reassess"
            component={Reassess}
            options={{ presentation: 'modal' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      {/* 放在 AppProvider 外层：连语言加载都出错时也要有东西兜住 */}
      <ErrorBoundary>
        <AppProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8fc',
  },
});
