import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  interpolate,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularProgressBar = ({
  radius = 100,
  strokeWidth = 10,
  fontSize = 16,
  progress = 0,
  duration = 1000,
  strokeColor = "#007bff",
  color = "#e6e6e6",
}) => {
  const circumference = 2 * Math.PI * radius;
  const progressValue = useSharedValue(0);

  React.useEffect(() => {
    // Animate the progress value when the progress prop changes
    progressValue.value = withTiming(progress, { duration });
  }, [progress, duration]);

  const animatedProps = useAnimatedProps(() => {
    // Interpolate the strokeDashoffset based on the progress value
    const strokeDashoffset = interpolate(
      progressValue.value,
      [0, 100],
      [circumference, 0]
    );
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={radius * 2} height={radius * 2}>
        <G rotation="-90" origin={`${radius}, ${radius}`}>
          {/* Background Circle */}
          <Circle
            cx={radius}
            cy={radius}
            r={radius - strokeWidth / 2}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <AnimatedCircle
            cx={radius}
            cy={radius}
            r={radius - strokeWidth / 2}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </G>
        {/* Progress Text */}
        <SvgText
          x={radius}
          y={radius + 2}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontFamily="Quicksand_400Regular"
          fontSize={fontSize}
          fill={strokeColor}
        >
          {`${Math.round(progress)}%`}
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CircularProgressBar;
