import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Image, Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    
    Animated.parallel([
      // Defining a timing animation for the fade effect
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Defining a spring animation for the scaling effect (bouncy)
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]); 

  return (
    // Main container view filling the screen and centering content
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Displaying the logo image */}
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: width * 0.8, 
  },
});

export default SplashScreen;
