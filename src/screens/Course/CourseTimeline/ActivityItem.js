import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Timestamp } from "firebase/firestore";
import { MaterialIcons, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../contexts/ThemeProvider";
import ActivityCard from "./ActivityCard";
import Button from "../../../components/Button";

export default ActivityItem = ({ item, index, total, activitiesRef }) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // Function to format timestamp to a readable date and time
  const formatTimestamp = (timestamp) => {
    if (!timestamp || !(timestamp instanceof Timestamp)) {
      return "Invalid Date";
    }

    const date = timestamp.toDate();

    const formattedDateTime = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);

    return formattedDateTime;
  };



  const getStatusStyles = (status) => {
    switch (status) {
      case "pending":
        return { color: theme.outline, logo: <FontAwesome5 name="lock" size={12} color="#ffffff" /> };
      case "in_progress":
        return { color: theme.primary, logo: <FontAwesome name="dot-circle-o" size={18} color="#ffffff" /> };
      case "completed":
        return { color: theme.primary, logo: <MaterialIcons name="done" size={15} color="#ffffff" /> };
      default:
        return { color: theme.outline, logo: <FontAwesome name="dot-circle-o" size={18} color="#ffffff" /> };
    }
  };

  const { color: statusColor, logo: statusLogo } = getStatusStyles(item.status);

  return (
    <View style={[styles.activityItemContainer, {
      paddingBottom: isLast ? 20 : 0,
    }]}>
      <View
        style={[
          styles.timelineLine,
          {
            backgroundColor: statusColor,
            top: isFirst ? 20 : 0,
            bottom: isLast ? 20 : 0,
            borderRadius: isLast ? 12 : 0
          },
        ]}
      />
      <View style={[styles.timelineDot, { backgroundColor: statusColor }]}>
        {statusLogo}
      </View>
      <View style={styles.activityCardContainer}>
        <Text style={[styles.activityDate, { color: theme.text }]}>
          {" "}
          {formatTimestamp(item.start_time)}{" "}
        </Text>
        <View style={styles.activityCards}>
          {item.task_title && (
            <ActivityCard
              type="task"
              activity={item}
              activitiesRef={activitiesRef}
            />
          )}
          {item.quiz_title && (
            <ActivityCard
              type="quiz"
              activity={item}
              activitiesRef={activitiesRef}
            />
          )}
        </View>
        {item.task_status === "completed" &&
        item.quiz_status === "completed" &&
        item.status !== "completed" &&
        <Button
          title="Complete Activity"
          onPress={() => { navigation.navigate("CompletionScreen", { type: "quiz" }) }}
          style={[
            styles.button,
          ]}
        />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activityItemContainer: {
    flexDirection: "row",
    paddingBottom: 8,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    top: 0,
    bottom: -5,
    left: 6,
    width: 4,
  },
  timelineDot: {
    width: 25,
    height: 25,
    borderRadius: 25,
    marginRight: 8,
    zIndex: 1,
    top: 0,
    left: -4,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineDotLogo: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  activityCardContainer: {
    flex: 1,
  },
  activityDate: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  activityCards: {
    gap: 15,
  },
  button: {
    marginVertical: 10,
  },
});
