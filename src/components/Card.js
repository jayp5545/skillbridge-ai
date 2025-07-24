import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "../contexts/ThemeProvider";

const Card = ({ children, title, style, onPress }) => {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.surfaceAlt }}
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        },
        style,
      ]}
    >
      {/* Render title if provided */}
      {title && (
        <Text style={[styles.title, { color: theme.heading }]}>{title}</Text>
      )}
      {/* Render children within the card content */}
      <View style={styles.content}>{children}</View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    width: "100%",
    justifyContent: "center",
    borderWidth: 0.5,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    justifyContent: "center",
    gap: 8,
  },
});

export default Card;
