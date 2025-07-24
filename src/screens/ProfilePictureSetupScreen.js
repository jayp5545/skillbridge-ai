// screens/ProfilePictureSetupScreen.js
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Card, Title, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { getAuth, updateProfile } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import ImageUploader from "../components/ImageUploader";
import { useTheme } from "../contexts/ThemeProvider";
import Button from "../components/Button";
import { auth } from "../../firebase";
import { useUser } from "../contexts/UserContext";

const ProfilePictureSetupScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { updateUserData } = useUser();

  // const auth = getAuth(); // Commented out as auth is imported from firebase.js
  const firestore = getFirestore();
  const [loading, setLoading] = useState(false); // State to manage loading state
  const [imageUrl, setImageUrl] = useState(null); // State to store the image URL

  const handleImageUploaded = async (downloadUrl) => {
    setImageUrl(downloadUrl); // Set the image URL when uploaded
  };

  const handleContinue = async () => {
    if (!imageUrl) {
      Alert.alert("Required", "Please upload a profile picture to continue."); // Alert if no image is uploaded
      return;
    }

    setLoading(true); // Set loading to true while processing
    const uid = auth.currentUser.uid;
    try {
      // use user context updateUserData method here
      await updateUserData({ photoURL: imageUrl }); // Update user data in context

      // await updateProfile(auth.currentUser, { photoURL: imageUrl }); // Update profile with image URL
      // await updateDoc(doc(firestore, "users", uid), { photoURL: imageUrl }); // Update user document in Firestore
      navigation.navigate("LearningPreferences"); // Navigate to LearningPreferences screen
    } catch (error) {
      Alert.alert("Error", "Failed to save profile picture. Please try again."); // Alert if error occurs
      console.error(error);
    } finally {
      setLoading(false); // Set loading to false after processing
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title style={[styles.title, { color: theme.primary }]}>
            Set Up Your Profile Picture
          </Title>

          <Text style={[styles.description, { color: theme.onSurface }]}>
            Please upload a profile picture to complete your profile setup.
          </Text>

          <View style={styles.uploaderContainer}>
            <ImageUploader
              onImageUploaded={handleImageUploaded}
              currentImage={imageUrl}
            />
          </View>

          <Button
            title="Continue"
            onPress={handleContinue}
            loading={loading}
            disabled={loading || !imageUrl}
            style={styles.continueButton}
          />
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    textAlign: "center",
    fontSize: 25,
    fontWeight: "600",
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 24,
  },
  uploaderContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  continueButton: {
    marginTop: 24,
  },
});

export default ProfilePictureSetupScreen;