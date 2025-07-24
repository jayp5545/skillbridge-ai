// contexts/ThemeProvider.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { Text, TextInput, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_700Bold,
} from "@expo-google-fonts/quicksand";
import { Provider as PaperProvider } from "react-native-paper";
import lightTheme from "../theme/lightTheme";
import darkTheme from "../theme/darkTheme";

const ThemeContext = createContext();

// Set Default Text Styles
if (Text.defaultProps == null) Text.defaultProps = {};
if (TextInput.defaultProps == null) TextInput.defaultProps = {};

// Apply default font family to Text components
Text.defaultProps = {
  ...Text.defaultProps,
  style: [{ fontFamily: "Quicksand_400Regular" }, Text.defaultProps.style],
};

// Apply default font family to TextInput components
TextInput.defaultProps = {
  ...TextInput.defaultProps,
  style: [{ fontFamily: "Quicksand_400Regular" }, TextInput.defaultProps.style],
};

export const ThemeProvider = ({ children }) => {
  // State to manage dark mode and theme
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(lightTheme);

  // Load custom fonts using expo-font
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_700Bold,
  });

  // Load theme preference from AsyncStorage on component mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        const isDark = savedTheme === "dark";
        setIsDarkMode(isDark);
        setTheme(isDark ? darkTheme : lightTheme);
      } catch (error) {
        console.error("Error loading theme preference:", error);
      }
    };
    loadThemePreference();
  }, []);

  // Toggle theme and save preference to AsyncStorage
  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      setTheme(newTheme ? darkTheme : lightTheme);
      await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");
    } catch (error) {
      console.error("Error toggling theme:", error);
    }
  };

  // Show loading indicator while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Provide theme context to children components
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to access theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
