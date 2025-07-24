import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";

const PasswordResetModal = ({
  visible,
  onClose,
  passwordData,
  setPasswordData,
  passwordError,
  saveNewPassword,
  theme,
}) => {
  const styles = themedStyles(theme);
  return (
    // Modal for changing password
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {/* KeyboardAvoidingView to handle keyboard appearance */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        {/* Main container for the modal */}
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={theme.textLight} />
            </TouchableOpacity>
          </View>
          {/* Body of the modal */}
          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                value={passwordData.currentPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, currentPassword: text })
                }
                secureTextEntry
                placeholder="Enter current password"
                placeholderTextColor={theme.textLight}
              />
            </View>
        
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                value={passwordData.newPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, newPassword: text })
                }
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor={theme.textLight}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.textInput}
                value={passwordData.confirmPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, confirmPassword: text })
                }
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor={theme.textLight}
              />
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
            {/* Button to save the new password */}
            <Button
              title="Change Password"
              onPress={saveNewPassword}
              style={styles.changePasswordButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const themedStyles = (theme) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      width: "85%",
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      overflow: "hidden",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.primary,
    },
    modalCloseButton: {
      padding: 5,
    },
    modalBody: {
      padding: 20,
    },
    inputGroup: {
      marginBottom: 15,
    },
    inputLabel: {
      fontSize: 14,
      color: theme.textLight,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: theme.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: theme.text,
    },
    errorText: {
      color: "#e74c3c",
      marginBottom: 15,
      fontSize: 14,
    },
    changePasswordButton: {
      marginTop: 10,
    },
  });

export default PasswordResetModal;
