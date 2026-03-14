import { StyleSheet } from "@react-pdf/renderer";

// Shared styles for all PDF components
export const styles = StyleSheet.create({
  // Page layout
  page: {
    paddingTop: 72, // 1 inch for header
    paddingBottom: 60, // space for footer
    paddingHorizontal: 54, // 0.75 inch margins
    fontFamily: "Helvetica",
    fontSize: 12,
    lineHeight: 1.4,
  },

  // Header styles
  header: {
    position: "absolute",
    top: 24,
    left: 54,
    right: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
  },
  headerLeft: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  headerRight: {
    textAlign: "right",
  },
  headerMaterialType: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  headerPageNumber: {
    fontSize: 9,
    color: "#666666",
    marginTop: 2,
  },

  // Footer styles
  footer: {
    position: "absolute",
    bottom: 24,
    left: 54,
    right: 54,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerPageNumber: {
    fontSize: 9,
    color: "#666666",
  },
  footerText: {
    fontSize: 9,
    color: "#666666",
  },

  // Typography
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
    marginTop: 16,
  },
  subHeader: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    marginTop: 12,
  },
  bodyText: {
    fontSize: 12,
    marginBottom: 6,
  },
  smallText: {
    fontSize: 11,
    color: "#555555",
    marginBottom: 4,
  },
  italicText: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 12,
  },
  boldText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },

  // List styles
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    width: 16,
    fontSize: 12,
  },
  listItemText: {
    flex: 1,
    fontSize: 12,
  },

  // Box/card styles
  card: {
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    marginVertical: 12,
  },

  // Script-specific styles
  dialogueLine: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 16,
  },
  characterName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    width: 100,
    textTransform: "uppercase",
  },
  dialogueText: {
    flex: 1,
    fontSize: 12,
  },
  proseText: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 12,
    marginBottom: 6,
    paddingLeft: 16,
    color: "#444444",
  },
  sceneSummary: {
    fontSize: 11,
    color: "#555555",
    marginBottom: 12,
    fontFamily: "Helvetica-Oblique",
  },

  // Beats-specific styles
  beatCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#333333",
    paddingLeft: 12,
    marginBottom: 16,
  },
  beatTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  beatLineRef: {
    fontSize: 10,
    fontFamily: "Helvetica-Oblique",
    color: "#666666",
    marginBottom: 4,
  },
  beatSummary: {
    fontSize: 11,
    marginBottom: 4,
  },
  beatNotes: {
    fontSize: 10,
    color: "#555555",
    fontFamily: "Helvetica-Oblique",
  },

  // Experiments-specific styles
  experimentMeta: {
    fontSize: 10,
    fontFamily: "Helvetica-Oblique",
    color: "#666666",
    marginBottom: 4,
  },

  // Warm-ups specific styles
  warmupNumber: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  warmupDescription: {
    fontSize: 12,
    marginBottom: 16,
    paddingLeft: 8,
  },

  // Utility
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mb24: { marginBottom: 24 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
});

// Helper to format date for footer
export function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// Material type display names
export const materialTypeLabels = {
  script: "Script",
  beats: "Beats",
  exercise_plan: "Warm Ups",
  challenge_list: "Experiments",
};
