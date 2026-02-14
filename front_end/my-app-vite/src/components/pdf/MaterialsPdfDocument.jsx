import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, formatDate, materialTypeLabels } from "./PdfStyles.js";
import { getScriptPages } from "./ScriptPdf.jsx";
import { getBeatsPages } from "./BeatsPdf.jsx";
import { getWarmupsPages } from "./WarmupsPdf.jsx";
import { getExperimentsPages } from "./ExperimentsPdf.jsx";

/**
 * Page header component.
 * Shows workshop name on left, material type and page number on right.
 */
function PageHeader({ workshopName, materialType }) {
  const label = materialTypeLabels[materialType] || materialType || "Material";

  return (
    <View style={styles.header} fixed>
      <Text style={styles.headerLeft}>{workshopName}</Text>
      <View style={styles.headerRight}>
        <Text style={styles.headerMaterialType}>{label}</Text>
        <Text
          style={styles.headerPageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
    </View>
  );
}

/**
 * Page footer component.
 * Shows generation date centered.
 */
function PageFooter({ generatedDate }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{formatDate(generatedDate)}</Text>
    </View>
  );
}

/**
 * Get page content arrays for a material based on its type.
 */
function getPagesForMaterial(material) {
  const { material_type, content } = material;

  switch (material_type) {
    case "script":
      return getScriptPages(content);
    case "beats":
      return getBeatsPages(content);
    case "exercise_plan":
      return getWarmupsPages(content);
    case "challenge_list":
      return getExperimentsPages(content);
    default:
      // Fallback: render raw JSON
      return [
        {
          key: `unknown-${material.material_id || "material"}`,
          content: (
            <View>
              <Text style={styles.title}>
                {materialTypeLabels[material_type] || material_type || "Material"}
              </Text>
              <Text style={styles.smallText}>
                {JSON.stringify(content, null, 2)}
              </Text>
            </View>
          ),
        },
      ];
  }
}

/**
 * Main PDF Document component.
 *
 * Props:
 * - workshopName: string - Name of the workshop (shown in header)
 * - materials: array - Array of material objects with { material_type, content }
 * - generatedDate: Date - Date to show in footer (defaults to now)
 */
export function MaterialsPdfDocument({
  workshopName = "Workshop",
  materials = [],
  generatedDate = new Date(),
}) {
  // Build flat list of all pages with their material type context
  const allPages = [];

  materials.forEach((material) => {
    const pages = getPagesForMaterial(material);
    pages.forEach((page) => {
      allPages.push({
        ...page,
        materialType: material.material_type,
      });
    });
  });

  // If no materials, show a placeholder page
  if (allPages.length === 0) {
    allPages.push({
      key: "empty",
      materialType: "none",
      content: (
        <View>
          <Text style={styles.title}>No Materials</Text>
          <Text style={styles.bodyText}>
            This workshop does not have any materials yet.
          </Text>
        </View>
      ),
    });
  }

  return (
    <Document
      title={`${workshopName} - Materials`}
      author="MTC3 Portal"
      subject="Workshop Materials"
    >
      {allPages.map((page) => (
        <Page key={page.key} size="LETTER" style={styles.page}>
          <PageHeader
            workshopName={workshopName}
            materialType={page.materialType}
          />
          {page.content}
          <PageFooter generatedDate={generatedDate} />
        </Page>
      ))}
    </Document>
  );
}

export default MaterialsPdfDocument;
