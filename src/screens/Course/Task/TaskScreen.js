import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, PanResponder, Animated } from "react-native";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useUser } from "../../../contexts/UserContext";
import { useNavigation } from "@react-navigation/native";
import { db } from "../../../../firebase";
import { doc, getDoc, getDocs, collection, addDoc, updateDoc, Timestamp, query, orderBy, } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import ProgressBar from "../../../components/ProgressBar";
import chatGptService from "../../../services/chatGptService";
import chatGptPrompt from "../../../prompts/taskCards";
import Button from "../../../components/Button";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = height * 0.58;
const SWIPE_THRESHOLD = 50;
const DOT_SIZE = 8;
const DOT_SPACING = 5;

export default TaskScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { loading, setLoading, courseId, activityId, updateStreak } = useUser();
    const [taskCards, setTaskCards] = useState([]);
    const [activity, setActivity] = useState([]);
    const [error, setError] = useState(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);

    const courseRef = doc(db, `courses/${courseId}`);
    const activityRef = doc(courseRef, `activities/${activityId}`);
    const taskRef = collection(activityRef, "task_cards");

    const taskCardsRef = useRef(taskCards);
    useEffect(() => {
        taskCardsRef.current = taskCards;
    }, [taskCards]);

    // Animated values for translation, rotation, and opacity
    const translateXAnim = useRef(new Animated.Value(0)).current;
    const rotationAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    /**
     * Reusable movement function.
     *
     * @param {number} delta - +1 for next card, -1 for previous card.
     */
    const moveCard = (delta) => {
        setCurrentCardIndex(prevIndex => {
            const newIndex = prevIndex + delta;
            console.log("newIndex: ", newIndex);
            // If the new index is out of bounds, bounce back.
            if (newIndex < 0 || newIndex >= taskCardsRef.current.length) {
                Animated.parallel([
                    Animated.timing(translateXAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotationAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start();
                return prevIndex;
            }

            // For a "next" card (delta +1) we want to slide left,
            // and for a "previous" card (delta -1) we slide right.
            const direction = delta > 0 ? -1 : 1;
            console.log("direction: ", direction);

            // Animate current card out
            Animated.parallel([
                Animated.timing(translateXAnim, {
                    toValue: direction * width,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(rotationAnim, {
                    toValue: direction * 15, // rotate 15° in the respective direction
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Update the current index and Firestore progress

                updateActivityProgressFirestore(newIndex);
                setCurrentCardIndex(newIndex);

                // Reset animated values for new card coming from opposite side
                translateXAnim.setValue(-direction * width);
                rotationAnim.setValue(-direction * 15);
                opacityAnim.setValue(0);

                // Animate the new card into view
                Animated.parallel([
                    Animated.timing(translateXAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotationAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start();

            });

            console.log("return index: ", newIndex);
            return newIndex;
        });
    };

    // Button handlers simply call moveCard with the proper delta.
    const handleNextCard = () => {
        moveCard(+1);
    };

    const handlePrevCard = () => {
        moveCard(-1);
    };

    // PanResponder for swipe gestures
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                // You can optionally update the animated values dynamically here.
                translateXAnim.setValue(gestureState.dx);
            },
            onPanResponderRelease: (_, gestureState) => {
                setCurrentCardIndex(prevIndex => {
                    if (
                        gestureState.dx < -SWIPE_THRESHOLD &&
                        prevIndex < taskCardsRef.current.length - 1
                    ) {
                        // Swipe left => Next card (delta +1)
                        moveCard(+1);
                    } else if (gestureState.dx > SWIPE_THRESHOLD && prevIndex > 0) {
                        // Swipe right => Previous card (delta -1)
                        moveCard(-1);
                    } else {
                        // Not enough movement; bounce back.
                        Animated.parallel([
                            Animated.timing(translateXAnim, {
                                toValue: 0,
                                duration: 200,
                                useNativeDriver: true,
                            }),
                            Animated.timing(rotationAnim, {
                                toValue: 0,
                                duration: 200,
                                useNativeDriver: true,
                            }),
                            Animated.timing(opacityAnim, {
                                toValue: 1,
                                duration: 200,
                                useNativeDriver: true,
                            }),
                        ]).start();
                    }
                    return prevIndex;
                })
            },
        })
    ).current;

    useEffect(() => {
        fetchTaskCards();
        updateStreak();
    }, []);

    const fetchTaskCards = async () => {
        try {
            setLoading(true);
            console.log("Fetching task cards...");
            console.log("Course ID:", courseId);
            console.log("Activity ID:", activityId);

            const activitySnap = await getDoc(activityRef);
            if (!activitySnap.exists()) {
                throw new Error("Activity not found");
            }
            const activityData = activitySnap.data();
            setActivity(activityData);

            const getTasksQuery = query(taskRef, orderBy("index"));
            const taskCardsSnapshot = await getDocs(getTasksQuery);
            if (!taskCardsSnapshot.empty) {
                const taskCardsList = taskCardsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setTaskCards(taskCardsList);

                if (activityData.current_card_id) {
                    const initialIndex = taskCardsList.findIndex((card) => card.id === activityData.current_card_id);
                    if (initialIndex !== -1) {
                        setCurrentCardIndex(initialIndex);
                    }
                }
            } else {
                await generateTaskCards();
            }
        } catch (error) {
            console.error("Error fetching task cards:", error);
            setError("Failed to load task cards.");
        } finally {
            setLoading(false);
        }
    };

    const generateTaskCards = async () => {
        try {
            console.log("Generating new task cards...");
            const courseSnap = await getDoc(courseRef);
            const courseData = courseSnap.data();
            const activitySnap = await getDoc(activityRef);
            const activityData = activitySnap.data();
            const userInput = {
                activity_title: activityData.task_title,
                activity_description: activityData.task_description,
                approach: courseData.approach,
            };
            const response = await chatGptService.generateContent({
                userInput,
                chatGptPrompt,
            });

            if (response.success && response.content) {
                const newTaskCards = response.content || [];
                for (const taskCard of newTaskCards) {
                    await addDoc(taskRef, {
                        index: taskCard.index,
                        card_title: taskCard.card_title || "",
                        card_content: taskCard.card_content || "",
                        status: "pending",
                    });
                }

                const getTasksQuery = query(taskRef, orderBy("index"));
                const taskCardsSnapshot = await getDocs(getTasksQuery);
                const taskCardsList = taskCardsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setTaskCards(taskCardsList);
            }

            if (!response.success) {
                throw new Error(response.error || "Failed to generate task cards.");
            }
        } catch (error) {
            console.error("Error generating task cards:", error);
            setError("Failed to generate task cards.");
        }
    };

    const updateActivityProgressFirestore = async (updatedCurrentCardIndex) => {
        try {
            const updateData = {
                completed_cards: updatedCurrentCardIndex + 1,
                current_card_id: taskCardsRef.current[updatedCurrentCardIndex]?.id || null,
            };
            await updateDoc(activityRef, updateData);
            console.log("Activity progress updated in Firestore");
        } catch (error) {
            console.error("Error updating activity progress in Firestore:", error);
        }
    };

    const handleTaskComplete = async () => {
        try {
            setLoading(true);
            await updateDoc(activityRef, {
                task_status: 'completed',
                quiz_status: 'in_progress',
                updated_at: Timestamp.fromDate(new Date()),
            });
            navigation.navigate('CompletionScreen', { type: 'task' });
        } catch (error) {
            console.error("Error marking task as complete:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderTaskCards = () => {
        if (error) {
            return <Text style={{ color: theme.error }}>{error}</Text>;
        }
        if (taskCards.length === 0) {
            return <Text style={{ color: theme.error }}>No task Cards available yet!</Text>;
        }
        const currentCard = taskCards[currentCardIndex];

        return (
            !loading && <Animated.View
                style={[
                    styles.cardContainer,
                    {
                        transform: [
                            { translateX: translateXAnim },
                            {
                                rotate: rotationAnim.interpolate({
                                    inputRange: [-360, 360],
                                    outputRange: ["-360deg", "360deg"],
                                }),
                            },
                        ],
                        opacity: opacityAnim,
                    },
                ]}
                {...panResponder.panHandlers}
            >
                <View style={[ styles.taskContentCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder } ]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                        {currentCard?.card_title}
                    </Text>
                    <Text style={[styles.cardContent, { color: theme.text }]}>
                        {currentCard?.card_content}
                    </Text>
                </View>
            </Animated.View>
        );
    };

    const renderDotsProgress = () => {
        return (
            <View style={styles.dotsContainer}>
                {taskCards.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === currentCardIndex ? styles.activeDot : styles.inactiveDot,
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        !loading && <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.taskBar}>
                <View style={styles.skillTitleContainer}>
                    <Text style={styles.titleOfSkillText}>{activity.task_title}</Text>
                    <Text style={styles.subtitleOfSkillText}>
                        {activity.task_description?.slice(0, 50)}...
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.closeIcon}
                    onPress={() => navigation.navigate("CourseTimeline")}
                >
                    <MaterialIcons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.progressBarContainer}>
                <ProgressBar
                    progress={ ((currentCardIndex + 1) / (taskCards.length > 0 ? taskCards.length : 1)) * 100 }
                    height={8}
                />
            </View>

            <View style={styles.cardStackContainer}>{renderTaskCards()}</View>

            {currentCardIndex === (taskCardsRef.current.length - 1) ? (
                <View style={styles.completionButtonContainer}>
                    <Button title="Complete Task" onPress={handleTaskComplete}/>
                </View>
            ) : (<View style={styles.bottomBar}>
                <View style={styles.cardNavigationButtons}>
                    <TouchableOpacity
                        style={[
                            styles.navigationButton,
                            styles.circularButton,
                            currentCardIndex === 0 && styles.disabledButton,
                        ]}
                        onPress={handlePrevCard}
                        disabled={currentCardIndex === 0}
                    >
                        <MaterialIcons
                            name="chevron-left"
                            size={24}
                            color={currentCardIndex === 0 ? theme.disabledText : theme.primary}
                        />
                    </TouchableOpacity>
                    <View style={{ alignItems: "center" }}>
                        {renderDotsProgress()}
                        <View style={styles.taskProgressTextContainer}>
                            <Text style={[styles.taskProgressText, { color: theme.text }]}>
                                {currentCardIndex + 1}
                            </Text>
                            <Text style={[styles.taskProgressTotalText, { color: theme.text }]}>
                                /{taskCards.length} Cards
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.navigationButton,
                            styles.circularButton,
                            currentCardIndex === taskCards.length - 1 &&
                            styles.disabledButton,
                        ]}
                        onPress={handleNextCard}
                        disabled={currentCardIndex === taskCards.length - 1}
                    >
                        <MaterialIcons
                            name="chevron-right"
                            size={24}
                            color={taskCards.length === 0 ? theme.disabledText : theme.primary}
                        />
                    </TouchableOpacity>
                </View>
            </View>)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    taskBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        width: width,
    },
    closeButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    closeButtonText: {
        color: "grey",
    },
    taskTitleText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    skillBridgeText: {
        fontSize: 16,
        color: "grey",
    },
    titleOfSkillText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    subtitleOfSkillText: {
        fontSize: 12,
        color: "grey",
    },
    progressBarContainer: {
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    cardStackContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
    },
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    taskContentCard: {
        flex: 1,
        padding: 20,
        justifyContent: "flex-start",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 0.5,
        gap: 8,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    cardContent: {
        fontSize: 18,
        lineHeight: 24,
        textAlign: "left",
    },
    bottomBar: {
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    cardNavigationButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    navigationButton: {
        padding: 4,
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#e0e0e0",
        justifyContent: "center",
        alignItems: "center",
    },
    circularButton: {
        backgroundColor: "transparent",
    },
    disabledButton: {
        opacity: 0.5,
    },
    taskProgressTextContainer: {
        flexDirection: "row",
        alignItems: "baseline",
    },
    taskProgressText: {
        fontSize: 18,
        fontWeight: "bold",
        marginRight: 4,
    },
    taskProgressTotalText: {
        fontSize: 14,
        color: "grey",
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: "#e0e0e0",
        marginHorizontal: DOT_SPACING,
    },
    activeDot: {
        backgroundColor: "#888",
    },
    inactiveDot: {
        backgroundColor: "#e0e0e0",
    },
    completionButtonContainer: {
        padding: 16,
        alignItems: 'center',
    },
    completionButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    completionButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeIcon: {
        padding: 5,
    },
    skillTitleContainer: {
        flex: 1,
        paddingRight: 10,
    },
});