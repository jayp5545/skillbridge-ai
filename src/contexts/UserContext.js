import React, { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

// Create Context
const UserContext = createContext();

// Provider Component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState("");
  const [activityId, setActivityId] = useState("");

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch user document from Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userDataObj = { id: firebaseUser.uid, ...userDocSnap.data() };
          setUserData(userDataObj);

          // Check and reset streak
          const lastStreakDate = userDataObj.streak_date?.toDate();
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);

          if (lastStreakDate) {
            const lastStreakDay = new Date(lastStreakDate.getFullYear(), lastStreakDate.getMonth(), lastStreakDate.getDate());
            if (lastStreakDay.getTime() < yesterday.getTime()) {
              // Streak was not continued yesterday, reset it
              updateUserData({
                learning_streak: 0,
                streak_date: Timestamp.fromDate(today),
              });
            }
          }

          const currentCourseId = userDataObj.current_course_id;
          if (currentCourseId && currentCourseId.length) {
            const courseSnap = await getDoc(doc(db, `courses/${currentCourseId}`));
            setCourseId(currentCourseId);
            setActivityId(courseSnap.data().current_activity_id);
          }
        } else {
          console.log("No user document found!");
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserData = async (updatedData) => {
    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, updatedData);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      setUserData({ id: user.uid, ...userDocSnap.data() });
    } else {
      console.log("No user document found!");
      setUserData(null);
    }
  };

  const updateStreak = async () => {
    if (!userData || !user) {
      return; // Do nothing if user data is not loaded
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastStreakDate = userData.streak_date?.toDate();

    if (!lastStreakDate) {
      // First time or streak was broken
      await updateUserData({
        learning_streak: 1,
        streak_date: Timestamp.fromDate(today),
      });
    } else {
      const lastStreakDay = new Date(lastStreakDate.getFullYear(), lastStreakDate.getMonth(), lastStreakDate.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (lastStreakDay.getTime() === today.getTime()) {
        // Already updated the streak today, no need to do anything
        return;
      } else if (lastStreakDay.getTime() === yesterday.getTime()) {
        // Continue the streak
        await updateUserData({
          learning_streak: (userData.learning_streak || 0) + 1,
          streak_date: Timestamp.fromDate(today),
        });
      } else {
        // Streak broken
        await updateUserData({
          learning_streak: 1,
          streak_date: Timestamp.fromDate(today),
        });
      }
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      userData,
      loading,
      courseId,
      activityId,
      setUserData,
      updateUserData,
      setLoading,
      setCourseId,
      setActivityId,
      updateStreak,
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for accessing user context
export const useUser = () => {
  return useContext(UserContext);
};
