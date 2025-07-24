// src/screens/completion/TaskCompletion.js
import React from "react";
import { View, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

import Card from "../../../components/Card";
import ProgressBar from "../../../components/ProgressBar";

export default TaskCompletion = ({ theme, styles, activityData }) => {
  
  const getProgressPercentage = () => {
    if (!activityData) return 0;
    if (!activityData.quiz_questions || !activityData.task_cards) return 0;
    if (activityData.quiz_questions.length === 0 && activityData.task_cards.length === 0) return 0;
    const completedCount = activityData.completed_questions + activityData.completed_cards;
    const totalCount = activityData.quiz_questions.length + activityData.task_cards.length;
    return (completedCount / totalCount) * 100 || 0;
  };

  return(<View style={styles.contentContainer}>
    <FontAwesome
      name="trophy"
      size={120}
      color={theme.primary}
      style={styles.trophyIcon}
    />
    <Text style={styles.title}>Great Job !</Text>
    <Text style={styles.completionMessage}>You've completed the task!</Text>
    {activityData?.task_title && (
      <Text style={styles.completionMessageTitle}>
        {activityData.task_title}
      </Text>
    )}
    <Card style={styles.progressContainer} title="Activity Progress">
      <ProgressBar progress={getProgressPercentage() || 0} />
      <Text style={styles.progressText}>
        You've completed {activityData?.completed_cards || 0} out of {activityData?.task_cards?.length || 0} cards
      </Text>
    </Card>
  </View>
  );
};
