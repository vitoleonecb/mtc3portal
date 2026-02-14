import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import { EditorSubmitContext } from "../context/EditorSubmitContext.jsx";
import { PromptInstruction } from "../Headings.jsx";
import { DropDown, ModuleNavigator } from "../Buttons.jsx";
import { useOverlay } from "../context/OverlayContext.jsx";
import { ErrorOverlay } from "../components/ErrorOverlay.jsx";
import { classifyError } from "../errors/errorRegistry.js";
import { WorkshopReviewPanel } from "../components/WorkshopReviewPanel.jsx";

// Simple per-material-type forms for now. These mirror the Create*Template
// components used by WorkshopPromptsEditor, but emit structured JSON for
// materials that will be printed/used in rehearsal.

// Small helper for IDs that are stable enough for client-side structures.
function newId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function CreateScriptMaterialForm({ savedData, onChange }) {
  const [title, setTitle] = useState(savedData?.title || "");
  const [characters, setCharacters] = useState(savedData?.characters || []);
  const [scenes, setScenes] = useState(savedData?.scenes || []);
 
  // Ensure characters and scenes have ids
  useEffect(() => {
    setCharacters((prev) =>
      (prev || []).map((c) => (c && c.id ? c : { ...c, id: newId("char") }))
    );
    setScenes((prev) =>
      (prev || []).map((s) => ({
        ...s,
        id: s.id || newId("scene"),
        lines: (s.lines || []).map((ln) => {
          if (!ln) return { id: newId("line"), kind: "line", characterId: "", text: "", notes: "" };
          // Default existing items to "line" kind if not specified
          const kind = ln.kind || "line";
          return ln.id ? { ...ln, kind } : { ...ln, id: newId("line"), kind };
        }),
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosize all scene/line textareas in the script editor to fit content
  useLayoutEffect(() => {
    const textareas = document.querySelectorAll(
      ".ScriptMaterialEditor .SceneEditorText"
    );
    textareas.forEach((ta) => {
      if (!(ta instanceof HTMLTextAreaElement)) return;
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    });
  }, [scenes]);

  useEffect(() => {
    onChange({
      type: "script",
      content: {
        title,
        characters,
        scenes,
      },
    });
  }, [title, characters, scenes, onChange]);

  const addCharacter = () => {
    setCharacters((prev) => [...prev, { id: newId("char"), name: "" }]);
  };

  const updateCharacterName = (id, name) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  const removeCharacter = (id) => {
    setCharacters((prevChars) => {
      const nextChars = prevChars.filter((c) => c.id !== id);

      // Also remap any lines that referenced this character to a
      // remaining character if possible; otherwise leave blank.
      setScenes((prevScenes) =>
        prevScenes.map((scene) => ({
          ...scene,
          lines: (scene.lines || []).map((ln) => {
            if (ln.characterId !== id) return ln;
            const fallbackId = nextChars[0]?.id || "";
            return { ...ln, characterId: fallbackId };
          }),
        }))
      );

      return nextChars;
    });
  };

  const addScene = () => {
    setScenes((prev) => [
      ...prev,
      {
        id: newId("scene"),
        name: "Untitled scene",
        summary: "",
        lines: [],
      },
    ]);
  };

  const updateSceneField = (sceneId, field, value) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, [field]: value } : s))
    );
  };

  const removeScene = (sceneId) => {
    setScenes((prev) => prev.filter((s) => s.id !== sceneId));
  };

  const addLine = (sceneId) => {
    setScenes((prev) =>
      prev.map((s) => {
        if (s.id !== sceneId) return s;
        const lines = s.lines || [];
        return {
          ...s,
          lines: [
            ...lines,
            {
              id: newId("line"),
              kind: "line",
              characterId: characters[0]?.id || "",
              text: "",
              notes: "",
            },
          ],
        };
      })
    );
  };

  const addProse = (sceneId) => {
    setScenes((prev) =>
      prev.map((s) => {
        if (s.id !== sceneId) return s;
        const lines = s.lines || [];
        return {
          ...s,
          lines: [
            ...lines,
            {
              id: newId("prose"),
              kind: "prose",
              text: "",
              notes: "",
            },
          ],
        };
      })
    );
  };

  const updateLine = (sceneId, lineId, patch) => {
    setScenes((prev) =>
      prev.map((s) => {
        if (s.id !== sceneId) return s;
        return {
          ...s,
          lines: (s.lines || []).map((ln) =>
            ln.id === lineId ? { ...ln, ...patch } : ln
          ),
        };
      })
    );
  };

  const removeLine = (sceneId, lineId) => {
    setScenes((prev) =>
      prev.map((s) => {
        if (s.id !== sceneId) return s;
        return {
          ...s,
          lines: (s.lines || []).filter((ln) => ln.id !== lineId),
        };
      })
    );
  };

  return (
    <div className="ScriptMaterialEditor">
      {/* Title section: same pattern as workshop create name field */}
      <div className="logInButtonContainer" style={{ marginTop: 0 }}>
        <div className="QuestionProcessing" style={{ marginBottom: 8 }}>
          Script title
        </div>
        <input
          type="text"
          className="textInput"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Workshop Script: Breath & Balance"
        />
      </div>

      {/* Characters list */}
      <div className="logInButtonContainer" style={{ marginTop: 16, marginBottom: 16 }}>
        <div className="QuestionProcessing" style={{ marginBottom: 4 }}>
          Characters
        </div>
        {characters.map((c) => (
          <div
            key={c.id}
            style={{ display: "flex", gap: 8, marginBottom: 4 }}
          >
            <input
              type="text"
              className="textInput"
              style={{ flex: 1, width: "100%" }}
              value={c.name}
              onChange={(e) => updateCharacterName(c.id, e.target.value)}
              placeholder="Character name"
            />
            <button
              type="button"
              className="cancelButton"
              onClick={() => removeCharacter(c.id)}
              title="Remove character"
            >
              ×
            </button>
          </div>
        ))}
        <div className="logInButtonContainer" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="logInButton"
            onClick={addCharacter}
          >
            + Character
          </button>
        </div>
      </div>

      {/* Scenes and lines */}
      <div className="logInButtonContainer" style={{ marginTop: 0 }}>
        <div className="QuestionProcessing" style={{ marginBottom: 4 }}>
          Scenes & lines
        </div>
        {scenes.map((scene) => (
          <div
            key={scene.id}
            className="ScriptSceneContainer"
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input
                type="text"
                className="textInput"
                style={{ flex: 1 }}
                value={scene.name || ""}
                onChange={(e) => updateSceneField(scene.id, "name", e.target.value)}
                placeholder="Scene name (e.g., Opening Argument)"
              />
              <button
                type="button"
                className="cancelButton"
                onClick={() => removeScene(scene.id)}
                title="Remove scene"
              >
                ×
              </button>
            </div>
            <textarea
              className="OpenResponse SceneEditorText"
              value={scene.summary || ""}
              onChange={(e) => updateSceneField(scene.id, "summary", e.target.value)}
              placeholder="Optional scene summary or objective..."
            />
      
            {(scene.lines || []).map((ln) => (
              <div
                key={ln.id}
                className="ScriptLineRow"
              >
                {ln.kind === "prose" ? (
                  <>
                    <div className="ScriptLineHeader">
                      <div className="ButtonText">Prose</div>
                      <button
                        type="button"
                        className="cancelButton"
                        onClick={() => removeLine(scene.id, ln.id)}
                        title="Remove prose block"
                      >
                        ×
                      </button>
                    </div>
                    <textarea
                      className="OpenResponse SceneEditorText"
                      value={ln.text || ""}
                      onChange={(e) =>
                        updateLine(scene.id, ln.id, { text: e.target.value })
                      }
                      placeholder="Stage directions, beats, or notes..."
                    />
                  </>
                ) : (
                  <>
                    <div className="ScriptLineHeader">
                      <select
                        className="textInput ScriptCharacterSelect"
                        value={
                          ln.characterId || characters[0]?.id || ""
                        }
                        onChange={(e) =>
                          updateLine(scene.id, ln.id, { characterId: e.target.value })
                        }
                      >
                        {characters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name || "Unnamed"}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="cancelButton"
                        onClick={() => removeLine(scene.id, ln.id)}
                        title="Remove line"
                      >
                        ×
                      </button>
                    </div>
                    <textarea
                      className="OpenResponse SceneEditorText"
                      value={ln.text || ""}
                      onChange={(e) =>
                        updateLine(scene.id, ln.id, { text: e.target.value })
                      }
                      placeholder="Line text..."
                    />
                  </>
                )}
              </div>
            ))}

            <div className="logInButtonContainer" style={{ marginTop: 4, display: "flex", gap: 8, width: "100%" }}>
              <button
                type="button"
                className="logInButton"
                onClick={() => addLine(scene.id)}
              >
                + Line
              </button>
              <button
                type="button"
                className="logInButton"
                onClick={() => addProse(scene.id)}
              >
                + Prose
              </button>
            </div>
          </div>
        ))}

        <div className="logInButtonContainer" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="logInButton"
            onClick={addScene}
          >
            + Scene
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateBeatsForm({ savedData, onChange }) {
  const [scripts, setScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(true);
  const [scriptsError, setScriptsError] = useState("");

  const [selectedScriptId, setSelectedScriptId] = useState(
    savedData?.scriptMaterialId || ""
  );
  const [scriptTitle, setScriptTitle] = useState(savedData?.scriptTitle || "");
  const [scriptWorkshopId, setScriptWorkshopId] = useState(
    savedData?.scriptWorkshopId || null
  );
  const [scriptWorkshopName, setScriptWorkshopName] = useState(
    savedData?.scriptWorkshopName || ""
  );

  // Script content for previews
  const [scriptCharacters, setScriptCharacters] = useState([]);
  const [scenePreviews, setScenePreviews] = useState({}); // { beatSceneId: { summary, lines } }
  const [openPreviewSceneId, setOpenPreviewSceneId] = useState(null);

  // scenes: [{ id, sceneId, sceneName, beats: [{ id, name, lineRef, summary, notes }] }]
  const [scenes, setScenes] = useState(() => {
    if (Array.isArray(savedData?.scenes)) {
      return savedData.scenes.map((s) => ({
        id: s.id || newId("beat_scene"),
        sceneId: s.sceneId,
        sceneName: s.sceneName || "",
        beats: Array.isArray(s.beats)
          ? s.beats.map((b) => ({
              id: b.id || newId("beat"),
              name: b.name || "",
              lineRef: b.lineRef || "",
              summary: b.summary || "",
              notes: b.notes || "",
            }))
          : [],
      }));
    }
    return [];
  });

  const accessToken = localStorage.getItem("accessToken");

  // Load all scripts across workshops once
  useEffect(() => {
    const fetchScripts = async () => {
      setScriptsLoading(true);
      setScriptsError("");
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/materials/scripts`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const rows = Array.isArray(res.data) ? res.data : [];
        setScripts(rows);
      } catch (err) {
        console.error("CreateBeatsForm scripts error", err);
        setScriptsError("Could not load scripts.");
      } finally {
        setScriptsLoading(false);
      }
    };

    fetchScripts();
  }, [accessToken]);

  // When a script is selected, fetch its content (scenes) and
  // populate preview data. If beats scenes are empty, also seed them
  // from the script's scenes.
  useEffect(() => {
    if (!selectedScriptId) return;

    const fetchScriptDetail = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/materials/${selectedScriptId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const row = res.data;
        let content = null;
        try {
          content =
            typeof row.content_json === "string"
              ? JSON.parse(row.content_json)
              : row.content_json;
        } catch {
          content = row.content || null;
        }
        const scriptScenes = Array.isArray(content?.scenes)
          ? content.scenes
          : [];

        setScriptTitle(content?.title || row.title || "");
        setScriptWorkshopId(row.workshop_id ?? null);
        setScriptWorkshopName(row.workshop_name || "");
        setScriptCharacters(Array.isArray(content?.characters) ? content.characters : []);

        const previewMap = {};
        const mapped = scriptScenes.map((s) => {
          const internalId = s.id || newId("beat_scene");
          previewMap[internalId] = {
            summary: s.summary || "",
            lines: Array.isArray(s.lines) ? s.lines : [],
          };
          return {
            id: internalId,
            sceneId: s.id || null,
            sceneName: s.name || "Untitled scene",
            beats: [],
          };
        });

        setScenePreviews(previewMap);
        // Only seed scenes from script the first time (when empty).
        if (scenes.length === 0) {
          setScenes(mapped);
        }
      } catch (err) {
        console.error("CreateBeatsForm script detail error", err);
      }
    };

    fetchScriptDetail();
  }, [selectedScriptId, scenes.length, accessToken]);

  const autoTitle = scriptTitle
    ? `Beats for ${scriptTitle}`
    : "Beats";

  // Keep parent in sync
  useEffect(() => {
    if (!selectedScriptId) {
      onChange({
        type: "beats",
        content: {
          title: "Beats",
          scriptMaterialId: null,
          scriptTitle: "",
          scriptWorkshopId: null,
          scriptWorkshopName: "",
          scenes: [],
        },
      });
      return;
    }

    onChange({
      type: "beats",
      content: {
        title: autoTitle,
        scriptMaterialId: selectedScriptId,
        scriptTitle,
        scriptWorkshopId,
        scriptWorkshopName,
        scenes,
      },
    });
  }, [autoTitle, selectedScriptId, scriptTitle, scriptWorkshopId, scriptWorkshopName, scenes, onChange]);

  const handleScriptSelect = (_label, index) => {
    const s = scripts[index];
    if (!s) return;
    setSelectedScriptId(s.material_id);
    setScriptTitle(s.title || "");
    setScriptWorkshopId(s.workshop_id ?? null);
    setScriptWorkshopName(s.workshop_name || "");
    // Reset scenes so they will be pulled from the selected script
    setScenes([]);
  };

  const addBeat = (sceneId) => {
    setScenes((prev) =>
      prev.map((s) => {
        if (s.id !== sceneId) return s;
        return {
          ...s,
          beats: [
            ...s.beats,
            {
              id: newId("beat"),
              name: "",
              lineRef: "",
              summary: "",
              notes: "",
            },
          ],
        };
      })
    );
  };

  const updateBeat = (sceneId, beatId, patch) => {
    setScenes((prev) =>
      prev.map((s) => {
        if (s.id !== sceneId) return s;
        return {
          ...s,
          beats: s.beats.map((b) =>
            b.id === beatId ? { ...b, ...patch } : b
          ),
        };
      })
    );
  };

  const removeBeat = (sceneId, beatId) => {
    setScenes((prev) =>
      prev.map((s) => {
        if (s.id !== sceneId) return s;
        return {
          ...s,
          beats: s.beats.filter((b) => b.id !== beatId),
        };
      })
    );
  };

  const scriptOptions = scripts.map((s) => {
    const title = s.title || "Untitled script";
    const workshop = s.workshop_name || `Workshop ${s.workshop_id}`;
    // Let CSS (white-space: nowrap + text-overflow: ellipsis) handle
    // truncation so the label uses as much width as available.
    return `${title} — ${workshop}`;
  });

  return (
    <div className="ScriptMaterialEditor">
      {/* Script picker (required) */}
      <div className="logInButtonContainer" style={{ marginTop: 0 }}>
        <div className="QuestionProcessing" style={{ marginBottom: 8 }}>
          Choose script to break down
        </div>
        {scriptsLoading ? (
          <div>Loading scripts…</div>
        ) : scriptsError ? (
          <div>{scriptsError}</div>
        ) : (
          <DropDown
            options={scriptOptions}
            onSelect={handleScriptSelect}
          />
        )}
      </div>

      {!selectedScriptId && !scriptsLoading && !scriptsError && (
        <div className="logInButtonContainer" style={{ marginTop: 0 }}>
          <div className="OpenResponse no_hover">
            Select a script above to start creating beats.
          </div>
        </div>
      )}

      {selectedScriptId && (
        <>
          <div className="logInButtonContainer" style={{ marginTop: 0 }}>
            <div className="QuestionProcessing" style={{ marginBottom: 8 }}>
              Beats title
            </div>
            <div className="OpenResponse no_hover">{autoTitle}</div>
          </div>

          <div className="logInButtonContainer" style={{ marginTop: 0 }}>
            {scenes.map((scene) => (
              <div
                key={scene.id}
                className="ScriptSceneContainer"
              >
              <div className="ButtonText" style={{ marginBottom: 8 }}>
                Scene: {scene.sceneName}
              </div>

              {/* Scene preview toggle */}
              <button
                type="button"
                className="logInButton"
                style={{ marginTop: 0, marginBottom: 8 }}
                onClick={() =>
                  setOpenPreviewSceneId((curr) =>
                    curr === scene.id ? null : scene.id
                  )
                }
              >
                {openPreviewSceneId === scene.id
                  ? "Hide scene text"
                  : "Show scene text"}
              </button>

              {openPreviewSceneId === scene.id && (
                <div
                  className="OpenResponse no_hover"
                  style={{ marginBottom: 8 }}
                >
                  {(() => {
                    const preview = scenePreviews[scene.id];
                    if (!preview) return null;
                    const lines = Array.isArray(preview.lines)
                      ? preview.lines
                      : [];

                    return (
                      <div>
                        {preview.summary && (
                          <p style={{ marginBottom: 8 }}>
                            {preview.summary}
                          </p>
                        )}
                        {lines.length > 0 && (
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {lines.map((ln) => {
                              const key = ln.id || ln.text;
                              const kind = ln.kind || "line";
                              if (kind === "prose") {
                                return (
                                  <li
                                    key={key}
                                    style={{
                                      marginBottom: 4,
                                      fontStyle: "italic",
                                    }}
                                  >
                                    {ln.text}
                                  </li>
                                );
                              }

                              const ch = scriptCharacters.find(
                                (c) => c.id === ln.characterId
                              );
                              const label = ch?.name || "";

                              return (
                                <li key={key} style={{ marginBottom: 4 }}>
                                  {label && (
                                    <span style={{ fontWeight: 600 }}>
                                      {label}: 
                                    </span>
                                  )}
                                  <span>{ln.text}</span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {scene.beats.map((beat) => (
                <div
                  key={beat.id}
                  style={{
                    border: "1px solid #000",
                    borderRadius: 10,
                    padding: 8,
                    marginBottom: 8,
                    backgroundColor: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <input
                      type="text"
                      className="textInput"
                      style={{ flex: 1 }}
                      value={beat.name}
                      onChange={(e) =>
                        updateBeat(scene.id, beat.id, {
                          name: e.target.value,
                        })
                      }
                      placeholder="Beat title"
                    />
                    <button
                      type="button"
                      className="cancelButton"
                      onClick={() => removeBeat(scene.id, beat.id)}
                      title="Remove beat"
                    >
                      ×
                    </button>
                  </div>

                  <input
                    type="text"
                    className="textInput"
                    style={{ width: "100%", marginBottom: 8 }}
                    value={beat.lineRef}
                    onChange={(e) =>
                      updateBeat(scene.id, beat.id, {
                        lineRef: e.target.value,
                      })
                    }
                    placeholder="Line reference (e.g., Lines 3–10 or From You sure? to Fine.)"
                  />

                  <textarea
                    className="OpenResponse SceneEditorText"
                    value={beat.summary}
                    onChange={(e) =>
                      updateBeat(scene.id, beat.id, {
                        summary: e.target.value,
                      })
                    }
                    placeholder="Beat summary — what shifts in this moment?"
                  />

                  <textarea
                    className="OpenResponse SceneEditorText"
                    value={beat.notes}
                    onChange={(e) =>
                      updateBeat(scene.id, beat.id, {
                        notes: e.target.value,
                      })
                    }
                    placeholder="Optional notes, playable actions, or variations…"
                  />
                </div>
              ))}

              <div className="logInButtonContainer" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="logInButton"
                  onClick={() => addBeat(scene.id)}
                >
                  + Beat
                </button>
              </div>
            </div>
          ))}
          </div>
        </>
      )}
    </div>
  );
}

function CreateExperimentsForm({ savedData, onChange, workshopName }) {
  const [constraints, setConstraints] = useState(() => {
    const raw = Array.isArray(savedData?.constraints) ? savedData.constraints : [];
    return raw.map((c) => ({
      id: c.id || newId("constraint"),
      name: c.name || c.label || "",
    }));
  });

  const [liberties, setLiberties] = useState(() => {
    const raw = Array.isArray(savedData?.liberties) ? savedData.liberties : [];
    return raw.map((l) => ({
      id: l.id || newId("liberty"),
      name: l.name || l.label || "",
    }));
  });

  const [experiments, setExperiments] = useState(() => {
    const raw = Array.isArray(savedData?.experiments) ? savedData.experiments : [];
    return raw.map((exp) => ({
      id: exp.id || newId("experiment"),
      name: exp.name || "",
      constraintId: exp.constraintId || "",
      libertyId: exp.libertyId || "",
      description: exp.description || "",
    }));
  });

  const autoTitle = workshopName
    ? `Experiments for ${workshopName}`
    : "Experiments";

  // Autosize experiment description textareas like other SceneEditorText fields
  useLayoutEffect(() => {
    const textareas = document.querySelectorAll(
      ".ExperimentsEditor .SceneEditorText"
    );
    textareas.forEach((ta) => {
      if (!(ta instanceof HTMLTextAreaElement)) return;
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    });
  }, [experiments, autoTitle]);

  useEffect(() => {
    onChange({
      type: "challenge_list",
      content: { title: autoTitle, constraints, liberties, experiments },
    });
  }, [autoTitle, constraints, liberties, experiments, onChange]);

  const addConstraint = () => {
    setConstraints((prev) => [...prev, { id: newId("constraint"), name: "" }]);
  };

  const updateConstraintName = (id, name) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  const removeConstraint = (id) => {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
    // Clear this constraint from any experiments that referenced it
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.constraintId === id ? { ...exp, constraintId: "" } : exp
      )
    );
  };

  const addLiberty = () => {
    setLiberties((prev) => [...prev, { id: newId("liberty"), name: "" }]);
  };

  const updateLibertyName = (id, name) => {
    setLiberties((prev) =>
      prev.map((l) => (l.id === id ? { ...l, name } : l))
    );
  };

  const removeLiberty = (id) => {
    setLiberties((prev) => prev.filter((l) => l.id !== id));
    // Clear this liberty from any experiments that referenced it
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.libertyId === id ? { ...exp, libertyId: "" } : exp
      )
    );
  };

  const addExperiment = () => {
    setExperiments((prev) => [
      ...prev,
      {
        id: newId("experiment"),
        name: "",
        constraintId: "",
        libertyId: "",
        description: "",
      },
    ]);
  };

  const updateExperimentField = (id, field, value) => {
    setExperiments((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const removeExperiment = (id) => {
    setExperiments((prev) => prev.filter((exp) => exp.id !== id));
  };

  return (
    <div className="ExperimentsEditor">
      {/* Title */}
      <div className="logInButtonContainer" style={{ marginTop: 0 }}>
        <div className="QuestionProcessing" style={{ marginBottom: 8 }}>
          Experiments title
        </div>
        <div className="OpenResponse no_hover">{autoTitle}</div>
      </div>

      {/* Constraints list */}
      <div
        className="logInButtonContainer"
        style={{ marginTop: 0, marginBottom: 16 }}
      >
        <div className="QuestionProcessing" style={{ marginBottom: 4 }}>
          Constraints
        </div>
        {constraints.map((c) => (
          <div
            key={c.id}
            style={{ display: "flex", gap: 8, marginBottom: 4 }}
          >
            <input
              type="text"
              className="textInput"
              style={{ flex: 1, width: "100%" }}
              value={c.name}
              onChange={(e) => updateConstraintName(c.id, e.target.value)}
              placeholder="Constraint"
            />
            <button
              type="button"
              className="cancelButton"
              onClick={() => removeConstraint(c.id)}
              title="Remove constraint"
            >
              ×
            </button>
          </div>
        ))}
        <div className="logInButtonContainer" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="logInButton"
            onClick={addConstraint}
          >
            + Constraint
          </button>
        </div>
      </div>

      {/* Liberties list */}
      <div
        className="logInButtonContainer"
        style={{ marginTop: 0, marginBottom: 16 }}
      >
        <div className="QuestionProcessing" style={{ marginBottom: 4 }}>
          Liberties
        </div>
        {liberties.map((l) => (
          <div
            key={l.id}
            style={{ display: "flex", gap: 8, marginBottom: 4 }}
          >
            <input
              type="text"
              className="textInput"
              style={{ flex: 1, width: "100%" }}
              value={l.name}
              onChange={(e) => updateLibertyName(l.id, e.target.value)}
              placeholder="Liberty"
            />
            <button
              type="button"
              className="cancelButton"
              onClick={() => removeLiberty(l.id)}
              title="Remove liberty"
            >
              ×
            </button>
          </div>
        ))}
        <div className="logInButtonContainer" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="logInButton"
            onClick={addLiberty}
          >
            + Liberty
          </button>
        </div>
      </div>

      {/* Experiments list */}
      <div className="logInButtonContainer" style={{ marginTop: 0 }}>
        <div className="QuestionProcessing" style={{ marginBottom: 4 }}>
          Experiments
        </div>
        {experiments.map((exp) => (
          <div key={exp.id} className="ScriptSceneContainer">
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <input
                type="text"
                className="textInput"
                style={{ flex: 1 }}
                value={exp.name}
                onChange={(e) =>
                  updateExperimentField(exp.id, "name", e.target.value)
                }
                placeholder="Experiment title"
              />
              <button
                type="button"
                className="cancelButton"
                onClick={() => removeExperiment(exp.id)}
                title="Remove experiment"
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <DropDown
                options={constraints.map((c) => c.name || "Untitled")}
                onSelect={(_label, index) => {
                  const target = constraints[index];
                  updateExperimentField(
                    exp.id,
                    "constraintId",
                    target ? target.id : ""
                  );
                }}
              />

              <DropDown
                options={liberties.map((l) => l.name || "Untitled")}
                onSelect={(_label, index) => {
                  const target = liberties[index];
                  updateExperimentField(
                    exp.id,
                    "libertyId",
                    target ? target.id : ""
                  );
                }}
              />
            </div>

            <textarea
              className="OpenResponse SceneEditorText"
              style={{ marginTop: 4 }}
              value={exp.description || ""}
              onChange={(e) =>
                updateExperimentField(exp.id, "description", e.target.value)
              }
              placeholder="Experiment goal or description..."
            />
          </div>
        ))}

        <div className="logInButtonContainer" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="logInButton"
            onClick={addExperiment}
          >
            + Experiment
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateExercisePlanForm({ savedData, onChange, workshopName }) {
  const [warmups, setWarmups] = useState(() => {
    if (Array.isArray(savedData?.warmups)) return savedData.warmups;
    if (Array.isArray(savedData?.exercises)) {
      return savedData.exercises.map((ex) => {
        if (typeof ex === "string") {
          return { id: newId("warmup"), description: ex };
        }
        return {
          id: ex.id || newId("warmup"),
          description: ex.description || "",
        };
      });
    }
    return [];
  });

  const autoTitle = workshopName
    ? `Warm Ups for ${workshopName}`
    : "Warm Ups";

  // Autosize warm-up description textareas like other SceneEditorText fields
  useLayoutEffect(() => {
    const textareas = document.querySelectorAll(
      ".WarmupsEditor .SceneEditorText"
    );
    textareas.forEach((ta) => {
      if (!(ta instanceof HTMLTextAreaElement)) return;
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    });
  }, [warmups, autoTitle]);

  useEffect(() => {
    onChange({ type: "exercise_plan", content: { title: autoTitle, warmups } });
  }, [autoTitle, warmups, onChange]);

  const addWarmup = () => {
    setWarmups((prev) => [...prev, { id: newId("warmup"), description: "" }]);
  };

  const updateWarmup = (id, description) => {
    setWarmups((prev) =>
      prev.map((w) => (w.id === id ? { ...w, description } : w))
    );
  };

  const removeWarmup = (id) => {
    setWarmups((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="WarmupsEditor">
      <div className="logInButtonContainer" style={{ marginTop: 0 }}>
        <div className="QuestionProcessing" style={{ marginBottom: 8 }}>
          Warm-ups title
        </div>
        <div className="OpenResponse no_hover">{autoTitle}</div>
      </div>

      {warmups.map((w, index) => (
        <div
          key={w.id}
          className="logInButtonContainer"
          style={{ marginTop: 0 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <div className="ButtonText">{`Warm Up ${index + 1}`}</div>
            <button
              type="button"
              className="cancelButton"
              onClick={() => removeWarmup(w.id)}
              title="Remove warm up"
            >
              ×
            </button>
          </div>
          <textarea
            className="OpenResponse SceneEditorText"
            value={w.description || ""}
            onChange={(e) => updateWarmup(w.id, e.target.value)}
            placeholder="Description"
          />
        </div>
      ))}

      <div className="logInButtonContainer" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="logInButton"
          onClick={addWarmup}
        >
          + Warm Up
        </button>
      </div>
    </div>
  );
}

export function WorkshopMaterialsEditor() {
  const { workshopId } = useParams();
  const setSubmitHandler = useContext(EditorSubmitContext);
  const { show } = useOverlay();

  const [materialsList, setMaterialsList] = useState([]);
  const [workshopName, setWorkshopName] = useState("");
  const [materialIndex, setMaterialIndex] = useState(0);
  const [dropDownReset, setDropDownReset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedPromptId, setSelectedPromptId] = useState(null);

  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchWorkshop = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/workshops/${workshopId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const row = Array.isArray(res.data) ? res.data[0] : null;
        setWorkshopName(row?.workshop_name || "");
      } catch (error) {
        console.error("Failed to fetch workshop name for materials editor", error);
        setWorkshopName("");
      }
    };

    fetchWorkshop();
  }, [workshopId, accessToken]);

  useEffect(() => {
    setSubmitHandler(() => handleSubmit);
    return () => setSubmitHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialsList, materialIndex]);

  const handleSubmit = async () => {
    if (!materialsList.length) return;

    setIsSubmitting(true);
    try {
      const payload = {
        materials: materialsList.map((m) => ({
          type: m.material_type,
          title: m.title || "",
          // Materials are workshop-level only; no module association.
          content: m.content,
        })),
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/materials/workshops/${workshopId}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setSubmissionSuccess(true);
    } catch (error) {
      const classification = classifyError(error, { hint: "MATERIALS_SAVE_FAILED" });
      show(<ErrorOverlay classification={classification} />);
      console.error("Materials save error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaterialTypeSelect = (label) => {
    const typeMap = {
      Script: "script",
      Beats: "beats",
      Experiments: "challenge_list",
      "Warm Ups": "exercise_plan",
    };

    const materialType = typeMap[label];
    if (!materialType) return;

    const base = {
      material_type: materialType,
      title: "",
      // Materials live at the workshop level; no module linkage persisted.
      content: {},
    };

    const updated = [...materialsList];
    updated[materialIndex] = base;
    setMaterialsList(updated);
  };

  const handleNext = () => {
    if (!materialsList[materialIndex]) {
      alert("Please select a material type before proceeding.");
      return;
    }
    setMaterialIndex((prev) => prev + 1);
    setDropDownReset((prev) => !prev);
  };

  const handleBack = () => {
    setMaterialIndex((prev) => Math.max(0, prev - 1));
  };

  const isFirst = materialIndex === 0;

  const renderMaterialForm = () => {
    const m = materialsList[materialIndex];
    if (!m) {
      return <div>Please choose a material type to begin.</div>;
    }

    const commonProps = {
      savedData: {
        title: m.title,
        ...m.content,
      },
      onChange: (updated) => {
        const updatedList = [...materialsList];
        updatedList[materialIndex] = {
          ...updatedList[materialIndex],
          material_type: updated.type,
          content: updated.content,
          title: updated.content?.title || updatedList[materialIndex].title || "",
        };
        setMaterialsList(updatedList);
      },
    };

    switch (m.material_type) {
      case "script":
        return <CreateScriptMaterialForm {...commonProps} />;
      case "beats":
        return <CreateBeatsForm {...commonProps} />;
      case "challenge_list":
        return (
          <CreateExperimentsForm
            {...commonProps}
            workshopName={workshopName}
          />
        );
      case "exercise_plan":
        return (
          <CreateExercisePlanForm
            {...commonProps}
            workshopName={workshopName}
          />
        );
      default:
        return <div>Unknown material type.</div>;
    }
  };

  if (submissionSuccess) {
    return <div>Materials saved for this workshop.</div>;
  }

  return (
    <div className="WorkshopMaterialsLayout">
      <div className="WorkshopMaterialsEditorPane">
        {isSubmitting && <div>Submitting materials…</div>}
        <PromptInstruction
          question={
            workshopName
              ? `Create materials for ${workshopName}`
              : `Create materials for workshop ${workshopId}`
          }
        />
        <DropDown
          reset={dropDownReset}
          onSelect={handleMaterialTypeSelect}
          options={["Script", "Beats", "Experiments", "Warm Ups"]}
        />
        {materialsList[materialIndex] && renderMaterialForm()}
        <ModuleNavigator
          backActive={isFirst}
          backClick={handleBack}
          nextClick={handleNext}
        />
      </div>

      <div className="WorkshopMaterialsReferencePane">
        <WorkshopReviewPanel
          workshopId={workshopId}
          selectedModuleId={selectedModuleId}
          selectedPromptId={selectedPromptId}
          onModuleChange={setSelectedModuleId}
          onPromptChange={setSelectedPromptId}
        />
      </div>
    </div>
  );
}