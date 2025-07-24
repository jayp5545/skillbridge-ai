import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useTheme } from "../contexts/ThemeProvider";
import { useUser } from "../contexts/UserContext";
import Card from "../components/Card";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import CertificateModal from "../components/CertificateModal";
import { downloadCertificate } from "../services/certificateService";

// Getting screen width for modal
const { width } = Dimensions.get("window");

const CertificatesScreen = () => {
  const { theme } = useTheme();
  const { userData } = useUser();
  const styles = themedStyles(theme);

  // State variables
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Fetching certificates when the component mounts or when userData changes
  useEffect(() => {
    if (userData && userData.id) {
      fetchCertificates();
    }
  }, [userData]);

  // Fetching certificates for the current user from Firestore
  const fetchCertificates = async () => {
    try {
      const certificatesRef = collection(db, "certificates");
      const certificatesQuery = query(
        certificatesRef,
        where("user_id", "==", userData.id)
      );
      const certificatesSnapshot = await getDocs(certificatesQuery);
      const certificatesData = [];
      let courseTitle = "Unnamed Course";
      console.log("Certificates fetched:", certificatesSnapshot.docs.length);
      console.log(certificatesSnapshot.docs.length);

      // Looping through each certificate document found
      for (const certDoc of certificatesSnapshot.docs) {
        const certificate = certDoc.data();
        // Fetching associated course details
        const courseDocRef = doc(db, "courses", certificate.course_id);
        const courseDocSnap = await getDoc(courseDocRef);
        if (courseDocSnap.exists()) {
          courseTitle = courseDocSnap.data()?.title;
        } else {
          console.warn(
            `Course document not found for course_id: ${certificate.course_id}`
          );
        }
        // Adding the certificate data 
        certificatesData.push({
          id: certDoc.id,
          ...certificate,
          courseTitle,
        });
      }
      setCertificates(certificatesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setLoading(false);
    }
  };

  // Function to render each certificate item in the list
  const renderCertificateItem = ({ item }) => (
    // Card component to display certificate details
    <Card style={styles.certificateCard}>
      <TouchableOpacity
        activeOpacity={0.7} // Opacity effect on press
        onPress={() => {
          setSelectedCertificate(item);
          setModalVisible(true);
        }}
      >
        {/* Header with share button and course title */}
        <View style={styles.certificateHeader}>
          <MaterialIcons
            name="workspace-premium"
            size={32}
            color={theme.primary}
          />
          {/* Share button */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => downloadCertificate(item, userData)}
          >
            <Ionicons name="share-outline" size={24} color={theme.textLight} />
          </TouchableOpacity>
        </View>

        <Text style={styles.courseTitle}>{item.courseTitle}</Text>

        {/* Footer section of the certificate card */}
        <View style={styles.certificateFooter}>
          <View style={styles.verifyBadge}>
            <MaterialIcons name="verified" size={16} color={theme.primary} />
            <Text style={styles.verifyText}>Verified Certificate</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  // If data is still loading, display an ActivityIndicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading certificates...</Text>
      </View>
    );
  }

  // Main component 
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Certificates</Text>
      </View>
      {certificates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="emoji-events"
            size={64}
            color={theme.textLight}
          />
          <Text style={styles.emptyTitle}>No Certificates Yet</Text>
          <Text style={styles.emptyText}>
            Complete courses to earn certificates and showcase your
            achievements!
          </Text>
        </View>
      ) : (
        // FlatList to display the list of certificates
        <FlatList
          data={certificates}
          renderItem={renderCertificateItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal to display certificate details */}
      <CertificateModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedCertificate={selectedCertificate}
        userData={userData}
        onShare={() => downloadCertificate(selectedCertificate, userData)}
        theme={theme}
        styles={styles}
      />
    </View>
  );
};

// Styles for the component
const themedStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      backgroundColor: theme.backgroundAlt,
    },
    title: {
      fontSize: 28,
      fontWeight: "600",
      color: theme.heading,
      marginBottom: 20,
      fontFamily: "Quicksand_700Bold",
    },
    listContainer: {
      paddingBottom: 20,
      paddingHorizontal:10,
      marginTop: 10,
      gap: 15,
    },
    certificateCard: {
      padding: 20,
      
    },
    certificateHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
      width: "100%",
    },
    shareButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.cardBackground,
    },
    courseTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    certificateFooter: {
      flexDirection: "row",
      alignItems: "center",
    },
    verifyBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primaryLight + "20",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
    },
    verifyText: {
      marginLeft: 6,
      fontSize: 12,
      color: theme.primary,
      fontWeight: "500",
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: width * 0.9,
      backgroundColor: theme.cardBackground,
      borderRadius: 20,
      padding: 20,
    },
    certificateContainer: {
      alignItems: "center",
      marginHorizontal: 0,
    },
    certificateTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.heading,
      // marginBottom: 30,
    },
    closeButton: {
      position: "absolute",
      right: 0,
      top: -3,
      padding: 8,
    },
    certificateBody: {
      alignItems: "center",
      paddingVertical: 30,
    },
    certifiedText: {
      fontSize: 16,
      color: theme.textLight,
      marginTop: 20,
    },
    userName: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.heading,
      marginVertical: 10,
    },
    completionText: {
      fontSize: 16,
      color: theme.textLight,
    },
    courseName: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.primary,
      marginVertical: 10,
      textAlign: "center",
    },
    issuedByText: {
      fontSize: 16,
      color: theme.text,
      marginTop: 20,
    },
    dateText: {
      fontSize: 14,
      color: theme.textLight,
      marginTop: 5,
    },
    shareButtonLarge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      marginTop: 20,
    },
    shareButtonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "600",
      marginRight: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.text,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
      paddingTop: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.heading,
      marginTop: 20,
      marginBottom: 10,
    },
    emptyText: {
      fontSize: 16,
      color: theme.textLight,
      textAlign: "center",
      lineHeight: 24,
    },
  });

export default CertificatesScreen;
