import React from "react";
import { View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CompletionScreenBase = ({ theme, styles, onClose, children, bottomButtons }) => (
  <View style={styles.outerContainer}>
    <Ionicons
      name="close-outline"
      size={32}
      color={theme.heading}
      style={styles.closeButton}
      onPress={onClose}
    />
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
    >
      {children}
    </ScrollView>
    {bottomButtons && (
      <View style={styles.bottomButtonContainer}>{bottomButtons}</View>
    )}
  </View>
);

export default CompletionScreenBase;