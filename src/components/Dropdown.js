import React, { useState, useRef } from "react";
import {
  Text,
  Pressable,
  View,
  StyleSheet,
  Animated,
  FlatList,
  Modal,
} from "react-native";
import { useTheme } from "../contexts/ThemeProvider";
import { MaterialIcons } from "@expo/vector-icons";

const Dropdown = ({
  label,
  data,
  onSelect,
  placeholder = "Select an option",
  width = "100%",
  style,
  error,
  disabled,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(placeholder);
  const rotateAnim = useRef(new Animated.Value(0)).current; // Animated value for chevron rotation

  // Function to toggle the dropdown's open state and animate the chevron
  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Function to handle item selection and close the dropdown
  const handleSelect = (item) => {
    setSelectedValue(item);
    onSelect(item);
    toggleDropdown();
  };

  // Interpolate rotation value for the chevron icon
  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={[styles.container, style, { width }]}>
      {/* Render label if provided */}
      {label && (
        <Text style={[styles.label, { color: theme.onSurface }]}>{label}</Text>
      )}
      {/* Pressable to trigger dropdown toggle */}
      <Pressable
        onPress={toggleDropdown}
        disabled={disabled}
        style={[
          styles.inputWrapper,
          {
            borderColor: error ? theme.error : theme.border,
            backgroundColor: theme.surface,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {/* Display selected value or placeholder */}
        <Text style={[styles.selectedText, { color: theme.onSurface }]}>
          {selectedValue}
        </Text>
        {/* Animated chevron icon */}
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={24}
            color={theme.onSurface}
          />
        </Animated.View>
      </Pressable>
      {/* Modal for displaying dropdown options */}
      <Modal visible={isOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={toggleDropdown}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            {/* FlatList for rendering dropdown items */}
            <FlatList
              data={data}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.item}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={{ color: theme.onSurface }}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "bold",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  selectedText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxHeight: "50%",
    borderRadius: 8,
    elevation: 3,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});

export default Dropdown;
