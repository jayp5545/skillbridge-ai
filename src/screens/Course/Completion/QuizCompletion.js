// src/screens/completion/QuizCompletion.js
import React from "react";
import { View, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

import Card from "../../../components/Card";
import ProgressBar from "../../../components/ProgressBar";

export default QuizCompletion = ({ theme, styles, activityData }) => {

  const getProgressPercentage = () => {
    if (!activityData) return 0;
    if (!activityData.quiz_questions || !activityData.task_cards) return 0;
    if (activityData.quiz_questions.length === 0 && activityData.task_cards.length === 0) return 0;
    const completedCount = activityData.completed_questions + activityData.completed_cards;
    const totalCount = activityData.quiz_questions.length + activityData.task_cards.length;
    return (completedCount / totalCount) * 100 || 0;
  };

  const getScorePercentage = () => {
    if (!activityData) return 0;
    if (!activityData.quiz_score || !activityData.total_score) return 0;
    if (activityData.total_score === 0) return 0;
    if (activityData.quiz_score > activityData.total_score) return 100;
    return Math.round((activityData.quiz_score / activityData.total_score) * 100) || 0;
  }

  return (
    <View style={styles.contentContainer}>
      <FontAwesome
        name="trophy"
        size={120}
        color={theme.primary}
        style={styles.trophyIcon}
      />
      <Text style={styles.title}>Great Job !</Text>
      <Text style={styles.completionMessage}>You've completed the quiz!</Text>
      {activityData?.quiz_title && (
        <Text style={styles.completionMessageTitle}>
          {activityData.quiz_title}
        </Text>
      )}
      <Card style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Your Score</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{getScorePercentage()}%</Text>
        </View>
        <Text style={styles.progressText}>
          You answered {activityData.quiz_score} out of {activityData.total_score} questions correctly
        </Text>
      </Card>
      <Card style={styles.progressContainer} title="Activity Progress">
        <ProgressBar progress={getProgressPercentage()} />
      </Card>
    </View>
  );
} 
