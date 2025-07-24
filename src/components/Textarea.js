import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { useTheme } from "../contexts/ThemeProvider";

const Textarea = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  disabled,
  style,
  minHeight = 100, // Minimum height for the textarea
  maxHeight = 200, // Maximum height for the textarea
  ...props
}) => {
  const { theme } = useTheme();
  const [height, setHeight] = useState(minHeight);

  // Function to dynamically adjust height based on content size
  const handleContentSizeChange = (event) => {
    const newHeight = event.nativeEvent.contentSize.height;
    setHeight(Math.min(Math.max(newHeight, minHeight), maxHeight)); // Ensure height stays within bounds
  };

  return (
    <View style={[styles.container, style]}>
      {/* Render label if provided */}
      {label && (
        <Text style={[styles.label, { color: theme.onSurface }]}>{label}</Text>
      )}

      {/* Pressable wrapper for the ScrollView and TextInput */}
      <Pressable
        style={({ pressed }) => [
          styles.inputWrapper,
          {
            borderColor: error ? theme.error : theme.border,
            backgroundColor: theme.surface,
            opacity: disabled ? 0.6 : 1,
            height: height + 32, // Adjust wrapper height based on content
          },
          pressed && { backgroundColor: theme.surfaceVariant },
        ]}
      >
        {/* ScrollView to allow scrolling if content exceeds maxHeight */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* TextInput with multiline and dynamic height */}
          <TextInput
            style={[styles.input, { color: theme.onSurface }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.outline}
            editable={!disabled}
            multiline={true}
            scrollEnabled={false} // Disable internal scrolling of TextInput
            onContentSizeChange={handleContentSizeChange} // Adjust height on content change
            {...props} // Spread any additional props
          />
        </ScrollView>
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
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  input: {
    fontSize: 16,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default Textarea;
