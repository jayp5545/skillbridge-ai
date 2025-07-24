import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Alert, Platform } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { useUser } from "../../contexts/UserContext";
import { db } from "../../../firebase";
import { addDoc, collection, getDocs, limit, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { Card, Title, Modal } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';

import Button from "../../components/Button";
import CustomCard from "../../components/Card";
import RadioButtonGroup from "../../components/RadioButtonGroup";
import Textarea from "../../components/Textarea";
import chatGptPrompt from "../../prompts/courseTimeline";
import chatGptService from "../../services/chatGptService";
import BorderedButton from "../../components/BorderedButton";

const NOTIFICATION_OFFSET = 10 * 60 * 1000;

export default NewCourseScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { userData, loading, setLoading, updateUserData, setCourseId, setActivityId } = useUser();
  const [description, setDescription] = useState(""); // State for course description
  const [timeDuration, setTimeDuration] = useState("5 min"); // State for time duration
  const [frequency, setFrequency] = useState("daily"); // State for learning frequency
  const [approach, setApproach] = useState("theoretical"); // State for learning approach
  const [error, setError] = useState(false); // State for error handling
  const [showPicker, setShowPicker] = useState(false); // State to control time picker modal

  const durationOptions = ["5 min", "10 min", "15 min", "30 min", "1 hr"]; // Options for time duration

  const frequencyOptions = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
  ]; // Options for learning frequency

  const approachOptions = [
    { label: "Theoretical", value: "theoretical" },
    { label: "Practical", value: "practical" },
  ]; // Options for learning approach

  useEffect(() => {
    // Set up notification listener to handle clicks
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("NOTIFICATION RESPONSE RECEIVED:", response);
      const { courseId } = response.notification.request.content.data;
      if (courseId) {
        navigation.navigate("CourseTimeline");
        // You can extend this to navigate to a specific activity if you included activityId
      }
    });

    return () => subscription.remove();
  }, [navigation]);

  useEffect(() => {
    const getLocalData = async () => {
      const localDedicatedTime = await AsyncStorage.getItem("dedicatedTime");
      const localFrequency = await AsyncStorage.getItem("frequency");
      const userLearningPreferences = userData?.learningPreferences || null;
  
      if(localDedicatedTime) {
        setTimeDuration(localDedicatedTime + " min");
      } else if(userLearningPreferences?.dedicatedTime) {
        const userTime = userLearningPreferences?.dedicatedTime ? userLearningPreferences.dedicatedTime + " min" : null;
        const defaultTime = userTime || "5 min";
        setTimeDuration(defaultTime);
      }
  
      if(localFrequency) {
        setFrequency(localFrequency.toLowerCase());
      } else if(userLearningPreferences?.frequency) {
        const defaultFrequency = userLearningPreferences?.frequency || "daily"; 
        setFrequency(defaultFrequency.toLowerCase());
      }
    }
    getLocalData();
  }, []);

  const scheduleNotification = async (activity, courseId) => {
    if (activity.start_time) {
      const reminderTime = activity.start_time.toDate().getTime() - (NOTIFICATION_OFFSET); // 10 mins before
      const now = new Date().getTime();

      if (reminderTime > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `course-${courseId}-activity-${activity.id}`,
          content: {
            title: "Reminder: Your Learning Activity is Approaching!",
            body: `Your activity "${activity.task_title || activity.quiz_title}" is starting soon.`,
            sound: 'default',
            data: { courseId: courseId, activityId: activity.id },
          },
          trigger: {
            date: new Date(reminderTime),
            repeats: false,
          },
        });
        console.log(`Notification scheduled for activity: ${activity.task_title || activity.quiz_title} at ${new Date(reminderTime)}`);
      }
    }
  };

  const scheduleWelcomeNotification = async (courseTitle, courseId) => {
    await Notifications.scheduleNotificationAsync({
      identifier: `course-${courseId}-welcome`,
      content: {
        title: "Welcome to Your New Course!",
        body: `You've successfully started learning "${courseTitle}". Let's begin your journey!`,
        sound: 'default',
        data: { courseId: courseId },
      },
      trigger: null, // Trigger immediately
    });
    console.log(`Welcome notification scheduled for course: ${courseTitle}`);
  };

  const handleGenerate = async () => {
    // Function to handle course generation
    if (!description || !timeDuration || !frequency || !approach) {
      console.error("Please fill all fields");
      setError(true); // Set error if any field is empty
      return;
    }

    setLoading(true); // Set loading to true while generating

    try {
      const userInput = {
        user_prompt: description,
        frequency: frequency,
        time: timeDuration,
        current_date: new Date().toISOString(),
      };

      const response = await chatGptService.generateContent({
        userInput,
        chatGptPrompt,
      }); // Call to chatGPT service

      if (response.success && response.content.valid && response.content.course) {
        await addCourseData(response.content.course); // Add course data to firestore
      } else if (response.success && !response.content.valid && response.content.reason) {
        console.log("Error generating learing path:", response.content.reason);
        Alert.alert('Content Error', response.content.reason, [{ text: 'OK', onPress: () => { } }]);
      } else {
        console.error("Error generating learning path:", response.content.error);
        Alert.alert('Content Error', response.content.error, [{ text: 'OK', onPress: () => { } }]);
      }
    } catch (error) {
      console.error("Error generating learning path:", error);
    } finally {
      setLoading(false); // Set loading to false after generation
    }
  };

  const addCourseData = async (courseData) => {
    try {
      // 1. Create the main course document
      const courseCollection = collection(db, "courses");
      const now = Timestamp.fromDate(new Date());
      const newCourseData = {
        title: courseData.title,
        description: courseData.description,
        user_id: userData.id,
        timeDuration: timeDuration,
        frequency: frequency,
        approach: approach,
        completed_activies: 0,
        current_activity_id: "",
        status: "in_progress",
        created_at: now,
        updated_at: now,
      };

      const courseDocument = await addDoc(courseCollection, newCourseData);
      console.log("Course saved to Firestore:", courseDocument);
      const courseId = courseDocument.id;
      console.log("Course saved to Firestore with ID:", courseId);

      // 2. Update user data with the current course ID
      await updateUserData({ current_course_id: courseId });
      setCourseId(courseId);
      console.log("User data updated with current course ID:", courseId);

      // Schedule welcome notification after course data is saved
      scheduleWelcomeNotification(courseData.title, courseId);

      // 3. Add activities in bulk (more efficient)
      const activitiesCollection = collection(courseDocument, "activities");
      const activitiesBatch = courseData.activities.map((activity) => ({
        index: activity.index,
        task_title: activity.task_title || "",
        task_description: activity.task_description || "",
        quiz_title: activity.quiz_title || "",
        start_time: activity.start_time ? Timestamp.fromDate(new Date(activity.start_time)) : null,
        end_time: activity.end_time ? Timestamp.fromDate(new Date(activity.end_time)) : null,
        created_at: now,
        updated_at: now,
        status: activity.index === 0 ? "in_progress" : "pending",
        task_status: activity.index === 0 ? "in_progress" : "pending",
        quiz_status: "pending",
        quiz_score: 0,
        total_score: 0,
        completed_cards: 0,
        completed_questions: 0,
        current_card_id: "",
        current_question_id: "",
      }));

      // Use Promise.all to add all activities concurrently
      const activityPromises = activitiesBatch.map((activity) => addDoc(activitiesCollection, activity));
      const activityDocs = await Promise.all(activityPromises);

      // Update courseData with the newly generated activity IDs
      courseData.activities.forEach((activity, index) => {
        activity.id = activityDocs[index].id;
        // Schedule notification for each activity with a start time
        if (activity.start_time) {
          scheduleNotification(activity, courseId);
        }
      });
      console.log("Activities saved to Firestore.");

      // 4. Get the ID of the first activity
      const firstActivityQuery = query(
        activitiesCollection,
        orderBy("index"),
        limit(1)
      );
      const firstActivitySnapshot = await getDocs(firstActivityQuery);

      if (!firstActivitySnapshot.empty) {
        const firstActivityDoc = firstActivitySnapshot.docs[0];
        await updateDoc(courseDocument, { current_activity_id: firstActivityDoc.id });
        setActivityId(firstActivityDoc.id);
        console.log("Updated course with the ID of the first activity:", firstActivityDoc.id);
      } else {
        console.warn("No activities found for this course.");
      }

      console.log("Learning path saved to Firestore with ID:", courseId);
      navigation.navigate("CourseTimeline");

    } catch (error) {
      console.error("Error adding course data:", error);
      // Consider showing an error message to the user
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.innerContainer}>
          <Text style={[styles.title, { color: theme.primary }]}>
            What do you want to learn today?
          </Text>

          <Text style={[styles.subtitle, { color: theme.onSurface }]}>
            Enter a skill topic and set your preferences to generate a customized learning plan.
          </Text>

          <Textarea
            value={description}
            onChangeText={setDescription}
            placeholder="Enter your description here..."
            minHeight={100}
            maxHeight={200}
            error={!description && error ? "Description is required" : null}
          />

          <CustomCard title="Preferences">
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.label, { color: theme.onSurface }]}>
                How much time can you dedicate daily?
              </Text>
              <BorderedButton
                title={timeDuration}
                onPress={() => setShowPicker(true)}
                style={styles.timeButton}
              />
            </View>
            <RadioButtonGroup
              label="How often do you want to learn?"
              options={frequencyOptions}
              selectedOption={frequency}
              onSelect={(value) => setFrequency(value)}
              error={!frequency && error ? "Please select a frequency" : null}
            />
            <RadioButtonGroup
              label="What learing approach do you like to follow?"
              options={approachOptions}
              selectedOption={approach}
              onSelect={(value) => setApproach(value)}
              error={!approach && error ? "Please select an approach" : null}
            />
          </CustomCard>
        </View>
      </ScrollView>
      <View style={[styles.buttonContainer, { borderColor: theme.border }]}>
        <Button
          title="Generate"
          onPress={handleGenerate}
          loading={loading}
          disabled={loading}
        />
      </View>

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
            {durationOptions.map((time) => (
              <BorderedButton
                key={time}
                title={time}
                onPress={() => {
                  setTimeDuration(time);
                  setShowPicker(false);
                }}
                style={[
                  styles.timeOption,
                  timeDuration === time ? styles.selectedTimeOption : {},
                ]}
              />
            ))}
          </Card.Content>
        </Card>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    marginBottom: 74,
  },
  innerContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    alignSelf: "left",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    alignSelf: "left",
  },
  buttonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    borderTopWidth: 1,
    backgroundColor: "transparent",
  },
  timeButton: {
    width: "100%",
    marginVertical: 8,
    marginHorizontal: 0,
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
    backgroundColor: "rgb(154, 196, 255)",
  },
});