import React from "react";
import { TextInput, View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "../contexts/ThemeProvider";

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  disabled,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Render label if provided */}
      {label && (
        <Text style={[styles.label, { color: theme.onSurface }]}>{label}</Text>
      )}

      {/* Pressable wrapper for the TextInput */}
      <Pressable
        style={({ pressed }) => [
          styles.inputWrapper,
          {
            borderColor: error ? theme.error : theme.border,
            backgroundColor: theme.surface,
            opacity: disabled ? 0.6 : 1,
          },
          pressed && { backgroundColor: theme.surfaceVariant },
        ]}
      >
        {/* TextInput component */}
        <TextInput
          style={[styles.input, { color: theme.onSurface }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.outline}
          editable={!disabled}
          {...props} // Spread any additional props passed to the Input component
        />
      </Pressable>

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
  inputWrapper: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input;
