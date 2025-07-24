import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import BorderedButton from "../components/BorderedButton";
import { Card, Title, Paragraph, Divider } from "react-native-paper";
import Input from "../components/Input";
import Button from "../components/Button";
import { useTheme } from "../contexts/ThemeProvider";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { app, auth } from "../../firebase";

const firestore = getFirestore();

const AuthScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true); // State to toggle between login and signup
  const [fullName, setFullName] = useState(""); // State for full name input
  const [username, setUsername] = useState(""); // State for username input
  const [email, setEmail] = useState(""); // State for email input
  const [error, setError] = useState(); // State for error messages
  const [password, setPassword] = useState(""); // State for password input

  const handleAuth = async () => {
    if (isLogin) {
      // Handle login logic
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // if(!auth.currentUser.photoURL) {
        //   // Navigate to Profile Picture Setup screen
        //   navigation.navigate("ProfilePictureSetup");
        // }else{
        //   // Navigate to Home screen
        //   navigation.navigate("ProfilePictureSetup");
        // }
        navigation.navigate("ProfileChecker"); // Navigate to profile checker screen after successful login
      } catch (err) {
        setError(err.message); // Set error message if login fails
      }
    } else {
      // Handle signup logic
      if (!fullName || !username || !email || !password) {
        setError("Please fill in all fields."); // Set error if any field is empty
        return;
      }
      try {
        const usersRef = collection(firestore, "users");
        const checkUserName = query(
          usersRef,
          where("username", "==", username)
        );
        const checkEmail = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(checkUserName);
        const emailSnapshot = await getDocs(checkEmail);
        if (!querySnapshot.empty) {
          // there is some user with the same username
          setError("Username already taken. Please choose another username."); // Set error if username already exists
          return;
        }
        if (!emailSnapshot.empty) {
          // there is some user with the same email
          setError("Email already exists. Please choose another email."); // Set error if email already exists
          return;
        }
      } catch (err) {
        console.log(err);
        setError(err.message); // Set error message if firestore check fails
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const uid = userCredential.user.uid;

        await setDoc(doc(firestore, "users", uid), {
          name: fullName,
          email: email,
          username: username,
          learning_streak: 0,
          streak_date: new Date(),
          current_course_id: "",
          completed_courses: 0,
          createdAt: new Date(),
          photoURL: null,
          points:0,
        });
        
        // await setDoc(doc(firestore, "users", uid), {
        //   fullName,
        //   username,
        //   email,
        //   createdAt: new Date(),
        // });
        Alert.alert("Success", "Your account has been created! Please log in."); // Show success alert
        setFullName(""); // Clear full name state
        setUsername(""); // Clear username state
        setEmail(""); // Clear email state
        setPassword(""); // Clear password state
        setError(""); // Clear error state
        setIsLogin(true); // Switch to login mode
      } catch (err) {
        console.log(err);
        setError(err.message); // Set error message if signup fails
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title style={[styles.title, { color: theme.primary }]}>
            {isLogin ? "Login" : "Sign Up"}
          </Title>
          {isLogin && (
            // Login form
            <>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </>
          )}
          {!isLogin && (
            <>
              <Input
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
              />
              <Input
                placeholder="Username"
                value={username}
                // onChangeText={setUsername}
                onChangeText={(text) => setUsername(text.toLowerCase())} // Convert input to lowercase
              />
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </>
          )}
          {error ? (
            <Paragraph style={{ color: "red", textAlign: "center" }}>
              {error}
            </Paragraph>
          ) : null}
          <Button title={isLogin ? "Login" : "Sign Up"} onPress={handleAuth} />
          <Divider style={styles.divider} />
          <BorderedButton
            title={
              isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Login"
            }
            onPress={() => {
              setIsLogin(!isLogin); // Toggle between login and signup
              setError(""); // Clear error when switching modes
            }}
          />
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    padding: 20,
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 25,
    fontWeight: "600",
  },
  divider: {
    marginVertical: 10,
  },
});

export default AuthScreen;