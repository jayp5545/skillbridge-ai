import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { doc, getDoc, updateDoc, collection, Timestamp, getDocs, query, where, addDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from 'expo-notifications';

import { useTheme } from "../../../contexts/ThemeProvider";
import { useUser } from "../../../contexts/UserContext";
import { db } from "../../../../firebase";

import Button from "../../../components/Button";
import CompletionScreenBase from "./CompletionScreenBase";
import ActivityCompletion from "./ActivityCompletion";
import TaskCompletion from "./TaskCompletion";
import QuizCompletion from "./QuizCompletion";
import CompletionScreenStyles from "./CompletionScreenStyles";
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get('window');

export default CompletionScreen = ({ route }) => {
  const type = route.params?.type || "activity";
  const { theme } = useTheme();
  const styles = CompletionScreenStyles(theme);
  const { userData, loading, setLoading, courseId, activityId, setActivityId, updateUserData } = useUser();
  const [courseData, setCourseData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const navigation = useNavigation();
  const confettiRef = useRef(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Reusable function to fetch document data
  const fetchDocumentData = useCallback(async (path) => {
    const docRef = doc(db, ...path);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }, []);

  useEffect(() => {
    const fetchCourseAndActivityData = async () => {
      setLoading(true);
      try {
        if (courseId) {
          const course = await fetchDocumentData(["courses", courseId]);
          const activitesRef = collection(db, "courses", courseId, "activities");
          const activitesSnapshot = await getDocs(activitesRef);
          const activitesData = activitesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          const activity = activitesData.find((act) => act.id === activityId);
          course["activities"] = activitesData;
          setCourseData(course);

          if (activity) {
            setActivityData(activity);
            const taskCardsRef = collection(db, "courses", courseId, "activities", activityId, "task_cards");
            const taskCardsSnapshot = await getDocs(taskCardsRef);
            const taskCardsData = taskCardsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            activity["task_cards"] = taskCardsData;

            const quizQuestionsRef = collection(db, "courses", courseId, "activities", activityId, "quiz_questions");
            const quizQuestionsSnapshot = await getDocs(quizQuestionsRef);
            const quizQuestionsData = quizQuestionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            activity["quiz_questions"] = quizQuestionsData;
            setActivityData(activity);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndActivityData();
  }, [courseId, activityId, fetchDocumentData, type]);

  // Trigger confetti animation when the component loads and data is fetched
  useEffect(() => {
    if (!loading && courseData) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      // Schedule completion notification
      let itemName = "";
      if (type === "activity") {
        itemName = courseData.title || "Activity";
      } else if (type === "task") {
        itemName = activityData.task_title || "Task";
      } else if (type === "quiz") {
        itemName = activityData.quiz_title || "Quiz";
      }
      scheduleCompletionNotification(type, itemName);
    }
  }, [loading, courseData]);

  const scheduleCompletionNotification = async (itemType, itemName) => {
    await Notifications.scheduleNotificationAsync({
      identifier: `completion-${courseId}-${activityId}-${Date.now()}`, // Unique identifier
      content: {
        title: "Congratulations!",
        body: `You've successfully completed the ${itemType}: "${itemName}"! 🎉`,
        sound: 'default',
        data: { courseId: courseId, activityId: activityId },
      },
      trigger: null, // Trigger immediately
    });
    console.log(`Completion notification scheduled for ${itemType}: ${itemName}`);
  };

  const handleTakeQuiz = () => {
    navigation.navigate("Quiz", { courseId: courseId, activityId: activityId });
  };

  // Reusable function to update course and activity status on completion
  const markActivityAsComplete = useCallback(async (nextScreen) => {
    if (courseId && activityId) {
      setLoading(true);
      try {
        const activityRef = doc(db, "courses", courseId, "activities", activityId);
        const courseRef = doc(db, "courses", courseId);

        // Get the current activity data to access its index
        const currentActivitySnap = await getDoc(activityRef);
        const currentActivityData = currentActivitySnap.data();

        await updateDoc(activityRef, {
          [`${type}_status`]: "completed",
          status: "completed",
          updated_at: Timestamp.fromDate(new Date()),
        });
        await updateDoc(courseRef, {
          completed_activies: (courseData?.completed_activies || 0) + 1,
        });

        updateUserData({ points: userData.points + 10 });

        // Find the next activity
        if (currentActivityData?.index !== undefined) {
          const nextIndex = currentActivityData.index + 1;
          const activitiesRef = collection(db, "courses", courseId, "activities");
          const nextActivityQuery = query(activitiesRef, where("index", "==", nextIndex));
          const nextActivitySnapshot = await getDocs(nextActivityQuery);

          if (!nextActivitySnapshot.empty) {
            const nextActivityDoc = nextActivitySnapshot.docs[0];
            const nextActivityId = nextActivityDoc.id;
            const nextActivityRef = doc(db, "courses", courseId, "activities", nextActivityId);

            // Set the next activity's status to in_progress
            await updateDoc(nextActivityRef, {
              status: "in_progress",
              task_status: "in_progress",
              updated_at: Timestamp.fromDate(new Date()),
            });

            // Set activityId in user context
            setActivityId(nextActivityId);
          } else {
            // If no next activity, mark course as completed
            await updateDoc(courseRef, {
              completed_activies: (courseData?.completed_activies || 0) + 1,
              status: "completed",
              updated_at: Timestamp.fromDate(new Date()),
            });
            
            updateUserData({ points: userData.points + 30 });

            // Create certificate
            await addDoc(collection(db, "certificates"), {
              course_id: courseId,
              user_id: userData.id,
              username: userData.username,
              title: courseData.title,
              issued_at: Timestamp.fromDate(new Date()),
            });
          }
        }

        navigation.navigate("CompletionScreen", { type: "activity" });
      } catch (error) {
        console.error(`Error marking ${type} complete:`, error);
      } finally {
        setLoading(false);
      }
    }
  }, [courseId, activityId, courseData, navigation, type, setLoading, setActivityId]);

  const handleMarkComplete = async () => {
    await markActivityAsComplete("CourseTimeline");
  };

  const handleNextActivity = async () => {
    navigation.navigate("CourseTimeline");
  };

  const handleClose = () => {
    navigation.navigate("CourseTimeline");
  };

  if (!loading && (!courseData || (type !== "activity" && !activityData))) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Could not load completion data.</Text>
        <Button title="Close" onPress={handleClose} />
      </View>
    );
  }

  const renderCompletionContent = () => {
    switch (type) {
      case "activity":
        return <ActivityCompletion theme={theme} styles={styles} courseData={courseData} />
      case "task":
        return <TaskCompletion theme={theme} styles={styles} activityData={activityData} />
      case "quiz":
        return <QuizCompletion theme={theme} styles={styles} activityData={activityData} />
      default:
        return null;
    }
  };

  const renderBottomButtons = () => {
    switch (type) {
      case "activity":
        return courseData?.status !== "completed" ?
          <Button title="Next Activity" onPress={handleNextActivity} style={styles.bottomButton}/> : <></>;
      case "task":
        return <Button title="Take a Quiz" onPress={handleTakeQuiz} style={styles.bottomButton} />
      case "quiz":
        return <Button title="Mark Activity Complete"  onPress={handleMarkComplete} style={styles.bottomButton} />
      default:
        return null;
    }
  };

  return (
    <>
      {!loading && <CompletionScreenBase
        theme={theme}
        styles={styles}
        onClose={handleClose}
        bottomButtons={renderBottomButtons()}
      >
        {renderCompletionContent()}
      </CompletionScreenBase>}
      {!loading && showConfetti && (
        <View style={confettiStyles.confettiContainer}>
          <ConfettiCannon
            count={200}
            origin={{ x: width / 2, y: -50 }}
            autoStart={true}
            ref={confettiRef}
            fadeOut={true}
            fallSpeed={2000}
          />
        </View>
      )}
    </>
  );
};

const confettiStyles = StyleSheet.create({
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
});