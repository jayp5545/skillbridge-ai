import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, FlatList } from "react-native";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useUser } from "../../../contexts/UserContext";
import { db } from "../../../../firebase";
import { collection, getDocs, query, orderBy, getDoc, doc } from "firebase/firestore";

import ProgressBar from "../../../components/ProgressBar";
import ActivityItem from "./ActivityItem";

export default CourseTimelineScreen = () => {
  const { theme } = useTheme();
  const { loading, setLoading, courseId } = useUser();
  const [courseData, setCourseData] = useState(null);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Fetch course data on component mount
    const fetchCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("courseId at Timeline:", courseId);
        const courseRef = doc(db, `courses/${courseId}`);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.empty) {
          // Extract course data
          const courseData = courseSnap.data();

          // Fetch activities associated with the course
          const activitiesRef = collection(courseRef, "activities");
          const orderedActivitiesRef = query(activitiesRef, orderBy("start_time"));
          const activitiesSnapshot = await getDocs(orderedActivitiesRef);

          // Map activities snapshot to an array of activity objects
          const activities = activitiesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Format course data with fetched activities
          const formattedCourseData = {
            id: courseSnap.id,
            ...courseData,
            activities: activities,
          };

          setCourseData(formattedCourseData);
        } else {
          setError("No courses found. Please create a new course.");
        }
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Failed to load course data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, []);

  useEffect(() => {
    // Auto scroll to the "in_progress" activity
    if (courseData && courseData.activities) {
      const inProgressIndex = courseData.activities.findIndex(
        (activity) => activity.status === "in_progress"
      );

      if (inProgressIndex !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: inProgressIndex,
          animated: true, // You can set this to false for no animation
          viewOffset: 0, // Optional: Adjust offset from the top
          viewPosition: 0.5, // Optional: Position the item in the middle (0 to 1)
        });
      }
    }
  }, [courseData]);

  // Render activity item in the FlatList
  const renderActivityItem = ({ item, index }) => {
    return (
      <ActivityItem
        item={item}
        index={index}
        activitiesRef={doc(db, `courses/${courseId}/activities/${item.id}`)}
        total={courseData?.activities?.length || 0}
      />
    );
  };

  // Render error message if data fetching fails
  if (error) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      </View>
    );
  }

  // Render course timeline if course data is available
  return (
    !loading && courseData && (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.skillTitle, { color: theme.text }]}>
            {courseData.title}
          </Text>
          <Text style={[styles.progressText, { color: theme.text }]}>
            {courseData.description}
          </Text>
          <ProgressBar
            progress={
              (courseData.completed_activies * 100) /
              (courseData.activities?.length || 1)
            }
            prevProgress={0}
          />
        </View>

        <FlatList
          ref={flatListRef}
          data={courseData.activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          style={styles.timeline}
        />
      </View>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 4,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  skillBridgeTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  skillTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  progressText: {
    fontSize: 14,
    marginTop: 5,
    marginBottom: 10,
  },
  timeline: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
});
