import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { useUser } from "../../contexts/UserContext";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getDocs, collection, query, where } from "firebase/firestore";
import {
  signOut,
  getAuth,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { updateProfilePhoto } from "../../services/cloudinaryService";
import { db } from "../../../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PasswordResetModal from "./PasswordResetModal";

const ProfileScreen = () => {
  const { theme } = useTheme();
  const auth = getAuth();
  // Using the auth context to get the current user
  const { userData, updateUserData, loading } = useUser();
  const navigation = useNavigation();
  const styles = themedStyles(theme);

  // State variables
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(userData?.photoURL || null);
  const [userDetails, setUserDetails] = useState({
    name: userData?.name || "Admin1",
    username: userData?.username || "admin1",
    email: userData?.email || "admin@skillbridge.ai",
  });
  const [learningPreferences, setLearningPreferences] = useState({
    dedicatedTime: userData?.learningPreferences.dedicatedTime || 30,
    frequency: userData?.learningPreferences.frequency || "Daily",
  });
  const [notificationSettings, setNotificationSettings] = useState(
    userData?.learningPreferences.notifications || null
  );
  const timeOptions = [5, 10, 15, 30, 45, 60];
  const frequencyOptions = ["Daily", "Weekly"];
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  // Fetching user data when the component mounts or when userData changes
  useEffect(() => {
    setProfileImage(userData?.photoURL || null);
  }, [userData?.photoURL]);

  // Fetching user data from Firestore
  const handleUpdateProfilePhoto = async () => {
    const updateProfileCallback = async (secureUrl) => {
      await updateUserData({ photoURL: secureUrl });
      setProfileImage(secureUrl);
    };
    await updateProfilePhoto(updateProfileCallback);
  };

  // Function to handle password change
  const handleChangePassword = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError("");
    setPasswordModalVisible(true);
  };

  // Function to save the new password
  const saveNewPassword = async () => {
    // Validating password inputs
    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (!passwordData.currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setPasswordError("User not found");
      return;
    }
    try {
      // Reauthenticating the user
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);
      Alert.alert("Success", "Password changed successfully");
      // Resetting password data and closing modal
      setPasswordModalVisible(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setPasswordError("The current password is incorrect.");
      } else if (err.code === "auth/requires-recent-login") {
        setPasswordError("Please log in again and try changing your password.");
      } else {
        setPasswordError("Failed to change password. " + err.message);
      }
    }
  };

  // Function to save user details
  const saveUserDetails = async () => {
    // Validating user details
    try {
      // Checking if the user is logged in
      const checkUniqueUserDetails = async () => {
        const usersCol = collection(db, "users");
        const usernameQuery = query(
          usersCol,
          where("username", "==", userDetails.username)
        );
        const emailQuery = query(
          usersCol,
          where("email", "==", userDetails.email)
        );
        // Fetching documents for username and email
        const usernameSnap = await getDocs(usernameQuery);
        const emailSnap = await getDocs(emailQuery);
        let isUsernameUnique = true;
        let isEmailUnique = true;
        // Checking if the username and email are unique
        usernameSnap.forEach((docSnap) => {
          if (docSnap.id !== userData.id) {
            isUsernameUnique = false;
          }
        });
        emailSnap.forEach((docSnap) => {
          if (docSnap.id !== userData.id) {
            isEmailUnique = false;
          }
        });
        return { isUsernameUnique, isEmailUnique };
      };
      const { isUsernameUnique, isEmailUnique } =
        await checkUniqueUserDetails();
      // Checking if the username is unique
      if (!isUsernameUnique) {
        Alert.alert(
          "Username Unavailable",
          "The username is already in use. Please choose another."
        );
        return;
      }
      // Checking if the email is unique
      if (!isEmailUnique) {
        Alert.alert(
          "Email Unavailable",
          "The email is already in use. Please choose another."
        );
        return;
      }
      // Updating user data
      if (userData?.id) {

        await AsyncStorage.setItem("dedicatedTime", learningPreferences.dedicatedTime.toString());
        await AsyncStorage.setItem("frequency", learningPreferences.frequency);
        await AsyncStorage.setItem("notifications", notificationSettings ? "true" : "false");

        updateUserData({
          ...userData,
          ...userDetails,
          photoURL: profileImage,
          learningPreferences: {
            dedicatedTime: learningPreferences.dedicatedTime,
            frequency: learningPreferences.frequency,
            notifications: notificationSettings,
            updatedAt: new Date(),
          },
        });
      }
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    // Showing confirmation alert before logout
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {}
            navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  // Rendering the profile screen
  return (
    // Main container for the profile screen
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile Page</Text>
        {/* Edit/Save Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          {isEditing && (
            <Feather
              name={"check"}
              size={22}
              color={theme.primary}
              onPress={saveUserDetails}
            />
          )}
          {!isEditing && (
            <Feather
              name={"edit-2"}
              size={22}
              color={theme.primary}
              onPress={() => setIsEditing(true)}
            />
          )}
        </TouchableOpacity>
      </View>
      {/* Scrollable Content Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image Section */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity
            style={styles.profileImageWrapper}
            onPress={isEditing ? handleUpdateProfilePhoto : null}
            activeOpacity={1}
          >
            {/* Displaying profile image or placeholder */}
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {userDetails.name.charAt(0)}
                </Text>
              </View>
            )}
            {/* Edit button for profile image */}
            {isEditing && (
              <View style={styles.editProfileImageButton}>
                <Feather name="camera" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
        {/* User Details Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={userDetails.name}
              onChangeText={(text) =>
                setUserDetails({ ...userDetails, name: text })
              }
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={userDetails.username}
              onChangeText={(text) =>
                setUserDetails({ ...userDetails, username: text.toLowerCase() })
              }
              editable={isEditing}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={userDetails.email}
              onChangeText={(text) =>
                setUserDetails({ ...userDetails, email: text })
              }
              editable={isEditing}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </Card>
        {/* Learning Preferences Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Learning Preferences</Text>
          <View style={styles.preferenceGroup}>
            <Text style={styles.preferenceLabel}>Daily Learning Time</Text>
            <View style={styles.timeOptionsContainer}>
              {timeOptions.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    learningPreferences.dedicatedTime === time &&
                      styles.timeOptionSelected,
                    !isEditing && styles.optionDisabled,
                  ]}
                  onPress={() =>
                    isEditing &&
                    setLearningPreferences({
                      ...learningPreferences,
                      dedicatedTime: time,
                    })
                  }
                  disabled={!isEditing}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      learningPreferences.dedicatedTime === time &&
                        styles.timeOptionTextSelected,
                    ]}
                  >
                    {time} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.preferenceGroup}>
            <Text style={styles.preferenceLabel}>Learning Frequency</Text>
            <View style={styles.frequencyOptionsContainer}>
              {frequencyOptions.map((frequency) => (
                <TouchableOpacity
                  key={frequency}
                  style={[
                    styles.frequencyOption,
                    learningPreferences.frequency === frequency &&
                      styles.frequencyOptionSelected,
                    !isEditing && styles.optionDisabled,
                  ]}
                  onPress={() =>
                    isEditing &&
                    setLearningPreferences({
                      ...learningPreferences,
                      frequency,
                    })
                  }
                  disabled={!isEditing}
                >
                  <Text
                    style={[
                      styles.frequencyOptionText,
                      learningPreferences.frequency === frequency &&
                        styles.frequencyOptionTextSelected,
                    ]}
                  >
                    {frequency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>
        {/* Notification Settings Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          <View style={styles.notificationOption}>
            <View>
              <Text style={styles.notificationOptionTitle}>
                Course Reminders
              </Text>
              <Text style={styles.notificationOptionDescription}>
                Daily reminders for your active courses
              </Text>
            </View>
            <Switch
              value={notificationSettings}
              onValueChange={() =>
                setNotificationSettings(!notificationSettings)
              }
              trackColor={{ false: "#d1d1d1", true: theme.primaryLight }}
              thumbColor={notificationSettings ? theme.primary : "#f4f3f4"}
              disabled={!isEditing}
            />
          </View>
        </Card>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity
            style={[
              styles.settingOption,
              { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
            ]}
            onPress={handleChangePassword}
          >
            <View style={styles.settingOptionIconContainer}>
              <Ionicons name="key-outline" size={22} color={theme.primary} />
            </View>
            <View style={styles.settingOptionContent}>
              <Text style={styles.settingOptionTitle}>Change Password</Text>
              <Text style={styles.settingOptionDescription}>
                Update your account password
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.textLight}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingOption} onPress={handleLogout}>
            <View
              style={[styles.settingOptionIconContainer, styles.logoutIcon]}
            >
              <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
            </View>
            <View style={styles.settingOptionContent}>
              <Text style={[styles.settingOptionTitle, styles.logoutText]}>
                Logout
              </Text>
              <Text style={styles.settingOptionDescription}>
                Sign out from your account
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.textLight}
            />
          </TouchableOpacity>
        </Card>
        {/* Save Changes Button */}
        {isEditing && (
          <Button
            title="Save Changes"
            onPress={saveUserDetails}
            style={styles.saveButton}
          />
        )}
        {/* Edit Profile Button */}
        {!isEditing && (
          <Button
            title="Edit Profile"
            onPress={() => setIsEditing(true)}
            style={styles.saveButton}
          />
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>
      {/* Password Reset Modal */}
      <PasswordResetModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        passwordData={passwordData}
        setPasswordData={setPasswordData}
        passwordError={passwordError}
        saveNewPassword={saveNewPassword}
        theme={theme}
      />
    </View>
  );
};
// Styles for the ProfileScreen component
const themedStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 15,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.heading,
      fontFamily: "Quicksand_700Bold",
    },
    editButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
    },
    profileImageContainer: {
      alignItems: "center",
      marginVertical: 20,
    },
    profileImageWrapper: {
      position: "relative",
      width: 120,
      height: 120,
      borderRadius: 60,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: theme.primary,
    },
    profileImage: {
      width: "100%",
      height: "100%",
    },
    profileImagePlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.primaryLight,
      justifyContent: "center",
      alignItems: "center",
    },
    profileImagePlaceholderText: {
      fontSize: 50,
      fontWeight: "bold",
      color: theme.primary,
    },
    editProfileImageButton: {
      position: "absolute",
      bottom: 5,
      right: 10,
      backgroundColor: theme.primary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    sectionCard: {
      marginBottom: 20,
      borderRadius: 16,
      borderWidth: 1,
      padding: 20,
      backgroundColor: theme.cardBackground,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.primary,
      marginBottom: 15,
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
    textInputDisabled: {
      backgroundColor: theme.background,
      color: theme.textLight,
    },
    preferenceGroup: {
      marginBottom: 20,
    },
    preferenceLabel: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 10,
      fontWeight: "500",
    },
    timeOptionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -5,
    },
    timeOption: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginHorizontal: 5,
      marginBottom: 10,
    },
    timeOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    timeOptionText: {
      color: theme.text,
      fontSize: 14,
    },
    timeOptionTextSelected: {
      color: theme.buttonPrimaryText,
      fontWeight: "bold",
    },
    frequencyOptionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -5,
    },
    frequencyOption: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginHorizontal: 5,
      marginBottom: 10,
    },
    frequencyOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    frequencyOptionText: {
      color: theme.text,
      fontSize: 14,
    },
    frequencyOptionTextSelected: {
      color: theme.buttonPrimaryText,
      fontWeight: "bold",
    },
    optionDisabled: {
      opacity: 0.8,
    },
    notificationOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    notificationOptionTitle: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "500",
    },
    notificationOptionDescription: {
      fontSize: 14,
      color: theme.textLight,
      marginTop: 2,
    },
    settingOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
    },
    settingOptionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryLight,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    settingOptionContent: {
      flex: 1,
    },
    settingOptionTitle: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "500",
    },
    settingOptionDescription: {
      fontSize: 14,
      color: theme.textLight,
      marginTop: 2,
    },
    logoutIcon: {
      backgroundColor: "#fde2e2",
    },
    logoutText: {
      color: "#e74c3c",
    },
    saveButton: {
      marginTop: 10,
      marginBottom: 20,
    },
    bottomSpace: {
      height: 80,
    },
  });

export default ProfileScreen;
