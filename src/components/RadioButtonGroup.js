import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
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
      {label && (
        <Text style={[styles.label, { color: theme.onSurface }]}>{label}</Text>
      )}

      <View style={styles.radioGroup}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.radioButton,
              selectedOption === option.value
                ? [styles.selectedButton, { backgroundColor: "#2C5E9E" }]
                : [styles.unselectedButton, { borderColor: "#2C5E9E" }],
              disabled && styles.disabledButton,
            ]}
            onPress={() => !disabled && onSelect(option.value)}
            activeOpacity={0.8}
            disabled={disabled}
          >
            <Text
              style={[
                styles.buttonText,
                selectedOption === option.value
                  ? { color: "#FFFFFF" }
                  : { color: "#2C5E9E" },
                disabled && { color: theme.disabled },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedButton: {
    borderWidth: 0,
  },
  unselectedButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default RadioButtonGroup;
