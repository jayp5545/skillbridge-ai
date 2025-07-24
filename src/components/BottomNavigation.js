import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Platform, Animated } from "react-native";
import { useTheme } from "../contexts/ThemeProvider";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

const BottomNavigation = ({ selectedTab: initialSelectedTab, onTabChange }) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState(initialSelectedTab);
  const [indicatorPosition] = useState(new Animated.Value(0));
  const [tabWidths, setTabWidths] = useState([]);

  const tabs = [
    { name: "Home", icon: "home" },
    { name: "LeaderBoard", icon: "leaderboard" },
    { name: "Certificates", icon: "school" },
    { name: "Profile", icon: "person" },
  ];

  useEffect(() => {
    setSelectedTab(initialSelectedTab);
    const selectedIndex = tabs.findIndex((tab) => tab.name === initialSelectedTab);
    if (tabWidths.length > 0 && selectedIndex !== -1) {
      Animated.spring(indicatorPosition, {
        toValue: tabWidths.slice(0, selectedIndex).reduce((sum, width) => sum + width, 0),
        useNativeDriver: true,
        friction: 10,
      }).start();
    }
  }, [initialSelectedTab, tabWidths, tabs, indicatorPosition]);

  const handleTabPress = (tabName, index) => {
    onTabChange(tabName);
    setSelectedTab(tabName);
    navigation.navigate(tabName);

    Animated.spring(indicatorPosition, {
      toValue: tabWidths.slice(0, index).reduce((sum, width) => sum + width, 0),
      useNativeDriver: true,
      friction: 10,
    }).start();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: theme.border || '#ddd',
        }}
      />
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: theme.primary,
            width: tabWidths[tabs.findIndex(tab => tab.name === selectedTab)] || 0,
            transform: [{ translateX: indicatorPosition }],
          },
        ]}
      />
      {tabs.map((tab, index) => (
        <View
          key={index}
          style={styles.tabContainer}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setTabWidths((prevWidths) => {
              const newWidths = [...prevWidths];
              newWidths[index] = width;
              return newWidths;
            });
          }}
        >
          <Pressable
            onPress={() => handleTabPress(tab.name, index)}
            style={[
              styles.tab,
              selectedTab === tab.name && styles.activeTab,
            ]}
          >
            <MaterialIcons
              name={tab.icon}
              size={26}
              color={selectedTab === tab.name ? theme.primary : theme.onSurface}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: selectedTab === tab.name ? theme.primary : theme.onSurface,
                },
                selectedTab === tab.name && styles.activeTabLabel,
              ]}
            >
              {tab.name}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    paddingVertical: 8,
  },
  activeTab: {
    // TODO: add a background color change here if needed
    // backgroundColor: theme.primaryContainer + '10', // 10% opacity
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
  },
  activeTabLabel: {
    fontWeight: "700",
  },
  indicator: {
    height: 2,
    backgroundColor: 'blue',
    position: "absolute",
    bottom: 0,
    left: 0,
  },
});

export default BottomNavigation;