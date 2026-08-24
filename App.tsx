import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppState } from './src/store/AppContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreenWrapper from './src/screens/HomeScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ReassessScreen from './src/screens/ReassessScreen';

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
        options={{ tabBarLabel: '事实日志' }}
      />
      <Tab.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{ tabBarLabel: '审计报告' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsTab}
        options={{ tabBarLabel: '设置' }}
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
      <AppProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AppProvider>
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
