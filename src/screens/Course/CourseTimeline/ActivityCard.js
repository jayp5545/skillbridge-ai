import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../../contexts/ThemeProvider";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { updateDoc } from "firebase/firestore";
import { useUser } from "../../../contexts/UserContext";

export default ActivityCard = ({ activity, type, activitiesRef }) => {
  const { theme } = useTheme();
  const { setActivityId } = useUser();
  const isTask = type === "task";
  const statusKey = isTask ? "task_status" : "quiz_status";
  const isLocked = activity[statusKey] === "pending";
  const isInProgress = activity[statusKey] === "in_progress";
  const isCompleted = activity[statusKey] === "completed";
  const navigation = useNavigation();

  // Function to determine the header text based on activity type
  const getHeaderText = () => {
    return isTask ? "Task" : "Challenge";
  };

  // Function to get the title of the activity
  const getTitle = () => {
    return isTask ? activity.task_title : activity.quiz_title;
  };

  // Function to get the description of the activity
  const getDescription = () => {
    return isTask ? activity.task_description : activity.quiz_description;
  };

  // Function to get the button title based on activity status
  const getButtonTitle = () => {
    if (isLocked) {
      return "Locked";
    } else if (isInProgress) {
      return isTask ? "Continue Task" : "Continue Challenge";
    } else if (isCompleted) {
      return isTask ? "View Task" : "View Challenge";
    } else {
      return isTask ? "Start Task" : "Take Challenge";
    }
  };

  // Function to handle button press, navigates to the activity screen if not locked
  const handleButtonPress = async () => {
    await updateDoc(activitiesRef, { current_activity_id: activity.id });
    setActivityId(activity.id);
    if (!isLocked) {
      navigation.navigate(isTask ? "Task" : "Quiz");
    }
  };

  return (
    <Card
      style={[
        styles.card,
        isLocked && styles.lockedCard,
        isInProgress && styles.inProgressCard,
        isCompleted && styles.completedCard,
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.primaryLight },
          ]}
        >
          {/* Display different icons based on activity type */}
          {isTask ? (
            <FontAwesome5 name="book-open" size={20} color={theme.primary} />
          ) : (
            <MaterialIcons name="quiz" size={20} color={theme.primary} />
          )}
        </View>
        <Text style={[styles.headerText, { color: theme.text }]}>
          {getHeaderText()}
        </Text>
        {/* Display status indicator on the right */}
        {isInProgress && (
          <View style={styles.statusIndicator}>
            <FontAwesome5 name="play-circle" size={16} color={theme.accent} />
            <Text style={[styles.statusText, { color: theme.accent }]}>
              In Progress
            </Text>
          </View>
        )}
        {isCompleted && (
          <View style={styles.statusIndicator}>
            <AntDesign name="checkcircle" size={16} color={theme.success} />
            <Text style={[styles.statusText, { color: theme.success }]}>
              Completed
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
        {getTitle()}
      </Text>

      {isTask && <Text
        style={[styles.description, { color: theme.text }]}
        numberOfLines={2}
      >
        {getDescription()}
      </Text>}

      {!isCompleted && <Button
        title={getButtonTitle()}
        onPress={handleButtonPress}
        disabled={isLocked || isCompleted}
        style={[
          styles.button,
          isCompleted && styles.completedButton,
          isInProgress && styles.inProgressButton,
        ]}
      />}

      {isCompleted && !isTask && (
        <Text style={[styles.description, { color: theme.text }]}>
          {activity.quiz_score} / {activity.total_score} points
        </Text>
      )}

      {/* Overlay for locked activities */}
      {isLocked && (
        <View style={styles.lockOverlay}>
          <FontAwesome5 name="lock" size={20} color={theme.text} />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  lockedCard: {
    opacity: 0.7,
    borderColor: "#ccc",
  },
  lockOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  inProgressCard: {
    borderColor: "#ADD8E6",
    borderWidth: 2,
  },
  completedCard: {
    borderColor: "#a1c9a1",
    borderWidth: 2,
  },
  completedButton: {
    backgroundColor: "#D3D3D3",
  },
  inProgressButton: {
    backgroundColor: "#87CEFA",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
});
