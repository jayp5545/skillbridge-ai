import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_UPLOAD_PRESET;

export const pickImageFromGallery = async () => {
  // Requesting permission to access media library
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission required",
      "Media library permissions are required to pick an image."
    );
    throw new Error("Media library permission not granted");
  }
  // Launching image picker to select an image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }
  return result.assets[0].uri;
};

export const uploadImageToCloudinary = async (uri) => {
  if (!uri) {
    throw new Error("No image URI provided");
  }
  // Extracting file name and type from the URI
  const fileName = uri.split("/").pop();
  const match = /\.(\w+)$/.exec(fileName);
  const fileType = match ? `image/${match[1]}` : "image";

  const formData = new FormData();
  formData.append("file", {
    uri,
    type: fileType,
    name: fileName,
  });
  formData.append("upload_preset", UPLOAD_PRESET);

  // Cloudinary upload URL
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
      "Content-Type": "multipart/form-data",
    },
  });

  if (!response.ok) {
    // Handle error response
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }
  // Parse the response
  const result = await response.json();
  if (result.secure_url) {
    return result.secure_url;
  }
  throw new Error("No secure_url returned from Cloudinary");
};


export const updateProfilePhoto = async (updateProfileCallback) => {
  // Function to update the profile photo
  try {
    const imageUri = await pickImageFromGallery();
    if (!imageUri) {
      // User canceled the pick
      return;
    }
    const secureUrl = await uploadImageToCloudinary(imageUri);
    updateProfileCallback(secureUrl);
    Alert.alert("Success", "Profile photo updated successfully!");
  } catch (error) {
    console.error("Error updating profile photo:", error);
    Alert.alert(
      "Upload Error",
      "There was an error updating your profile photo. Please try again."
    );
  }
};
