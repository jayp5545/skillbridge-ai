import React, { useState } from "react";
import {
  Text,
  Pressable,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../contexts/ThemeProvider";

const Button = ({ title, onPress, disabled, loading, style }) => {
  const { theme } = useTheme();
  // Animated value for button scale
  const scale = useState(new Animated.Value(1))[0];

  // Function to handle button press in animation
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  // Function to handle button press out animation
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading} // Disable button if disabled or loading
      android_ripple={{ color: theme.primaryLight }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? theme.neutralLight : theme.primaryLight,
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {/* Show loading indicator if loading, otherwise show text */}
        {loading ? (
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <Text
            style={[
              styles.text,
              { color: disabled ? theme.neutral : theme.text },
            ]}
          >
            {title}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Button;
