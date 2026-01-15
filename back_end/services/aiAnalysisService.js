import { connection } from '../app.js';

// NOTE: This file wires prompt-level AI analysis into the backend.
// Actual calls to an external LLM provider should be implemented
// where the placeholder "callLLM" is used.

// ---- DB HELPERS -------------------------------------------------

export async function getPromptAIAnalysis(promptId) {
  const [rows] = await connection.query(
    'SELECT analysis_json, template_id, analysis_version, created_at, updated_at FROM prompt_ai_analysis WHERE workshop_prompt_id = ? ORDER BY analysis_version DESC, updated_at DESC LIMIT 1',
    [promptId]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  let payload;
  try {
    payload = typeof row.analysis_json === 'string'
      ? JSON.parse(row.analysis_json)
      : row.analysis_json;
  } catch (e) {
    // If JSON parse fails, just return null rather than break the UI
    console.error('Failed to parse analysis_json for prompt', promptId, e);
    return null;
  }

  return {
    promptId: Number(promptId),
    templateId: row.template_id,
    analysisVersion: row.analysis_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...payload,
  };
}

export async function upsertPromptAIAnalysis({
  promptId,
  templateId,
  analysisVersion = 1,
  analysisPayload,
}) {
  const json = JSON.stringify(analysisPayload ?? {});

  // Simple UPSERT by prompt id + version; adjust once schema is finalized
  await connection.query(
    `
    INSERT INTO prompt_ai_analysis
      (workshop_prompt_id, template_id, analysis_version, analysis_json)
    VALUES
      (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      template_id = VALUES(template_id),
      analysis_version = VALUES(analysis_version),
      analysis_json = VALUES(analysis_json),
      updated_at = CURRENT_TIMESTAMP
    `,
    [promptId, templateId, analysisVersion, json]
  );
}

// ---- PROMPT BUILDERS (LLM REQUEST SHAPING) ----------------------

// These builders shape the inputs/outputs for the LLM. The actual
// HTTP call to the model is intentionally left as a TODO so we can
// plug in whatever provider you choose.

function buildBaseSystemPrompt() {
  return `You analyze audience responses for an experimental theater workshop. Your job is to describe patterns in language and imagery without making value judgments or recommendations. You prioritize multiplicity and ambiguity. Never say what the piece should be; only describe what is present or absent.`;
}

export function buildShortResponsePrompt({ promptText, responses }) {
  const system = buildBaseSystemPrompt();

  const user = {
    role: 'user',
    content: [
      {
        type: 'text',
        text:
          'You are given one prompt and a list of anonymous responses. Your job is to describe patterns only. Return JSON with fields: word_bubbles, labels, free_text_summary as previously specced. Do NOT include any natural language outside the JSON.',
      },
      {
        type: 'text',
        text: `Prompt: ${promptText}`,
      },
      {
        type: 'text',
        text:
          'Responses (each with an id):\n' +
          responses
            .map((r) => `ID ${r.id}: ${r.text}`)
            .join('\n'),
      },
    ],
  };

  return {
    system,
    messages: [user],
  };
}

// TODO: add builders for MC, Checklist, DragAndDrop as needed.

// ---- LLM CALL (PLACEHOLDER) ------------------------------------

async function callLLM(promptConfig) {
  // TODO: integrate with your chosen LLM provider here.
  // For now, return a stub shape so the rest of the pipeline can be wired
  // and the UI can be developed without incurring model costs.
  console.warn('callLLM is currently a stub; returning empty analysis.');

  return {
    word_bubbles: { keywords: [], phrases: [] },
    labels: { labels: [] },
    similarities: { pairs: [], clusters: [] },
    free_text_summary: {
      tones: [],
      motifs: [],
      absences: [],
      questions: [],
    },
  };
}

// ---- HIGH-LEVEL ANALYSIS ENTRY POINT ---------------------------

export async function runPromptAIAnalysis({ promptId, templateId }) {
  // Fetch prompt + responses in a generic way
  const [[promptRow]] = await connection.query(
    'SELECT workshop_prompt_id, prompt_template_id, workshop_prompt_options, workshop_prompt_reference FROM workshop_prompts WHERE workshop_prompt_id = ?',
    [promptId]
  );

  if (!promptRow) {
    console.warn('runPromptAIAnalysis: prompt not found', promptId);
    return;
  }

  const [responseRows] = await connection.query(
    'SELECT workshop_response_id, workshop_response_content FROM workshop_responses WHERE workshop_prompt_id = ?',
    [promptId]
  );

  const responses = responseRows.map((row) => {
    let parsed;
    try {
      parsed = typeof row.workshop_response_content === 'string'
        ? JSON.parse(row.workshop_response_content)
        : row.workshop_response_content;
    } catch (e) {
      parsed = row.workshop_response_content;
    }
    return {
      id: row.workshop_response_id,
      raw: row.workshop_response_content,
      parsed,
    };
  });

  // For now, handle only free-text-ish templates via a simple projection
  // and rely on the short-response builder.
  const freeTextBodies = responses.map((r) => ({
    id: r.id,
    text: typeof r.parsed === 'string' ? r.parsed : JSON.stringify(r.parsed),
  }));

  const promptConfig = buildShortResponsePrompt({
    promptText:
      promptRow.workshop_prompt_reference ||
      (promptRow.workshop_prompt_options &&
        typeof promptRow.workshop_prompt_options === 'string'
        ? promptRow.workshop_prompt_options
        : ''),
    responses: freeTextBodies,
  });

  const analysis = await callLLM(promptConfig);

  await upsertPromptAIAnalysis({
    promptId,
    templateId: templateId ?? promptRow.prompt_template_id,
    analysisVersion: 1,
    analysisPayload: analysis,
  });
}