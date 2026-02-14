import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "./PdfStyles.js";

/**
 * Renders experiments content (title, constraints/liberties summary, experiments).
 * Experiments flow continuously on pages.
 */
export function ExperimentsContent({ content }) {
  const { title, constraints = [], liberties = [], experiments = [] } =
    content || {};

  // Build lookup maps for constraints and liberties
  const constraintById = new Map(
    constraints.map((c) => [c.id, c.name || c.label || ""])
  );
  const libertyById = new Map(
    liberties.map((l) => [l.id, l.name || l.label || ""])
  );

  return (
    <View>
      {title && <Text style={styles.title}>{title}</Text>}

      {/* Constraints and Liberties summary */}
      {(constraints.length > 0 || liberties.length > 0) && (
        <View style={styles.card}>
          {constraints.length > 0 && (
            <View style={liberties.length > 0 ? styles.mb12 : undefined}>
              <Text style={styles.subHeader}>Constraints</Text>
              {constraints.map((c) => (
                <View key={c.id || c.name} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listItemText}>
                    {c.name || c.label || "Untitled"}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {liberties.length > 0 && (
            <View>
              <Text style={styles.subHeader}>Liberties</Text>
              {liberties.map((l) => (
                <View key={l.id || l.name} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listItemText}>
                    {l.name || l.label || "Untitled"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Experiments list */}
      {experiments.length === 0 ? (
        <Text style={styles.smallText}>No experiments defined.</Text>
      ) : (
        <View style={styles.mt16}>
          <Text style={styles.sectionHeader}>Experiments</Text>

          {experiments.map((exp, index) => {
            const constraintName =
              (exp.constraintId && constraintById.get(exp.constraintId)) || "";
            const libertyName =
              (exp.libertyId && libertyById.get(exp.libertyId)) || "";

            const metaParts = [];
            if (constraintName) metaParts.push(`Constraint: ${constraintName}`);
            if (libertyName) metaParts.push(`Liberty: ${libertyName}`);

            return (
              <View key={exp.id || index} style={styles.card}>
                <Text style={styles.subHeader}>
                  {exp.name || `Experiment ${index + 1}`}
                </Text>

                {metaParts.length > 0 && (
                  <Text style={styles.experimentMeta}>
                    {metaParts.join(" · ")}
                  </Text>
                )}

                {exp.description && (
                  <Text style={styles.bodyText}>{exp.description}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

/**
 * Returns an array of page content elements for experiments.
 * Experiments render as a single page (content flows automatically).
 */
export function getExperimentsPages(content) {
  return [
    {
      key: "experiments-all",
      content: <ExperimentsContent content={content} />,
    },
  ];
}
