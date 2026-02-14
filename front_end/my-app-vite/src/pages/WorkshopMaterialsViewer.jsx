import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PDFDownloadLink } from "@react-pdf/renderer";

import { Heading1, Heading2 } from "../Headings.jsx";
import { MaterialsPdfDocument } from "../components/pdf/MaterialsPdfDocument.jsx";

function ScriptMaterialView({ content }) {
  if (!content) return null;
  const { title, characters = [], scenes = [] } = content;

  return (
    <div className="ScriptMaterialViewer">
      {title && (
        <div className="logInButtonContainer" style={{ marginTop: 0 }}>
          <div className="QuestionProcessing" style={{ marginBottom: 8 }}>
            Script title
          </div>
          <div className="OpenResponse no_hover">{title}</div>
        </div>
      )}

      {characters.length > 0 && (
        <div className="logInButtonContainer" style={{ marginTop: 8 }}>
          <div className="QuestionProcessing" style={{ marginBottom: 4 }}>
            Characters
          </div>
          <ul
            className="OpenResponse no_hover"
            style={{ listStyle: "none", marginBottom: 0 }}
          >
            {characters.map((c) => (
              <li key={c.id || c.name}>{c.name || "Unnamed"}</li>
            ))}
          </ul>
        </div>
      )}

      {scenes.length > 0 && (
        <div className="logInButtonContainer" style={{ marginTop: 8 }}>
          <div className="QuestionProcessing" style={{ marginBottom: 4 }}>
            Scenes & lines
          </div>
          <div className="OpenResponse no_hover" style={{ padding: 0 }}>
            {scenes.map((scene) => (
              <div
                key={scene.id || scene.name}
                style={{
                  borderBottom: "1px solid #ddd",
                  padding: "12px 16px",
                }}
              >
                <div className="ButtonText" style={{ marginBottom: 4 }}>
                  {scene.name || "Untitled scene"}
                </div>
                {scene.summary && (
                  <p style={{ marginBottom: 8 }}>{scene.summary}</p>
                )}
                {Array.isArray(scene.lines) && scene.lines.length > 0 && (
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    {scene.lines.map((ln) => {
                      const key = ln.id || ln.text;
                      const kind = ln.kind || "line";

                      if (kind === "prose") {
                        return (
                          <li key={key} style={{ marginBottom: 4, fontStyle: "italic" }}>
                            {ln.text}
                          </li>
                        );
                      }

                      const character = characters.find((c) => c.id === ln.characterId);
                      const label = character?.name || "";
                      return (
                        <li key={key} style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>
                            {label ? `${label}: ` : ""}
                          </span>
                          <span>{ln.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GenericJsonMaterialView({ content }) {
  if (!content) return null;
  return (
    <pre className="OpenResponse no_hover" style={{ whiteSpace: "pre-wrap" }}>
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}

function WarmupsMaterialView({ content }) {
  if (!content) return null;
  const { title, warmups, exercises } = content;
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
    <div className="ScriptMaterialViewer">
      {title && (
        <div className="logInButtonContainer" style={{ marginTop: 0 }}>
          <div className="QuestionProcessing" style={{ marginBottom: 8 }}>
            Warm-ups title
          </div>
          <div className="OpenResponse no_hover">{title}</div>
        </div>
      )}

      {items.length > 0 && (
        <div className="logInButtonContainer" style={{ marginTop: 8 }}>
          <div className="OpenResponse no_hover" style={{ padding: 0 }}>
            {items.map((w, index) => (
              <div
                key={w.id || index}
                style={{ borderBottom: "1px solid #ddd", padding: "12px 16px" }}
              >
                <div className="ButtonText" style={{ marginBottom: 4 }}>
                  {`Warm Up ${index + 1}`}
                </div>
                <p style={{ margin: 0 }}>{w.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BeatsMaterialView({ content }) {
  if (!content) return null;
  const {
    title,
    scriptTitle,
    scriptWorkshopName,
    scenes = [],
  } = content;

  const effectiveTitle =
    title || (scriptTitle ? `Beats for ${scriptTitle}` : "Beats");

  return (
    <div className="ScriptMaterialViewer">
      <div className="logInButtonContainer" style={{ marginTop: 0 }}>
        <div className="QuestionProcessing" style={{ marginBottom: 8 }}>
          Beats title
        </div>
        <div className="OpenResponse no_hover">{effectiveTitle}</div>
      </div>

      {scriptTitle && (
        <div className="logInButtonContainer" style={{ marginTop: 0 }}>
          <div className="OpenResponse no_hover">
            Based on script: {scriptTitle}
            {scriptWorkshopName ? ` (Workshop: ${scriptWorkshopName})` : ""}
          </div>
        </div>
      )}

      {Array.isArray(scenes) && scenes.length > 0 && (
        <div className="logInButtonContainer" style={{ marginTop: 8 }}>
          <div className="OpenResponse no_hover" style={{ padding: 0 }}>
            {scenes.map((scene) => (
              <div
                key={scene.id || scene.sceneId || scene.sceneName}
                style={{ borderBottom: "1px solid #ddd", padding: "12px 16px" }}
              >
                <div className="ButtonText" style={{ marginBottom: 4 }}>
                  {scene.sceneName || "Untitled scene"}
                </div>

                {Array.isArray(scene.beats) && scene.beats.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {scene.beats.map((beat) => (
                      <li key={beat.id || beat.name} style={{ marginBottom: 6 }}>
                        <div style={{ fontWeight: 600 }}>
                          {beat.name || "Untitled beat"}
                        </div>
                        {beat.lineRef && (
                          <div
                            style={{ fontStyle: "italic", fontSize: "0.9rem" }}
                          >
                            {beat.lineRef}
                          </div>
                        )}
                        {beat.summary && (
                          <div style={{ marginTop: 2 }}>{beat.summary}</div>
                        )}
                        {beat.notes && (
                          <div
                            style={{ marginTop: 2, fontSize: "0.9rem" }}
                          >
                            {beat.notes}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontStyle: "italic", fontSize: "0.9rem" }}>
                    No beats yet for this scene.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExperimentsMaterialView({ content }) {
  if (!content) return null;
  const { title, constraints = [], liberties = [], experiments = [] } = content;

  const constraintById = new Map(
    constraints.map((c) => [c.id, c.name || c.label || ""])
  );
  const libertyById = new Map(
    liberties.map((l) => [l.id, l.name || l.label || ""])
  );

  return (
    <div className="ScriptMaterialViewer">
      {title && (
        <div className="logInButtonContainer" style={{ marginTop: 0 }}>
          <div className="QuestionProcessing" style={{ marginBottom: 8 }}>
            Experiments title
          </div>
          <div className="OpenResponse no_hover">{title}</div>
        </div>
      )}

      {(constraints.length > 0 || liberties.length > 0) && (
        <div className="logInButtonContainer" style={{ marginTop: 8 }}>
          <div className="OpenResponse no_hover" style={{ padding: "12px 16px" }}>
            {constraints.length > 0 && (
              <div style={{ marginBottom: liberties.length > 0 ? 8 : 0 }}>
                <div className="ButtonText" style={{ marginBottom: 4 }}>
                  Constraints
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {constraints.map((c) => (
                    <li key={c.id || c.name}>{c.name || c.label || "Untitled"}</li>
                  ))}
                </ul>
              </div>
            )}

            {liberties.length > 0 && (
              <div>
                <div className="ButtonText" style={{ marginBottom: 4 }}>
                  Liberties
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {liberties.map((l) => (
                    <li key={l.id || l.name}>{l.name || l.label || "Untitled"}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {Array.isArray(experiments) && experiments.length > 0 && (
        <div className="logInButtonContainer" style={{ marginTop: 8 }}>
          <div className="OpenResponse no_hover" style={{ padding: 0 }}>
            {experiments.map((exp, index) => {
              const constraintName =
                (exp.constraintId && constraintById.get(exp.constraintId)) || "";
              const libertyName =
                (exp.libertyId && libertyById.get(exp.libertyId)) || "";

              const metaParts = [];
              if (constraintName) metaParts.push(`Constraint: ${constraintName}`);
              if (libertyName) metaParts.push(`Liberty: ${libertyName}`);

              return (
                <div
                  key={exp.id || index}
                  style={{
                    borderBottom: "1px solid #ddd",
                    padding: "12px 16px",
                  }}
                >
                  <div className="ButtonText" style={{ marginBottom: 4 }}>
                    {exp.name || `Experiment ${index + 1}`}
                  </div>

                  {metaParts.length > 0 && (
                    <p
                      style={{
                        margin: 0,
                        marginBottom: exp.description ? 4 : 0,
                        fontStyle: "italic",
                      }}
                    >
                      {metaParts.join("  b7 ")}
                    </p>
                  )}

                  {exp.description && (
                    <p style={{ margin: 0 }}>{exp.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkshopMaterialsViewer() {
  const { workshopId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workshopName, setWorkshopName] = useState("");

  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      setError("");
      try {
        const [materialsRes, workshopRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_URL}/materials/workshops/${workshopId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          ),
          axios.get(
            `${import.meta.env.VITE_API_URL}/workshops/${workshopId}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          ),
        ]);

        const rows = Array.isArray(materialsRes.data) ? materialsRes.data : [];

        const hydrated = rows.map((row) => {
          let parsed = null;
          try {
            parsed = typeof row.content_json === "string"
              ? JSON.parse(row.content_json)
              : row.content_json;
          } catch {
            parsed = null;
          }
          return { ...row, content: parsed };
        });

        setMaterials(hydrated);

        const workshopRow = Array.isArray(workshopRes.data)
          ? workshopRes.data[0]
          : null;
        setWorkshopName(workshopRow?.workshop_name || "");
      } catch (err) {
        console.error("WorkshopMaterialsViewer error", err);
        setError("Could not load materials.");
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [workshopId, accessToken]);

  const hasAny = materials.length > 0;

  return (
    <div>
      <Heading1
        text={
          workshopName
            ? `Workshop materials for ${workshopName}`
            : "Workshop materials"
        }
      />

      {/* PDF Download Button */}
      {!loading && hasAny && (
        <div className="logInButtonContainer" style={{ marginBottom: 24 }}>
          <PDFDownloadLink
            document={
              <MaterialsPdfDocument
                workshopName={workshopName || "Workshop"}
                materials={materials}
                generatedDate={new Date()}
              />
            }
            fileName={`${workshopName || "workshop"}-materials.pdf`}
            className="logInButton"
            style={{ textDecoration: "none" }}
          >
            {({ loading: pdfLoading }) =>
              pdfLoading ? "Generating PDF…" : "Download PDF"
            }
          </PDFDownloadLink>
        </div>
      )}

      {loading && <div>Loading materials…</div>}
      {error && <div>{error}</div>}

      {!loading && hasAny && (
        <div>
          {materials.map((m) => {
            const key = m.material_id;
            const type = m.material_type;

            const displayType = (() => {
              switch (type) {
                case "script":
                  return "Script";
                case "scene_breakdown":
                  return "Scene breakdown";
                case "beats":
                  return "Beats";
                case "challenge_list":
                  return "Experiments";
                case "exercise_plan":
                  return "Warm ups";
                default:
                  return type || "Material";
              }
            })();

            const isScript = type === "script";
            const isBeats = type === "beats";
            const isWarmups = type === "exercise_plan";
            const isExperiments = type === "challenge_list";

            return (
              <div
                key={key}
                className="AdminAnalysisContainer"
                style={{ marginBottom: 24 }}
              >
                <h2 className="AdminAnalysisHeading">{displayType}</h2>

                {isScript && <ScriptMaterialView content={m.content} />}
                {isBeats && <BeatsMaterialView content={m.content} />}
                {isWarmups && <WarmupsMaterialView content={m.content} />}
                {isExperiments && <ExperimentsMaterialView content={m.content} />}
                {!isScript && !isBeats && !isWarmups && !isExperiments && (
                  <GenericJsonMaterialView content={m.content} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
