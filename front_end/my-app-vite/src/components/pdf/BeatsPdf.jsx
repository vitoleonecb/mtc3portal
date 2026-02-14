import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "./PdfStyles.js";

/**
 * Renders the beats title page content.
 */
export function BeatsTitleContent({ content }) {
  const { title, scriptTitle, scriptWorkshopName } = content || {};

  const effectiveTitle =
    title || (scriptTitle ? `Beats for ${scriptTitle}` : "Beats");

  return (
    <View>
      <Text style={styles.title}>{effectiveTitle}</Text>

      {scriptTitle && (
        <View style={styles.mb16}>
          <Text style={styles.bodyText}>
            Based on script: {scriptTitle}
            {scriptWorkshopName ? ` (Workshop: ${scriptWorkshopName})` : ""}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Renders a single scene with all its beats.
 * Each scene should be rendered on its own page.
 */
export function BeatsSceneContent({ scene }) {
  const { sceneName, beats = [] } = scene || {};

  return (
    <View>
      <Text style={styles.sectionHeader}>{sceneName || "Untitled Scene"}</Text>

      {beats.length === 0 ? (
        <Text style={styles.smallText}>No beats defined for this scene.</Text>
      ) : (
        beats.map((beat, index) => (
          <View key={beat.id || index} style={styles.beatCard}>
            <Text style={styles.beatTitle}>
              {beat.name || `Beat ${index + 1}`}
            </Text>

            {beat.lineRef && (
              <Text style={styles.beatLineRef}>{beat.lineRef}</Text>
            )}

            {beat.summary && (
              <Text style={styles.beatSummary}>{beat.summary}</Text>
            )}

            {beat.notes && <Text style={styles.beatNotes}>{beat.notes}</Text>}
          </View>
        ))
      )}
    </View>
  );
}

/**
 * Returns an array of page content elements for beats.
 * First element is the title page, subsequent elements are scene pages.
 */
export function getBeatsPages(content) {
  const { scenes = [] } = content || {};

  const pages = [];

  // Title page
  pages.push({
    key: "beats-title",
    content: <BeatsTitleContent content={content} />,
  });

  // One page per scene
  scenes.forEach((scene, index) => {
    pages.push({
      key: `beats-scene-${scene.id || scene.sceneId || index}`,
      content: <BeatsSceneContent scene={scene} />,
    });
  });

  return pages;
}
