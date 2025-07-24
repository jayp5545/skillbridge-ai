import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

const CertificateModal = ({
  visible,
  onClose,
  selectedCertificate,
  userData,
  onShare,
  theme,
  styles,
}) => {
  if (!selectedCertificate) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.certificateContainer}>
            {/* Header section of the certificate modal */}
            <View style={styles.certificateHeader}>
              <Text style={styles.certificateTitle}>Certificate</Text>
              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={theme.textLight} />
              </TouchableOpacity>
            </View>
            {/* Body section of the certificate */}
            <View style={styles.certificateBody}>
              <MaterialIcons
                name="workspace-premium"
                size={64}
                color={theme.primary}
              />
              <Text style={styles.certifiedText}>This certifies that</Text>
              <Text style={styles.userName}>{userData.fullName}</Text>
              <Text style={styles.completionText}>
                has successfully completed the course
              </Text>
              <Text style={styles.courseName}>
                {selectedCertificate?.courseTitle}
              </Text>
              <Text style={styles.issuedByText}>Issued by SkillBridge AI</Text>
              <Text style={styles.dateText}>
                {format(
                  selectedCertificate.issued_at.toDate(),
                  "MMMM dd, yyyy"
                )}
              </Text>
            </View>
            {/* Share button at the bottom of the modal */}
            <TouchableOpacity
              style={styles.shareButtonLarge}
              onPress={onShare}
            >
              <Text style={styles.shareButtonText}>Share Certificate</Text>
              <Ionicons name="share-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CertificateModal;
