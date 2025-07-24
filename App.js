import { useEffect } from 'react';
import { StatusBar, SafeAreaView, Platform, Alert, Linking } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { ThemeProvider } from "./src/contexts/ThemeProvider";
import { UserProvider } from "./src/contexts/UserContext";
import { LearningPreferencesProvider } from "./src/contexts/LearningPreferencesContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import AppNavigator from "./AppNavigator";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default App = () => {
  useEffect(() => {
    // Request notification permissions
    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert(
          "Notification Permission Required",
          "To receive reminders for your learning activities, please enable notifications in your device settings.",
          [
            {
              text: "Go to Settings",
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Alert.alert("Please enable notifications for this app in your device settings.");
                }
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('learning-reminders', {
          name: 'Learning Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    })();
  }, []);

  return (
    <ThemeProvider>
      <UserProvider>
        <LearningPreferencesProvider>
          <GestureHandlerRootView>
            <SafeAreaView style={{ flex: 1 }}>
              <StatusBar barStyle="light-content" />
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </SafeAreaView>
          </GestureHandlerRootView>
        </LearningPreferencesProvider>
      </UserProvider>
    </ThemeProvider>
  );
}