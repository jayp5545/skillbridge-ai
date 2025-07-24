import { StyleSheet } from "react-native";

export default CompletionScreenStyles = (theme) => StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
    padding: 20,
  },
  contentContainer: {
    width: "100%",
    alignItems: "center",
  },
  trophyIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "semi-bold",
    color: theme.heading,
    marginBottom: 10,
    textAlign: "center",
  },
  completionMessage: {
    fontSize: 20,
    color: theme.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  completionMessageTitle: {
    fontSize: 22,
    color: theme.primary,
    marginBottom: 24,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: "grey",
    marginTop: 5,
  },
  actionButton: {
    width: "100%",
    marginBottom: 15,
  },
  scoreCard: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.primary,
    marginBottom: 4,
    alignSelf: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    height: 100,
    width: 100,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: theme.primary,
    borderRadius: 50,
    backgroundColor: theme.primaryLight,
  },
  score: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.primary,
  },
  errorText: {
    fontSize: 16,
    color: theme.error,
    textAlign: "center",
    marginBottom: 10,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background,
    padding: 20,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderColor: theme.border,
  },
  bottomButton: {
    width: "100%",
    marginBottom: 10,
  },
});