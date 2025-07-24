import React from "react";
import { View, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

import Card from "../../../components/Card";
import ProgressBar from "../../../components/ProgressBar";

export default ActivityCompletion = ({ theme, styles, courseData }) => {

  const getCourseProgressPercentage = () => {
    if (!courseData || !courseData.activities) return 0;
    const totalActivities = courseData.activities.length;
    const completedActivities = courseData.completed_activies || 0;
    return totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
  };

  return (
    <View style={styles.contentContainer}>
      <FontAwesome
        name="trophy"
        size={120}
        color={theme.primary}
        style={styles.trophyIcon}
      />
      <Text style={styles.title}>Great Job !</Text>
      <Text style={[styles.completionMessage, { marginBottom: 20 }]}>
        You've completed this activity!
      </Text>
      <Card style={styles.progressContainer} title="Course Progress">
        <ProgressBar progress={getCourseProgressPercentage()} />
        <Text style={styles.progressText}>You're {getCourseProgressPercentage()}% through this Course</Text>
      </Card>
    </View>
  );
};