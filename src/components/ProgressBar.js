import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme } from "../contexts/ThemeProvider";

const ProgressBar = ({ progress = 0, style }) => {
  const { theme } = useTheme();

  // Animated value to track progress
  const progressRef = useRef(new Animated.Value(progress));

  useEffect(() => {
    // Animate the progress bar when the progress prop changes
    if (progressRef.current) {
      Animated.timing(progressRef.current, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false, // Width animation cannot use native driver
      }).start();
    }
  }, [progress]);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.barContainer]}>
        {/* Animated progress bar */}
        <Animated.View
          style={[
            styles.progressBar,
            {
              // Interpolate width based on the animated progress value
              width: progressRef.current.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: theme.secondary,
            },
          ]}
        />
      </View>

      {/* Display progress percentage */}
      <Text style={[styles.progressText, { color: theme.onSurfaceVariant }]}>
        {`${Math.round(progress)}%`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ProgressBar;
