import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "./PdfStyles.js";

/**
 * Renders warm-ups content (title + numbered list).
 * Warm-ups flow continuously on a single page (unless content overflows).
 */
export function WarmupsContent({ content }) {
  const { title, warmups, exercises } = content || {};

  // Normalize: support both "warmups" and "exercises" arrays
  const items = Array.isArray(warmups)
    ? warmups
    : Array.isArray(exercises)
    ? exercises.map((ex, idx) =>
        typeof ex === "string"
          ? { id: idx, description: ex }
          : { id: ex.id || idx, description: ex.description || "" }
      )
    : [];

  return (
    <View>
      {title && <Text style={styles.title}>{title}</Text>}

      {items.length === 0 ? (
        <Text style={styles.smallText}>No warm-ups defined.</Text>
      ) : (
        items.map((w, index) => (
          <View key={w.id || index} style={styles.mb16}>
            <Text style={styles.warmupNumber}>{`Warm Up ${index + 1}`}</Text>
            <Text style={styles.warmupDescription}>
              {w.description || "No description provided."}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

/**
 * Returns an array of page content elements for warm-ups.
 * Warm-ups render as a single page (content flows automatically).
 */
export function getWarmupsPages(content) {
  return [
    {
      key: "warmups-all",
      content: <WarmupsContent content={content} />,
    },
  ];
}
