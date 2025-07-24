import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../../firebase";
import { useUser, user } from "../contexts/UserContext";

const ProfileCheckerScreen = () => {
  const firestore = getFirestore();
  const navigation = useNavigation();
  const { loading } = useUser();

  useEffect(() => {
    if (loading) return;
    const checkProfileSetup = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          // If there's no current authenticated user, navigate them to Auth screen.
          navigation.replace("Auth");
          return;
        }

        // Getting user document from Firestore.
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);
        // if (!userSnap.exists()) {
        //   // If the user document doesn't exist, navigate to LearningPreferences.
        //   navigation.replace("LearningPreferences");
        //   return;
        // }
        const data = userSnap.data();

        // Checking if there is profile photo set.
        if (!data?.photoURL) {
          // If profile photo is not set, navigate to ProfilePictureSetup.
          navigation.replace("ProfilePictureSetup");
          return;
        }

        // Checking if learning preferences have been set.
        if (
          !data?.learningPreferences ||
          !data?.learningPreferences.setupCompleted
        ) {
          // If learning preferences are not set, navigate to LearningPreferences.
          navigation.replace("LearningPreferences");
          return;
        }

        // If both the profile photo and learning preferences are set, navigate to Home.
        console.log("Navigating to Home");
        navigation.replace("Home");
      } catch (error) {
        console.error("Error checking profile setup: ", error);
        Alert.alert(
          "Error",
          "Failed to complete profile check. Please try again."
        );
      }
    };

    checkProfileSetup();
  }, [auth, firestore, navigation]); // Dependencies for useEffect

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#36618E" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProfileCheckerScreen;
