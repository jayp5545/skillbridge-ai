import React, { useState, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useUser } from "./src/contexts/UserContext";

import Header from "./src/components/Header";
import BottomNavigation from "./src/components/BottomNavigation";
import AuthScreen from "./src/screens/AuthScreen";
import LearningPreferencesScreen from "./src/screens/LearningPreferencesScreen";
import ProfilePictureSetupScreen from "./src/screens/ProfilePictureSetupScreen";
import ProfileCheckerScreen from "./src/screens/ProfileCheckerScreen";
import HomeScreen from "./src/screens/HomeScreen";
import NewCourseScreen from "./src/screens/Course/NewCourseScreen";
import CourseTimelineScreen from "./src/screens/Course/CourseTimeline/CourseTimelineScreen";
import TaskScreen from "./src/screens/Course/Task/TaskScreen";
import QuizScreen from "./src/screens/Course/Quiz/QuizScreen";
import CompletionScreen from "./src/screens/Course/Completion/CompletionScreen";
import ProfileScreen from "./src/screens/Profile/ProfileScreen";
import LeaderboardScreen from "./src/screens/LeaderboardScreen";
import CertificatesScreen from "./src/screens/CertificatesScreen";
import SplashScreen from "./src/screens/SplashScreen";

const Stack = createNativeStackNavigator();

const LoadingOverlay = () => {
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#461e6e" />
    </View>
  );
};

export default AppNavigator = () => {
  const { user, userData, loading } = useUser();
  const [selectedTab, setSelectedTab] = useState("Home");
  const [initialRouteName, setInitialRouteName] = useState("");
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Setting splash screen duration to 2.5 seconds
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 2500);
    if (!loading) {
      if (user && userData) {
        if (!userData?.photoURL) {
          // If profile photo is not set, navigate to ProfilePictureSetup.
          setInitialRouteName("ProfilePictureSetup");
        } else if ( !userData?.learningPreferences || !userData?.learningPreferences.setupCompleted) {
          // If learning preferences are not set, navigate to LearningPreferences.
          setInitialRouteName("LearningPreferences");
        } else {
          setInitialRouteName("Home");
        }
      } else {
        setInitialRouteName("Auth");
      }   
    }
    // Cleaning up the timer
    return () => clearTimeout(timer);
  }, [user, userData, loading]);

  const handleTabChange = (tabName) => {
    setSelectedTab(tabName);
  };

  if (initialRouteName === "") {
    return <Stack.Screen name="Loading" component={LoadingOverlay} />;
  }
  if (!isAppReady) {
    return <SplashScreen />;
  }

  return (
    // Only showing the header if the initial route is not empty
    initialRouteName !== "" && (
      <>
        <Header title="SkillBridge AI" />
        {loading && <LoadingOverlay />}
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={initialRouteName}
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen
            name="ProfileChecker"
            component={ProfileCheckerScreen}
          />
          <Stack.Screen
            name="ProfilePictureSetup"
            component={ProfilePictureSetupScreen}
          />
          <Stack.Screen
            name="LearningPreferences"
            component={LearningPreferencesScreen}
          />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="NewCourseScreen" component={NewCourseScreen} />
          <Stack.Screen
            name="CourseTimeline"
            component={CourseTimelineScreen}
          />
          <Stack.Screen name="Task" component={TaskScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="CompletionScreen"     component={CompletionScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Certificates" component={CertificatesScreen} />
          <Stack.Screen name="LeaderBoard" component={LeaderboardScreen} />
        </Stack.Navigator>
        {user && (
          <BottomNavigation
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
          />
        )}
      </>
    )
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)", 
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
