import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "./PdfStyles.js";

/**
 * Renders the script title page content (title + characters list).
 * This is rendered on the first page of the script material.
 */
export function ScriptTitleContent({ content }) {
  const { title, characters = [] } = content || {};

  return (
    <View>
      {title && <Text style={styles.title}>{title}</Text>}

      {characters.length > 0 && (
        <View>
          <Text style={styles.sectionHeader}>Characters</Text>
          {characters.map((c) => (
            <View key={c.id || c.name} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listItemText}>{c.name || "Unnamed"}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Renders a single scene's content (name, summary, lines).
 * Each scene should be rendered on its own page.
 */
export function ScriptSceneContent({ scene, characters = [] }) {
  const { name, summary, lines = [] } = scene || {};

  // Build a lookup map for character names
  const charMap = new Map(characters.map((c) => [c.id, c.name || ""]));

  return (
    <View>
      <Text style={styles.sectionHeader}>{name || "Untitled Scene"}</Text>

      {summary && <Text style={styles.sceneSummary}>{summary}</Text>}

      {lines.map((ln, index) => {
        const key = ln.id || `line-${index}`;
        const kind = ln.kind || "line";

        if (kind === "prose") {
          return (
            <Text key={key} style={styles.proseText}>
              ({ln.text})
            </Text>
          );
        }

        // Regular dialogue line
        const characterName = charMap.get(ln.characterId) || "";
        return (
          <View key={key} style={styles.dialogueLine}>
            <Text style={styles.characterName}>
              {characterName ? `${characterName}:` : ""}
            </Text>
            <Text style={styles.dialogueText}>{ln.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Returns an array of page content elements for a script.
 * First element is the title page content, subsequent elements are scene contents.
 */
export function getScriptPages(content) {
  const { scenes = [], characters = [] } = content || {};

  const pages = [];

  // Title page
  pages.push({
    key: "script-title",
    content: <ScriptTitleContent content={content} />,
  });

  // One page per scene
  scenes.forEach((scene, index) => {
    pages.push({
      key: `script-scene-${scene.id || index}`,
      content: <ScriptSceneContent scene={scene} characters={characters} />,
    });
  });

  return pages;
}
