import React, { createContext, useContext, useState, useEffect } from "react";
import { getFirestore, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth } from "../../firebase";
import { getAuth } from "firebase/auth";

// Create a context for learning preferences
const LearningPreferencesContext = createContext();
const firestore = getFirestore();

// Custom hook to access the learning preferences context
export const useLearningPreferences = () =>
  useContext(LearningPreferencesContext);

// Provider component to manage and provide learning preferences
export const LearningPreferencesProvider = ({ children }) => {
  // State variables
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effect to fetch learning preferences on component mount and when user changes
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    // Subscribe to user document changes to get learning preferences
    const unsubscribe = onSnapshot(
      doc(firestore, "users", user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          // Set preferences from the document data or null if not present
          setPreferences(docSnapshot.data().learningPreferences || null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching learning preferences:", error);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Function to update learning preferences in Firestore
  const updatePreferences = async (newPreferences) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Update the user document with new learning preferences
      await updateDoc(doc(firestore, "users", user.uid), {
        learningPreferences: newPreferences,
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      throw error;
    }
  };

  // Provide context values to children components
  return (
    <LearningPreferencesContext.Provider
      value={{
        preferences,
        loading,
        updatePreferences
      }}
    >
      {children}
    </LearningPreferencesContext.Provider>
  );
};
