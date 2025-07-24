import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeProvider";

const RadioButtonGroup = ({
  label,
  options,
  selectedOption,
  onSelect,
  style,
  error,
  disabled,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Render label if provided */}
      {label && (
        <Text style={[styles.label, { color: theme.onSurface }]}>{label}</Text>
      )}

      <View style={styles.radioGroup}>
        {/* Map through options and create a Pressable for each radio button */}
        {options.map((option, index) => (
          <Pressable
            key={index}
            onPress={() => !disabled && onSelect(option.value)} // Call onSelect if not disabled
            style={({ pressed }) => [
              styles.radioButton,
              {
                opacity: disabled ? 0.6 : 1,
                backgroundColor: pressed ? theme.surfaceVariant : theme.surface,
              },
            ]}
          >
            <View
              style={[
                styles.radioOuterCircle,
                {
                  borderColor: error ? theme.error : theme.primary,
                },
              ]}
            >
              {/* Render inner circle if the option is selected */}
              {selectedOption === option.value && (
                <View
                  style={[
                    styles.radioInnerCircle,
                    {
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              )}
            </View>
            {/* Render option label */}
            <Text style={[styles.radioLabel, { color: theme.onSurface }]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Render error message if error prop is provided */}
      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  radioGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  radioOuterCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  radioInnerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default RadioButtonGroup;
