import React, { useState } from "react";
import { View, Image, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import Button from "./Button";
import {pickImageFromGallery,uploadImageToCloudinary,updateProfilePhoto} from "../services/cloudinaryService";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_UPLOAD_PRESET;

const ImageUploader = ({ onImageUploaded = () => {} }) => {
  // State variables for image URI and upload status
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Function to request camera and media library permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await Camera.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    // Alert user if permissions are not granted
    if (cameraStatus !== "granted" || libraryStatus !== "granted") {
      Alert.alert(
        "Permission required",
        "Camera and media library permissions are required to use this feature."
      );
      return false;
    }
    return true;
  };

  // Function to take a photo using the camera
  const takePhoto = async () => {
    if (!(await requestPermissions())) return; // Check for permissions

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImage(uri);
        await uploadToCloudinary(uri); // Upload the captured image
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
      console.error(error);
    }
  };

  // Function to pick an image from the device's library
  const pickImage = async () => {
    if (!(await requestPermissions())) return; // Check for permissions

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImage(uri);
        await uploadToCloudinary(uri); // Upload the selected image
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error(error);
    }
  };

  const pickImageCloudinaryService = async () => {
    try {
      setUploading(true);
      const imageUri = await pickImageFromGallery();
      if (imageUri) {
        setImage(imageUri);
        const secureUrl = await uploadImageToCloudinary(imageUri);
        onImageUploaded(secureUrl);
        Alert.alert("Success", "Image uploaded successfully!");
      }
    } catch (error) {
      console.error("Error in handlePickImage:", error);
      Alert.alert(
        "Upload Error",
        "Failed to pick and upload image. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  // Function to upload the image to Cloudinary
  const uploadToCloudinary = async (uri) => {
    if (!uri) return;
    setUploading(true);

    try {
      // Creating file name and type from URI
      const fileName = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(fileName);
      const fileType = match ? `image/${match[1]}` : "image";

      // Creating form data for the upload
      const formData = new FormData();
      formData.append("file", {
        uri: uri,
        type: fileType,
        name: fileName,
      });
      formData.append("upload_preset", UPLOAD_PRESET);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

      // Sending the upload request
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      // Check for upload success
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(
          `Upload failed: ${uploadResponse.status} - ${errorText}`
        );
      }

      const result = await uploadResponse.json();
      console.log("Upload result:", result);

      // Notify parent component and show success message
      if (result.secure_url) {
        onImageUploaded(result.secure_url);
        Alert.alert("Success", "Image uploaded successfully!");
      } else {
        throw new Error("No secure_url in response");
      }
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      Alert.alert(
        "Upload Error",
        "Failed to upload image to Cloudinary. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Display the selected/captured image */}
      {image && <Image source={{ uri: image }} style={styles.preview} />}
      <View style={styles.buttonContainer}>
        {/* Button to take a photo */}
        <Button
          title="Take Photo"
          onPress={takePhoto}
          loading={uploading}
          disabled={uploading}
          style={styles.button}
        />
        {/* Button to pick an image from the gallery */}
        <Button
          title="Pick from Gallery"
          onPress={pickImageCloudinaryService}
          loading={uploading}
          disabled={uploading}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  preview: {
    width: 300,
    height: 300,
    marginVertical: 20,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default ImageUploader;
