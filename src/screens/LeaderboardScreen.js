import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../contexts/ThemeProvider";
import { useUser } from "../contexts/UserContext";
import { db } from "../../firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const LeaderboardScreen = () => {
  const { theme } = useTheme();
  const { userData } = useUser();
  const styles = themedStyles(theme);

  // State variables
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetching leaderboard data when the component mounts
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetching leaderboard data from Firestore
        const usersRef = collection(db, "users");

        const usersQuery = query(
          usersRef,
          orderBy("points", "desc"),
          limit(50)
        );
        const querySnapshot = await getDocs(usersQuery);

        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "Anonymous",
          username: doc.data().username || "N/A",
          photoURL: doc.data().photoURL || null,
          points: doc.data().points || 0,
        }));

        setLeaderboardData(usersList);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to load leaderboard. Please try after some time.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Function to render each leaderboard item
  const renderLeaderboardItem = ({ item, index }) => {
    const rank = index + 1;
    const isCurrentUser = item.id === userData?.id;

    // Special styling for top 3 and current user
    const itemStyle = [
      styles.itemContainer,
      isCurrentUser && styles.currentUserItem, // Highlighting current user
      rank === 1 && styles.top1Item, // Gold for 1st
      rank === 2 && styles.top2Item, // Silver for 2nd
      rank === 3 && styles.top3Item, // Bronze for 3rd
    ];

    const rankColor =
      rank === 1
        ? "#FFD700" // Gold
        : rank === 2
        ? "#C0C0C0" // Silver
        : rank === 3
        ? "#CD7F32" // Bronze
        : theme.textLight;

    return (
      <View style={itemStyle}>
        {/* Rank */}
        <Text style={[styles.rank, { color: rankColor }]}>{rank}</Text>

        {/* Profile Image */}
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImagePlaceholderText}>
              {item.name.charAt(0)}
            </Text>
          </View>
        )}

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name} {isCurrentUser && "(You)"}
          </Text>
          <Text style={styles.userPoints}>
            {item.points === 1 ? "1 point" : `${item.points} points`}
          </Text>
        </View>

        {/* Medal Icons */}
        {rank === 1 && (
          <MaterialCommunityIcons
            name="medal"
            size={24}
            color="#FFD700"
            style={styles.medalIcon}
          />
        )}
        {rank === 2 && (
          <MaterialCommunityIcons
            name="medal"
            size={24}
            color="#C0C0C0"
            style={styles.medalIcon}
          />
        )}
        {rank === 3 && (
          <MaterialCommunityIcons
            name="medal"
            size={24}
            color="#CD7F32"
            style={styles.medalIcon}
          />
        )}
      </View>
    );
  };

  // Main component
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>

      {/* Loader, Error, and Empty State */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={styles.loader}
        />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : leaderboardData.length === 0 ? (
        <Text style={styles.emptyText}>
          The leaderboard is empty. Start learning to climb the ranks!
        </Text>
      ) : (
        <FlatList
          data={leaderboardData}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </View>
  );
};

// Styles
const themedStyles = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 0,
      margin: 0,
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
    headerIcon: {
      marginRight: 10,
      fontWeight: "bold",
    },
    headerTitle: {
      fontSize: 28,
      color: theme.heading,
      fontFamily: "Quicksand_700Bold",
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      flex: 1,
      textAlign: "center",
      marginTop: 50,
      fontSize: 16,
      color: theme.error,
    },
    emptyText: {
      flex: 1,
      textAlign: "center",
      marginTop: 50,
      fontSize: 16,
      color: theme.textMuted,
    },
    listContentContainer: {
      paddingVertical: 15,
      paddingHorizontal: 15,
    },
    itemContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.cardBackground,
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    currentUserItem: {
      borderColor: theme.primary,
      borderWidth: 1.5,
      backgroundColor: theme.primaryLight,
    },
    rank: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.textMuted,
      width: 30,
      textAlign: "center",
      marginRight: 15,
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
    },
    profileImagePlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.primaryLight,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    profileImagePlaceholderText: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.primary,
    },
    userInfo: {
      flex: 1,
      justifyContent: "center",
    },
    userName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 3,
    },
    userPoints: {
      fontSize: 14,
      color: theme.primary,
    },
    medalIcon: {
      marginLeft: 10,
    },
  });
};

export default LeaderboardScreen;
