import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../contexts/ThemeProvider";
import Button from "../components/Button";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import CircularProgressBar from "../components/CircularProgressBar";
import {
  MaterialCommunityIcons,
  SimpleLineIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
} from "firebase/firestore";
import { useUser } from "../contexts/UserContext";
import * as Animatable from "react-native-animatable";

// Helper function to calculate progress
const calculateProgress = (completed, total) => {
  const totalActivities = total || 1;
  const completedActivities = completed || 0;
  const progress =
    totalActivities > 0 ? completedActivities / totalActivities : 0;
  return Math.round(progress * 100);
};

const HomeScreen = () => {
  const { theme } = useTheme();
  const { userData, loading, updateUserData } = useUser();
  const [currentCourseProgress, setCurrentCourseProgress] = useState(0);
  const [courses, setCourses] = useState([]);
  const [currentCourseName, setCurrentCourseName] = useState("Loading...");
  const [fetchingCourses, setFetchingCourses] = useState(true);
  const styles = themedStyles(theme);
  const navigation = useNavigation();

  // Data Fetching Effect
  useEffect(() => {
    if (loading) {
      setFetchingCourses(true);
      return;
    }
    if (!userData || !userData.id) {
      setCourses([]);
      setCurrentCourseName("No Active Course");
      setCurrentCourseProgress(0);
      setFetchingCourses(false);
      return;
    }

    setFetchingCourses(true);
    const fetchCoursesAndCurrent = async () => {
      let fetchedCoursesList = [];
      let currentCourseInfo = {
        name: "No Active Course",
        progress: 0,
      };

      try {
        // Fetch all courses for the user
        const coursesRef = collection(db, "courses");
        const coursesQuery = query(
          coursesRef,
          where("user_id", "==", userData.id)
        );
        const coursesSnapshot = await getDocs(coursesQuery);

        // Process each course to get total activities and calculate progress
        const coursePromises = coursesSnapshot.docs
          .filter((doc) => doc !== null)
          .map(async (courseDoc) => {
            const courseData = courseDoc.data();
            const courseDocRef = doc(db, "courses", courseDoc.id);
            const activitiesCollectionRef = collection(
              courseDocRef,
              "activities"
            );
            const activitiesSnapshot = await getDocs(activitiesCollectionRef);
            const totalActivities = activitiesSnapshot.docs.length;
            const progress = calculateProgress(
              courseData.completed_activies,
              totalActivities
            );

            return {
              id: courseDoc.id,
              ...courseData,
              totalActivities: totalActivities,
              progressPercent: progress,
            };
          });

        fetchedCoursesList = await Promise.all(coursePromises);
        setCourses(fetchedCoursesList);

        // Find and process the current course
        if (userData.current_course_id) {
          const currentCourseData = fetchedCoursesList.find(
            (c) => c.id === userData.current_course_id
          );

          if (currentCourseData) {
            console.log("Current course data:", currentCourseData);
            currentCourseInfo = {
              name: currentCourseData.title || "Unnamed Course",
              progress: currentCourseData.progressPercent,
            };
          } else {
            // Fallback if current_course_id points to a non-existent/unfetched course
            console.warn(`Current course document not found in user's list.`);
            const courseDocRef = doc(db, "courses", userData.current_course_id);
            const courseDocSnap = await getDoc(courseDocRef);
            if (courseDocSnap.exists()) {
              const directData = courseDocSnap.data();
              const activitiesCollectionRef = collection(
                courseDocRef,
                "activities"
              );
              const activitiesSnapshot = await getDocs(activitiesCollectionRef);
              const totalActivities = activitiesSnapshot.docs.length;
              currentCourseInfo = {
                name: directData.title || "Unnamed Course",
                progress: calculateProgress(
                  directData.completed_activies,
                  totalActivities
                ),
              };
            } else {
              currentCourseInfo = {
                name: "Course Not Found",
                progress: 0,
              };
            }
          }
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
        currentCourseInfo = {
          name: "Error Loading",
          progress: 0,
        };
      } finally {
        setCurrentCourseName(currentCourseInfo.name);
        setCurrentCourseProgress(currentCourseInfo.progress);
        setFetchingCourses(false);
      }
    };

    fetchCoursesAndCurrent();
  }, [loading, userData?.id, userData?.current_course_id]);

  const gotoCourseTimeline = (courseId) => {
    if (!courseId) return;
    updateUserData({ current_course_id: courseId });
    navigation.navigate("CourseTimeline", { courseId: courseId });
  };

  const continueCurrentCourse = () => {
    if (userData?.current_course_id) {
      gotoCourseTimeline(userData.current_course_id);
    } else {
      navigation.navigate("NewCourseScreen");
    }
  };

  // Render Functions
  const renderSkillItem = ({ item, index }) => {
    return (
      <Animatable.View
        animation="fadeInUp"
        duration={500}
        delay={index * 100}
        useNativeDriver={true}
      >
        <Card
          style={styles.skillCard}
          onPress={() => gotoCourseTimeline(item.id)}
        >
          <View style={styles.skillCardHeader}>
            <Ionicons
              name="book-outline"
              size={22}
              color={theme.primary}
              style={styles.skillIcon}
            />
            <View style={styles.skillInfo}>
              <Text style={styles.skillName} numberOfLines={1}>
                {item.title || "Unnamed Course"}
              </Text>
              <Text style={styles.skillProgressText}>
                {item.progressPercent}% done ({item.completed_activies || 0}/
                {item.totalActivities || 0} activities)
              </Text>
            </View>
          </View>
          <ProgressBar progress={item.progressPercent} />
        </Card>
      </Animatable.View>
    );
  };

  //  Loading State
  if (loading || fetchingCourses) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading your learning journey...</Text>
      </View>
    );
  }

  //  Empty State
  if (!loading && !fetchingCourses && courses.length === 0) {
    return (
      <View style={styles.container}>
        {/* Static Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Learning</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="school-outline"
            size={80}
            color={theme.textMuted}
            style={styles.emptyIcon}
          />
          <Text style={styles.noCoursesTitle}>Ready to Learn?</Text>
          <Text style={styles.noCoursesSubtitle}>
            Start a new skill to begin your journey.
          </Text>
          <View style={styles.emptyButtonContainer}>
            <Button
              title="Start New Skill +"
              onPress={() => {
                navigation.navigate("NewCourseScreen");
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  // Main Content
  return (
    <View style={styles.container}>
      {/* Static Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Learning</Text>
      </View>

      <FlatList
        data={courses.filter((c) => c.id !== userData?.current_course_id)} // Excluding current course from list
        renderItem={renderSkillItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          // Current Course Card & Stats
          <Animatable.View animation="fadeInDown" duration={600}>
            {userData?.current_course_id && (
              <Card style={styles.currentCourseCard}>
                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <SimpleLineIcons
                      name="fire"
                      size={20}
                      color={theme.secondary}
                      style={styles.statIcon}
                    />

                    <Text style={styles.statText}>
                      {userData?.learning_streak || 0} Day Streak
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="progress-clock"
                      size={22}
                      color={theme.secondary}
                      style={styles.statIcon}
                    />
                    <Text style={styles.statText}>
                      {courses.length} Active Course
                      {courses.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Current Course Info */}
                <View style={styles.currentCourseSection}>
                  <View style={styles.currentCourseTextContainer}>
                    <Text style={styles.currentCourseLabel}>
                      Currently Learning
                    </Text>
                    <Text style={styles.currentCourseTitle} numberOfLines={2}>
                      {currentCourseName}
                    </Text>
                  </View>
                  <CircularProgressBar
                    radius={35}
                    strokeWidth={6}
                    progress={currentCourseProgress}
                    duration={500}
                    strokeColor={theme.primary}
                    backgroundColor={theme.background}
                    color={theme.primaryLight}
                  />
                </View>

                {/* Continue Button */}
                <Button
                  title="Continue Learning"
                  onPress={continueCurrentCourse}
                  style={styles.continueButton}
                />
              </Card>
            )}

            {/* Title for the list */}
            <Text style={styles.skillsInProgressText}>
              {userData?.current_course_id ? "Other Courses" : "Your Courses"}
            </Text>
          </Animatable.View>
        }
        contentContainerStyle={styles.flatListContent}
      />

      <View style={styles.stickyButtonContainer}>
        <Button
          title="Start New Skill +"
          onPress={() => {
            navigation.navigate("NewCourseScreen");
          }}
        />
      </View>
    </View>
  );
};

// Styles
const themedStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 15,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      backgroundColor: theme.backgroundAlt,
    },
    headerTitle: {
      fontSize: 28,
      color: theme.heading,
      fontFamily: "Quicksand_700Bold",
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.textMuted,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyIcon: {
      marginBottom: 20,
    },
    noCoursesTitle: {
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
      color: theme.heading,
      marginBottom: 8,
    },
    noCoursesSubtitle: {
      fontSize: 16,
      textAlign: "center",
      color: theme.textMuted,
      marginBottom: 30,
    },
    emptyButtonContainer: {
      width: "80%",
    },
    currentCourseCard: {
      marginTop: 20,
      marginBottom: 10,
      padding: 15,
      backgroundColor: theme.backgroundAlt,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 5,
    },
    statIcon: {
      marginRight: 6,
    },
    statText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: "500",
    },
    divider: {
      height: 1,
      backgroundColor: theme.borderLight,
      marginVertical: 12,
    },
    currentCourseSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    currentCourseTextContainer: {
      flex: 1,
      marginRight: 15,
    },
    currentCourseLabel: {
      fontSize: 13,
      color: theme.textMuted,
      marginBottom: 3,
    },
    currentCourseTitle: {
      fontSize: 19,
      fontWeight: "bold",
      color: theme.primary,
      fontFamily: "Quicksand_600SemiBold",
    },
    continueButton: {
      marginTop: 5,
    },
    skillsInProgressText: {
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 15,
      marginBottom: 10,
      color: theme.heading,
      fontFamily: "Quicksand_600SemiBold",
    },
    flatListContent: {
      paddingHorizontal: 15,
      paddingBottom: 100,
    },
    skillCard: {
      marginBottom: 12,
      padding: 15,
      backgroundColor: theme.backgroundCard,
    },
    skillCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    skillIcon: {
      marginRight: 12,
    },
    skillInfo: {
      flex: 1,
    },
    skillName: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.primary,
    },
    skillProgressText: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 3,
    },
    stickyButtonContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingVertical: 15,
      paddingBottom: 25,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
      backgroundColor: theme.backgroundAlt,
    },
  });

export default HomeScreen;
