import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeProvider";

const Header = ({ title, style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
        },
        style,
      ]}
    >
      <Text style={[styles.title, { color: theme.heading }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
  },
});

export default Header;
