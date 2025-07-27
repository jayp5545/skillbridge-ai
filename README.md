# SkillBridge AI

A mobile learning platform that uses artificial intelligence to generate personalized educational content and create structured learning paths for any skill.

---

## 🚀 Features

* **AI-Powered Course Generation**: Automatically creates structured learning timelines based on user skill requests.
* **Personalized Learning Cards**: Generates bite-sized content tailored to practical or theoretical learning approaches.
* **Interactive Quizzes**: Creates assessments based on learning content to reinforce key concepts.
* **Progress Tracking**: Monitor learning streaks and achievements.
* **Certificate Generation**: Earn certificates upon course completion.
* **Social Learning**: Leaderboards to compare progress with other learners.

---

## 🛠️ Tech Stack

* **Framework**: React Native 0.76.9 with Expo 52.0.44
* **AI Integration**: OpenAI GPT-4o for content generation
* **Backend**: Firebase (Authentication, Firestore, Storage)
* **UI Components**: React Native Paper for Material Design
* **Navigation**: React Navigation 7.x
* **Media Management**: Cloudinary for image processing

---

## 🏗️ Architecture

The app follows a hierarchical context provider pattern with conditional navigation based on user authentication and setup status:

`App.js` → `ThemeProvider` → `UserProvider` → `LearningPreferencesProvider` → `AppNavigator`

### Key Screens

* **Authentication**: Firebase-based login/signup
* **Profile Setup**: Photo upload and learning preferences
* **Course Creation**: AI-generated learning timelines
* **Learning Interface**: Interactive content cards and quizzes
* **Progress Tracking**: Certificates and leaderboards

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v16 or higher)
* Expo CLI
* iOS Simulator or Android Emulator
* Firebase project setup
* OpenAI API key

### Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/jayp5545/skillbridge-ai.git](https://github.com/jayp5545/skillbridge-ai.git)
    ```
2.  Navigate to the project directory:
    ```bash
    cd skillbridge-ai
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  **Environment Setup**: Create a `.env` file in the root directory and add your API keys:
    ```
    EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
    EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
    EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    ```
5.  **Firebase Configuration**:
    * Create a Firebase project.
    * Enable Authentication, Firestore, and Storage.
    * Add your Firebase configuration details to your project.

### Run the application

```bash
# Start the Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```
