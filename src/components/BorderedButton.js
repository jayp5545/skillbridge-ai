import React, { useState } from "react";
import { Text, Pressable, Animated, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeProvider";

const BorderedButton = ({ title, onPress, disabled, style }) => {
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
      disabled={disabled}
      android_ripple={{ color: theme.primaryFixedDim }}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: disabled ? theme.surfaceVariant : theme.primary,
          borderWidth: 2,
          backgroundColor: "transparent",
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text
          style={[
            styles.text,
            { color: disabled ? theme.surfaceVariant : theme.primary },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    minWidth: 220,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    margin: 8,
    width: "100%",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
});

export default BorderedButton;
