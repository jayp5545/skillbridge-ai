import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Card, Title, Text, Switch, Modal } from "react-native-paper";
import {  getFirestore } from "firebase/firestore";
import { useTheme } from "../contexts/ThemeProvider";
import Button from "../components/Button";
import BorderedButton from "../components/BorderedButton";
import { auth } from "../../firebase";
import { useUser } from "../contexts/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";


const timeOptions = [5, 10, 15, 30, 45, 60];

const firestore = getFirestore();

const LearningPreferencesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [dedicatedTime, setDedicatedTime] = useState(5); // State to store dedicated learning time
  const [frequency, setFrequency] = useState("Daily"); // State to store learning frequency
  const [notifications, setNotifications] = useState(false); // State to store notification preference
  const [loading, setLoading] = useState(false); // State to manage loading state
  const [showPicker, setShowPicker] = useState(false); // State to control time picker modal
  const { userData, updateUserData } = useUser(); // Destructure updateUserData

  const handleSavePreferences = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true); // Set loading to true while processing
    try {
      console.log("updated preferences");
      console.log(dedicatedTime);
      const updatedPreferences = {
        dedicatedTime,
        frequency,
        notifications,
        setupCompleted: true,
        updatedAt: new Date(),
      };
      await AsyncStorage.setItem("dedicatedTime", dedicatedTime.toString());
      await AsyncStorage.setItem("frequency", frequency);
      await AsyncStorage.setItem("notifications", notifications ? "true" : "false");
      await updateUserData({
        ...userData,
        learningPreferences: updatedPreferences,
      });
      navigation.replace("Home"); // Navigate to Home screen after saving preferences
    } catch (error) {
      console.error("Error saving preferences:", error);
      Alert.alert("Error", "Failed to save preferences. Please try again."); // Alert if error occurs
    } finally {
      setLoading(false); // Set loading to false after processing
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={[styles.title, { color: theme.primary }]}>
              Learning Preferences
            </Title>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.onSurface }]}>
                How much time can you dedicate daily?
              </Text>
              <BorderedButton
                title={dedicatedTime}
                onPress={() => setShowPicker(true)}
                style={styles.timeButton}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.onSurface }]}>
                How often do you want to learn?
              </Text>
              <View style={styles.frequencyContainer}>
                <Button
                  title="Daily"
                  onPress={() => setFrequency("Daily")}
                  style={[
                    styles.frequencyButton,
                    frequency !== "Daily" && styles.inactiveButton,
                  ]}
                />
                <Button
                  title="Weekly"
                  onPress={() => setFrequency("Weekly")}
                  style={[
                    styles.frequencyButton,
                    frequency !== "Weekly" && styles.inactiveButton,
                  ]}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.notificationRow}>
                <Text style={[styles.label, { color: theme.onSurface }]}>
                  Enable Push Notifications
                </Text>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  color={theme.primary}
                />
              </View>
            </View>

            <Button
              title="Finish Profile Setup"
              onPress={handleSavePreferences}
              loading={loading}
              disabled={loading}
              style={styles.finishButton}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      <Modal
        visible={showPicker}
        onDismiss={() => setShowPicker(false)}
        contentContainerStyle={[
          styles.modalContent,
          { backgroundColor: theme.background },
        ]}
      >
        <Card>
          <Card.Content>
            <Title style={[styles.modalTitle, { color: theme.primary }]}>
              Select Time
            </Title>
            {timeOptions.map((time) => (
              <BorderedButton
                key={time}
                title={time}
                onPress={() => {
                  setDedicatedTime(time);
                  setShowPicker(false);
                }}
                style={[
                  styles.timeOption,
                  dedicatedTime === time && styles.selectedTimeOption,
                ]}
              />
            ))}
          </Card.Content>
        </Card>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  card: {
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    textAlign: "center",
    marginBottom: 32,
    fontSize: 25,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  timeButton: {
    width: "100%",
    marginVertical: 8,
    marginHorizontal: 0,
  },
  frequencyContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  frequencyButton: {
    flex: 1,
    margin: 0,
  },
  inactiveButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  notificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  finishButton: {
    marginTop: 32,
  },
  modalContent: {
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 20,
    fontWeight: "600",
  },
  timeOption: {
    marginVertical: 4,
    marginHorizontal: 0,
  },
  selectedTimeOption: {
    backgroundColor: "rgba(98, 0, 238, 0.1)",
  },
});

export default LearningPreferencesScreen;
