import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useUser } from "../../../contexts/UserContext";
import { useNavigation } from "@react-navigation/native";
import { db } from "../../../../firebase";
import { doc, getDoc, getDocs, collection, addDoc, updateDoc, Timestamp, query, orderBy } from "firebase/firestore";
import { MaterialIcons } from '@expo/vector-icons';

import Button from "../../../components/Button";
import ProgressBar from "../../../components/ProgressBar";
import chatGptService from "../../../services/chatGptService";
import chatGptPrompt from '../../../prompts/quizQuestions';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = Dimensions.get('window').height * 0.6;

export default QuizScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { loading, setLoading, courseId, activityId, updateStreak } = useUser();
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [activity, setActivity] = useState([]);
    const [error, setError] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);

    const courseRef = doc(db, `courses/${courseId}`);
    const activityRef = doc(courseRef, `activities/${activityId}`);
    const taskRef = collection(activityRef, "task_cards");
    const quizRef = collection(activityRef, "quiz_questions");

    useEffect(() => {
        fetchQuizQuestions();
        updateStreak();
    }, []);

    const fetchQuizQuestions = async () => {
        try {
            setLoading(true);

            const activitySnap = await getDoc(activityRef);
            if (!activitySnap.exists()) {
                throw new Error("Activity not found");
            }
            const activityData = activitySnap.data();
            setActivity(activityData);
            setCurrentQuestionIndex(activityData?.completed_questions || 0);

            const getQuizQuery = query(quizRef, orderBy("index"));
            const quizQuestionsSnapshot = await getDocs(getQuizQuery);
            if (!quizQuestionsSnapshot.empty) {
                const quizQuestionsList = quizQuestionsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setQuizQuestions(quizQuestionsList);
            } else {
                await generateQuizQuestions();
            }
        } catch (error) {
            console.error("Error fetching quiz questions:", error);
            setError("Failed to load quiz questions.");
        } finally {
            setLoading(false);
        }
    };

    const generateQuizQuestions = async () => {
        try {
            setLoading(true);
            const courseSnap = await getDoc(courseRef);
            const courseData = courseSnap.data();
            const activitySnap = await getDoc(activityRef);
            const activityData = activitySnap.data();

            const getTasksQuery = query(taskRef, orderBy("index"));
            const taskCardsSnapshot = await getDocs(getTasksQuery);
            const taskCardsForPrompt = taskCardsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    card_title: data.card_title,
                    card_content: data.card_content
                };
            });

            // Prepare user input for ChatGPT prompt
            const userInput = {
                quiz_title: activityData.quiz_title || activityData.task_title,
                skill_title: courseData.title,
                task_title: activityData.task_title,
                task_description: activityData.task_description,
                task_cards: taskCardsForPrompt,
            };
            const response = await chatGptService.generateContent({ userInput, chatGptPrompt });
            if (response.success && response.content) {
                const newQuizQuestions = response.content || [];
                for (const quizQuestion of newQuizQuestions) {
                    await addDoc(quizRef, {
                        index: quizQuestion.index,
                        question: quizQuestion.question || "",
                        options: quizQuestion.options || [],
                        answer_index: quizQuestion.answer_index !== undefined ? quizQuestion.answer_index : 0,
                        explanation: quizQuestion.explanation || "",
                        status: "pending"
                    });
                }

                // Fetch the newly created quiz questions
                const orderedQuizRef = query(quizRef, orderBy("index"));
                const quizQuestionsSnapshot = await getDocs(orderedQuizRef);
                const quizQuestionsList = quizQuestionsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                await updateDoc(activityRef, {
                    quiz_status: 'in_progress',
                    quiz_score: 0,
                    completed_questions: 0,
                    current_question_id: quizQuestionsList[0]?.id || null,
                    total_score: quizQuestionsList.length,
                });
                setQuizQuestions(quizQuestionsList);
            }

            if (!response.success) {
                throw new Error(response.error || "Failed to generate quiz questions.");
            }

        } catch (error) {
            console.error("Error generating quiz questions:", error);
            setError("Failed to generate quiz questions.");
        } finally {
            setLoading(false);
        }
    };


    const handleNextQuestion = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            updateActivityProgressFirestore();
            setSelectedOptionIndex(null);
        }
    };

    const updateActivityProgressFirestore = async () => {
        try {
            const currentQuestion = quizQuestions[currentQuestionIndex]
            console.log("Current Question:", currentQuestion);
            console.log("Selected Option Index:", selectedOptionIndex);
            console.log("Current Question Index:", currentQuestionIndex);
            console.log("activity.quiz_score:", activity.quiz_score);
            console.log("Correct Ans:", currentQuestion.answer_index === selectedOptionIndex);
            if(currentQuestion.answer_index === selectedOptionIndex) {
                activity.quiz_score += 1;
            }
            const updateData = {
                completed_questions: currentQuestionIndex + 1,
                current_question_id: currentQuestion?.id || null,
                quiz_score: activity.quiz_score,
            };
            await updateDoc(activityRef, updateData);
            console.log("Activity progress updated in Firestore");
        } catch (error) {
            console.error("Error updating activity progress in Firestore:", error);
        }
    };
    
    const handleQuizComplete = async () => {
        try {
            setLoading(true);
            await updateDoc(activityRef, {
                quiz_status: 'completed',
                updated_at: Timestamp.fromDate(new Date()),
            });
            navigation.navigate('CompletionScreen', { type: 'quiz' });
        } catch (error) {
            console.error("Error marking quiz as complete:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (optionIndex) => {
        setSelectedOptionIndex(optionIndex);
    };

    const renderCurrentQuestion = () => {
        if (error) {
            return <Text style={{ color: theme.error }}>{error}</Text>;
        }

        const currentQuestion = quizQuestions[currentQuestionIndex];
        if (!currentQuestion) return null;

        return (
            <View style={[styles.questionContentCard, {backgroundColor: theme.cardBackground}]}>
                <Text style={[styles.questionText, { color: theme.text }]}>{currentQuestion.question}</Text>
                {currentQuestion.options.map((option, optionIndex) => (
                    <TouchableOpacity
                        key={optionIndex}
                        style={[
                            styles.optionButton, 
                            { 
                                backgroundColor: selectedOptionIndex === optionIndex ?
                                theme.primaryLight : theme.cardBackground,
                            }
                        ]}
                        onPress={() => handleOptionSelect(optionIndex)}
                    >
                        <Text style={[styles.optionText, { color: theme.text }]}>{option}</Text>
                    </TouchableOpacity>
                ))}
                { selectedOptionIndex && (currentQuestionIndex === quizQuestions.length - 1) ? (
                    <Button style={styles.submitButton} title="Submit" onPress={handleQuizComplete} />
                ) : (
                    <Button style={styles.submitButton} title="Next" onPress={handleNextQuestion} />
                )}
            </View>
        );
    };

    return (
        !loading && <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Quiz Bar */}
            <View style={styles.quizBar}>
                <View style={styles.quizTitleContainer}>
                    <Text style={styles.titleOfQuizText}>{activity.quiz_title || activity.task_title || "Quiz Title"}</Text>
                </View>
                <TouchableOpacity style={styles.closeIcon} onPress={() => navigation.navigate('CourseTimeline')}>
                    <MaterialIcons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.questionProgressBarContainer}>
                <Text style={[styles.questionProgressText, { color: theme.text }]}>Question {currentQuestionIndex + 1} of {quizQuestions.length}</Text>
                <ProgressBar progress={(((currentQuestionIndex) + 1) / (quizQuestions.length > 0 ? quizQuestions.length : 1)) * 100} height={8} />
            </View>

            {/* Quiz Question Cards */}
            <View style={styles.cardStackContainer}>
                <View style={styles.cardContainer}>
                    {renderCurrentQuestion()}
                </View>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    quizBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        width: Dimensions.get('window').width,
    },
    quizTitleContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
    },
    titleOfQuizText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    closeIcon: {
        padding: 8,
    },
    questionProgressBarContainer: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    questionProgressText: {
        fontSize: 14,
        color: 'grey',
        marginBottom: 5,
        textAlign: 'center',
    },
    cardStackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    questionContentCard: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
        alignItems: 'stretch',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#c2c2c2',
        shadowColor: '#000',
    },
    questionText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'left',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#c2c2c2',
    },
    optionText: {
        fontSize: 16,
        marginLeft: 10,
        textAlign: 'left',
    },
    submitButton: {
        marginTop: 20,
    },
});