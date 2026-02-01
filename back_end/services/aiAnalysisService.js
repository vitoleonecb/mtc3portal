import { connection } from '../app.js';

// NOTE: This file wires prompt-level AI analysis into the backend.
// Actual calls to an external LLM provider should be implemented
// where the placeholder "callLLM" is used.

// ---- DB HELPERS -------------------------------------------------

export async function getPromptAIAnalysis(promptId) {
  const [rows] = await connection.query(
    'SELECT analysis_json, prompt_template_id AS template_id, analysis_version, created_at, updated_at FROM prompt_ai_analysis WHERE workshop_prompt_id = ? ORDER BY analysis_version DESC, updated_at DESC LIMIT 1',
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
      (workshop_prompt_id, prompt_template_id, analysis_version, analysis_json)
    VALUES
      (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      prompt_template_id = VALUES(prompt_template_id),
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

// The following builders are intentionally very explicit so you can
// tweak the wording for each analysis pass (bubbles, etc.).

export function buildShortResponseWordBubblesPrompt({ promptText, responses }) {
  const system = buildBaseSystemPrompt();

  const instructions = `You are analyzing open-text responses to a single prompt.
Your task in this call is ONLY to identify notable words and short phrases.

Requirements:
- Focus on language that recurs or feels especially salient across multiple responses.
- Prefer concrete nouns, verbs, and short 2–5 word phrases over long sentences.
- Do NOT interpret or explain why they appear; just surface the language itself.
- Do NOT rank or judge responses.

Output JSON shape:
{
  "word_bubbles": {
    "keywords": [ { "text": string, "weight": number } ],
    "phrases": [ { "text": string, "weight": number } ]
  }
}

Where weight is a number from 0 to 1 indicating relative salience.
Return ONLY valid JSON matching this shape, with no extra keys and no commentary.`;

  const user = {
    role: 'user',
    content: [
      { type: 'text', text: instructions },
      { type: 'text', text: `Prompt: ${promptText}` },
      {
        type: 'text',
        text:
          'Responses (each with an id):\n' +
          responses.map((r) => `ID ${r.id}: ${r.text}`).join('\n'),
      },
    ],
  };

  return { system, messages: [user] };
}

export function buildShortResponseLabelsPrompt({ promptText, responses }) {
  const system = buildBaseSystemPrompt();

  const instructions = `You are analyzing open-text responses to a single prompt.
Your task in this call is ONLY to propose neutral thematic labels and assign them to responses.

Requirements:
- Propose 3–6 short, neutral labels that describe recurring patterns in imagery, tone, or situation.
  Examples of good labels: "Containment", "Rupture", "Witnessing", "Stalemate".
- Labels must not describe quality (no "good", "bad", "strong", "weak").
- For each label, select the response ids that clearly fit it; responses may belong to multiple labels.
- It is fine for some responses to have no labels.

Output JSON shape:
{
  "labels": {
    "labels": [
      {
        "id": string,              // machine-friendly slug, e.g. "containment"
        "display": string,         // human label, e.g. "Containment"
        "description": string,     // 1-sentence description
        "responseIds": number[]    // list of response ids that fit this label
      }
    ]
  }
}

Return ONLY valid JSON matching this shape, with no extra keys and no commentary.`;

  const user = {
    role: 'user',
    content: [
      { type: 'text', text: instructions },
      { type: 'text', text: `Prompt: ${promptText}` },
      {
        type: 'text',
        text:
          'Responses (each with an id):\n' +
          responses.map((r) => `ID ${r.id}: ${r.text}`).join('\n'),
      },
    ],
  };

  return { system, messages: [user] };
}

export function buildShortResponseSimilaritiesPrompt({ promptText, responses }) {
  const system = buildBaseSystemPrompt();

  const instructions = `You are analyzing open-text responses to a single prompt.
Your task in this call is ONLY to describe similarity relationships between responses.

Requirements:
- Think in terms of "echoes" or "clusters" rather than exact matches.
- Identify pairs of responses that feel strongly related in imagery, tone, or situation.
- For each pair, assign a similarity score from 0 to 1 (1 = extremely similar).
- Optionally group responses into clusters when three or more are closely related.
- Do NOT describe which responses are better or worse; focus only on similarity.

Output JSON shape:
{
  "similarities": {
    "pairs": [ { "a": number, "b": number, "score": number } ],
    "clusters": [ { "clusterId": string, "responseIds": number[], "labelId": string | null } ]
  }
}

Return ONLY valid JSON matching this shape, with no extra keys and no commentary.`;

  const user = {
    role: 'user',
    content: [
      { type: 'text', text: instructions },
      { type: 'text', text: `Prompt: ${promptText}` },
      {
        type: 'text',
        text:
          'Responses (each with an id):\n' +
          responses.map((r) => `ID ${r.id}: ${r.text}`).join('\n'),
      },
    ],
  };

  return { system, messages: [user] };
}

export function buildShortResponseSummaryPrompt({ promptText, responses }) {
  const system = buildBaseSystemPrompt();

  const instructions = `You are analyzing open-text responses to a single prompt.
Your task in this call is ONLY to describe overall tones, motifs, absences, and open questions.

Requirements:
- Tones: short adjectives for the emotional or energetic feel (e.g. "tense", "hesitant", "playful").
- Motifs: recurring images, objects, or situations (e.g. "doors", "breath", "waiting").
- Absences: things that are strikingly missing compared to what might normally appear.
- Questions: 2–5 open questions a director or facilitator might carry into rehearsal.
- Do NOT recommend a specific interpretation or direction; keep everything suggestive, not prescriptive.

Output JSON shape:
{
  "free_text_summary": {
    "tones": string[],
    "motifs": string[],
    "absences": string[],
    "questions": string[]
  }
}

Return ONLY valid JSON matching this shape, with no extra keys and no commentary.`;

  const user = {
    role: 'user',
    content: [
      { type: 'text', text: instructions },
      { type: 'text', text: `Prompt: ${promptText}` },
      {
        type: 'text',
        text:
          'Responses (each with an id):\n' +
          responses.map((r) => `ID ${r.id}: ${r.text}`).join('\n'),
      },
    ],
  };

  return { system, messages: [user] };
}

// Secondary pass: synthesize existing analysis into a single concise paragraph.
export function buildShortResponseSynthesisPrompt({ promptText, analysis }) {
  const { word_bubbles, labels, similarities, free_text_summary } = analysis;

  const topKeywords = (word_bubbles?.keywords || [])
    .slice()
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 5);

  const topPhrases = (word_bubbles?.phrases || [])
    .slice()
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 5);

  const topLabels = (labels?.labels || [])
    .slice()
    .sort((a, b) => (b.responseIds?.length || 0) - (a.responseIds?.length || 0))
    .reverse()
    .slice(0, 4);

  const {
    tones = [],
    motifs = [],
    absences = [],
    questions = [],
  } = free_text_summary || {};

  const system = `${buildBaseSystemPrompt()}
You are given an existing analysis of responses for one prompt. The analysis already contains:
- A list of salient keywords and short phrases.
- Neutral thematic labels.
- Lists of tones, recurring motifs, notable absences, and open questions.

Your task in this call is ONLY to synthesize that analysis into ONE concise paragraph (80-150 words) that:
- Names the most important tones and emotional qualities.
- Mentions 2-4 of the strongest recurring images/ideas/situations.
- Briefly notes any striking absences or tensions that emerge.
- Uses descriptive, non-prescriptive language (no advice, no value judgments).
- Does not introduce new interpretations beyond what is clearly implied by the data.

Output JSON shape:
{
  "concise_summary": string
}

Return ONLY valid JSON matching this shape, with no extra keys and no commentary.`;

  const user = {
    role: 'user',
    content: [
      {
        type: 'text',
        text:
          `Prompt: ${promptText}` +
          "\n\nExisting analysis (already aggregated, for context):\n" +
          JSON.stringify(
            {
              keywords: topKeywords,
              phrases: topPhrases,
              labels: topLabels,
              tones,
              motifs,
              absences,
              questions,
            },
            null,
            2
          ),
      },
    ],
  };

  return { system, messages: [user] };
}

// TODO: add builders for MC, Checklist, DragAndDrop as needed.

// ----------------- DnD-specific AI prompt builders -----------------

function buildDragAndDropSpectrumPrompt({ promptText, analytics }) {
  const axis = analytics.axes?.x || analytics.axes?.X || {};
  const labelMin = axis.labelMin || 'Left';
  const labelMax = axis.labelMax || 'Right';

  const system =
    'You are an expert theatre facilitator and data analyst. ' +
    'You analyze how participants position items along conceptual spectrums. ' +
    'You respond ONLY with JSON following the specified schema.';

  const user = {
    role: 'user',
    content: [
      {
        type: 'text',
        text:
          'The prompt asked participants to place items along a 1D spectrum between "' +
          labelMin + '" (0.0) and "' + labelMax + '" (1.0).\\n' +
          'You may see the word "token" in the data; it just means an item.\\n' +
          'Do NOT use the words "token" or "tokens" in your output. Say "items" or "elements" instead.\\n' +
          'Below is aggregated data by item. Each one has a mean score, standard deviation, and bucketed counts.\\n' +
          'Prompt text (if any): ' + (promptText || '(none provided)') + '\\n' +
          'Analytics JSON:\\n' + JSON.stringify(analytics, null, 2) + '\\n\\n' +
          'Return a JSON object with this shape: {"free_text_summary": {"tones": [], "motifs": [], "absences": []}}.\\n' +
          'Keep every entry in these lists short and concrete (ideally under 12 words).\\n' +
          'Use at most 4 items per list; leave a list empty if nothing is clear.\\n' +
          'Avoid metaphor and evaluative language; describe only what is present.\\n' +
          'Interpret "tones" as short descriptors of how items cluster on the spectrum and "motifs" as repeated placement patterns,\\n' +
          'and use "absences" for notable gaps or underused regions on the spectrum.'
      },
    ],
  };

  return { system, messages: [user] };
}

function buildDragAndDropZonesPrompt({ promptText, analytics }) {
  const system =
    'You are an expert theatre facilitator and data analyst. ' +
    'You analyze how participants place items into named spatial zones. ' +
    'You respond ONLY with JSON following the specified schema.';

  const user = {
    role: 'user',
    content: [
      {
        type: 'text',
        text:
          'The prompt asked participants to drag items into a grid of named zones (cells).\\n' +
          'You may see the word "token" in the data; it just means an item.\\n' +
          'Do NOT use the words "token" or "tokens" in your output. Say "items" or "elements" instead.\\n' +
          'Below is aggregated data per zone and per item. Zones often correspond to areas of the stage or set.\\n' +
          'Prompt text (if any): ' + (promptText || '(none provided)') + '\\n' +
          'Analytics JSON:\\n' + JSON.stringify(analytics, null, 2) + '\\n\\n' +
          'Return a JSON object with this shape: {"free_text_summary": {"tones": [], "motifs": [], "absences": []}}.\\n' +
          'Keep every entry in these lists short and concrete (ideally under 12 words).\\n' +
          'Use at most 4 items per list; leave a list empty if nothing is clear.\\n' +
          'Avoid metaphor and evaluative language; describe only what is present.\\n' +
          'Interpret "tones" as short descriptors of overall placement feel (for example, most items clustering in one area),\\n' +
          '"motifs" as repeated patterns in how items and zones relate (for example, certain characters always sharing a zone),\\n' +
          'and "absences" as zones or item–zone combinations that are rarely used.'
      },
    ],
  };

  return { system, messages: [user] };
}

function buildDragAndDropFreePrompt({ promptText, analytics }) {
  const system =
    'You are an expert theatre facilitator and data analyst. ' +
    'You analyze how participants place items freely on a 2D stage map. ' +
    'You respond ONLY with JSON following the specified schema.';

  const user = {
    role: 'user',
    content: [
      {
        type: 'text',
        text:
          'The prompt asked participants to drag items freely within a 2D rectangular space (normalized 0–1 x/y).\\n' +
          'You may see the word "token" in the data; it just means an item.\\n' +
          'Do NOT use the words "token" or "tokens" in your output. Say "items" or "elements" instead.\\n' +
          'Below is aggregated data per item, including centroids and individual points.\\n' +
          'Prompt text (if any): ' + (promptText || '(none provided)') + '\\n' +
          'Analytics JSON:\\n' + JSON.stringify(analytics, null, 2) + '\\n\\n' +
          'Return a JSON object with this shape: {"free_text_summary": {"tones": [], "motifs": [], "absences": []}}.\\n' +
          'Keep every entry in these lists short and concrete (ideally under 12 words).\\n' +
          'Use at most 4 items per list; leave a list empty if nothing is clear.\\n' +
          'Avoid metaphor and evaluative language; describe only what is present.\\n' +
          'Interpret "tones" as overall spatial feel (for example, characters clustering in one region),\\n' +
          '"motifs" as repeated spatial patterns (for example, two elements often ending up near each other),\\n' +
          'and "absences" as empty or underused areas in the space.'
      },
    ],
  };

  return { system, messages: [user] };
}

// ----------------- Numeric DnD similarity helpers -----------------

function buildNumericDnDSimilarities({ responses, layout }) {
  // Normalize layout string
  const mode = layout || 'free';

  // Collect a stable list of token keys across all responses
  const tokenSet = new Set();
  const perResponseItems = new Map(); // id -> items[]

  responses.forEach((r) => {
    const items = Array.isArray(r.parsed)
      ? r.parsed
      : (r.parsed ? [r.parsed] : []);
    perResponseItems.set(r.id, items);

    items.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const key = item.keyName || item.label;
      if (key) tokenSet.add(String(key));
    });
  });

  const tokenKeys = Array.from(tokenSet).sort();
  const vectors = new Map(); // id -> number[]

  if (tokenKeys.length === 0 || responses.length === 0) {
    return {
      similarities: { pairs: [], clusters: [] },
      unusualness: {},
    };
  }

  if (mode === 'x-spectrum') {
    // Each token gets a scalar scoreX in [0,1]
    responses.forEach((r) => {
      const items = perResponseItems.get(r.id) || [];
      const vec = [];
      tokenKeys.forEach((token) => {
        const item = items.find((it) => {
          if (!it || typeof it !== 'object') return false;
          const key = it.keyName || it.label;
          return key && String(key) === token;
        }) || {};
        const s = item.semantics || {};
        let score = typeof s.scoreX === 'number' ? s.scoreX : item.position?.x;
        if (typeof score !== 'number' || !Number.isFinite(score)) score = 0.5;
        score = Math.min(Math.max(score, 0), 1);
        vec.push(score);
      });
      vectors.set(r.id, vec);
    });
  } else if (mode === 'grid-zones') {
    // Tokens are placed into categorical zones; compare based on zone match
    const zoneSet = new Set();
    responses.forEach((r) => {
      const items = perResponseItems.get(r.id) || [];
      items.forEach((item) => {
        const s = item?.semantics || {};
        const zl = s.zoneLabel || s.zoneId;
        if (zl) zoneSet.add(String(zl));
      });
    });
    const zoneLabels = Array.from(zoneSet).sort();
    const noneIndex = zoneLabels.length; // extra bucket for "no placement"

    responses.forEach((r) => {
      const items = perResponseItems.get(r.id) || [];
      const vec = [];
      tokenKeys.forEach((token) => {
        const item = items.find((it) => {
          if (!it || typeof it !== 'object') return false;
          const key = it.keyName || it.label;
          return key && String(key) === token;
        }) || {};
        const s = item.semantics || {};
        const zl = s.zoneLabel || s.zoneId;
        let idx = zl ? zoneLabels.indexOf(String(zl)) : -1;
        if (idx === -1) idx = noneIndex;
        // Normalize to [0,1] so Euclidean distance behaves reasonably
        const norm = noneIndex > 0 ? idx / noneIndex : 0;
        vec.push(norm);
      });
      vectors.set(r.id, vec);
    });
  } else {
    // Free layout: use per-token centroid-like positions (x,y) per response
    responses.forEach((r) => {
      const items = perResponseItems.get(r.id) || [];
      const vec = [];
      tokenKeys.forEach((token) => {
        const item = items.find((it) => {
          if (!it || typeof it !== 'object') return false;
          const key = it.keyName || it.label;
          return key && String(key) === token;
        }) || {};
        const pos = item.position || item.semantics || {};
        let x = typeof pos.x === 'number' ? pos.x : 0.5;
        let y = typeof pos.y === 'number' ? pos.y : 0.5;
        x = Math.min(Math.max(x, 0), 1);
        y = Math.min(Math.max(y, 0), 1);
        vec.push(x, y);
      });
      vectors.set(r.id, vec);
    });
  }

  const ids = Array.from(vectors.keys());
  const pairs = [];
  const distanceSums = {}; // id -> sum of distances to others
  const distanceCounts = {}; // id -> how many

  ids.forEach((id) => {
    distanceSums[id] = 0;
    distanceCounts[id] = 0;
  });

  const euclidean01 = (a, b) => {
    const len = Math.min(a.length, b.length);
    if (!len) return 0;
    let sumSq = 0;
    for (let i = 0; i < len; i++) {
      const d = (a[i] ?? 0) - (b[i] ?? 0);
      sumSq += d * d;
    }
    const dist = Math.sqrt(sumSq);
    // Normalize by sqrt(len) so max distance stays ~1 when components are in [0,1]
    return dist / Math.sqrt(len);
  };

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const idA = ids[i];
      const idB = ids[j];
      const vA = vectors.get(idA) || [];
      const vB = vectors.get(idB) || [];
      const dist = euclidean01(vA, vB);
      const score = Math.max(0, Math.min(1, 1 - dist));

      pairs.push({ a: idA, b: idB, score });

      distanceSums[idA] += dist;
      distanceSums[idB] += dist;
      distanceCounts[idA] += 1;
      distanceCounts[idB] += 1;
    }
  }

  const unusualness = {};
  ids.forEach((id) => {
    const n = distanceCounts[id] || 0;
    unusualness[id] = n > 0 ? distanceSums[id] / n : 0;
  });

  // Simple clustering: connect responses whose similarity >= 0.8
  const threshold = 0.8;
  const adjacency = new Map();
  ids.forEach((id) => adjacency.set(id, []));

  pairs.forEach((p) => {
    if (p.score >= threshold) {
      adjacency.get(p.a).push(p.b);
      adjacency.get(p.b).push(p.a);
    }
  });

  const visited = new Set();
  const clusters = [];

  ids.forEach((id) => {
    if (visited.has(id)) return;
    const stack = [id];
    const component = [];
    visited.add(id);

    while (stack.length) {
      const curr = stack.pop();
      component.push(curr);
      (adjacency.get(curr) || []).forEach((nbr) => {
        if (!visited.has(nbr)) {
          visited.add(nbr);
          stack.push(nbr);
        }
      });
    }

    if (component.length > 1) {
      clusters.push({
        clusterId: `cluster-${clusters.length + 1}`,
        responseIds: component.map((x) => Number(x)),
        labelId: null,
      });
    }
  });

  return {
    similarities: { pairs, clusters },
    unusualness,
  };
}

// ---- LLM CALL (OpenAI) -----------------------------------------
// This implementation uses the OpenAI Chat Completions API.
// It expects OPENAI_API_KEY in the environment.
// Uses the global fetch available in recent Node versions.

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
// Model is read from the environment so you can experiment freely.
// e.g. OPENAI_MODEL=gpt-5.2 or any other valid model.
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

async function callLLM(promptConfig) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY is not set; returning empty analysis.');
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

  const { system, messages } = promptConfig;

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: system },
      ...messages,
    ],
    temperature: 0.2,
  };

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error('OpenAI API error:', res.status, await res.text());
    // Fail soft: return empty structure so UI does not break.
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

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    console.warn('OpenAI response missing content; returning empty analysis.');
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

  // We instruct the model to respond with pure JSON, but be defensive
  // in case it wraps it in backticks or text.
  let jsonText = content.trim();

  // Strip Markdown code fences if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
  }

  try {
    const parsed = JSON.parse(jsonText);
    return parsed;
  } catch (e) {
    console.error('Failed to parse OpenAI JSON content:', e, jsonText);
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

  const promptText =
    promptRow.workshop_prompt_reference ||
    (promptRow.workshop_prompt_options &&
      typeof promptRow.workshop_prompt_options === 'string'
      ? promptRow.workshop_prompt_options
      : '');

  let analysis;
  let conciseSummary = '';

  // 1) Try a DnD-aware path for drag-and-drop prompts (template_id = 6).
  if (Number(promptRow.prompt_template_id) === 6) {
    try {
      const { getDragAndDropAnalytics } = await import('./analyticsService.js');
      const dndAnalytics = await getDragAndDropAnalytics(promptId);

      // Build numeric similarity graph + unusualness from raw responses
      const { similarities: dndSimilarities, unusualness } = buildNumericDnDSimilarities({
        responses,
        layout: dndAnalytics.layout,
      });

      const analyticsForLLM = {
        ...dndAnalytics,
        similarities: dndSimilarities,
        unusualness,
      };

      let dndPromptConfig;
      if (dndAnalytics.mode === 'spectrum') {
        dndPromptConfig = buildDragAndDropSpectrumPrompt({ promptText, analytics: analyticsForLLM });
      } else if (dndAnalytics.mode === 'zones') {
        dndPromptConfig = buildDragAndDropZonesPrompt({ promptText, analytics: analyticsForLLM });
      } else {
        dndPromptConfig = buildDragAndDropFreePrompt({ promptText, analytics: analyticsForLLM });
      }

      const dndResult = await callLLM(dndPromptConfig);

      analysis = {
        word_bubbles: { keywords: [], phrases: [] },
        labels: { labels: [] },
        similarities: dndSimilarities,
        free_text_summary:
          dndResult.free_text_summary || {
            tones: [],
            motifs: [],
            absences: [],
          },
        drag_and_drop: {
          ...dndAnalytics,
          unusualness,
        },
      };

      // Optional concise synthesis using the same summarizer as short responses.
      try {
        const synthesisResult = await callLLM(
          buildShortResponseSynthesisPrompt({
            promptText,
            analysis,
          })
        );
        conciseSummary =
          synthesisResult?.concise_summary ||
          synthesisResult?.free_text_summary?.summary ||
          synthesisResult?.free_text_summary?.paragraph ||
          '';
      } catch (e) {
        console.warn('DnD AI synthesis failed for prompt', promptId, e);
        conciseSummary = '';
      }
    } catch (e) {
      console.warn('DnD AI pipeline failed for prompt', promptId, e, '– falling back to generic analysis.');
      analysis = undefined;
      conciseSummary = '';
    }
  }

  // 2) Fallback: original short-response style pipeline for all other templates
  //    or when the DnD-specific path above fails.
  if (!analysis) {
    const freeTextBodies = responses.map((r) => ({
      id: r.id,
      text: typeof r.parsed === 'string' ? r.parsed : JSON.stringify(r.parsed),
    }));

    const bubblesResult = await callLLM(
      buildShortResponseWordBubblesPrompt({ promptText, responses: freeTextBodies })
    );

    const labelsResult = await callLLM(
      buildShortResponseLabelsPrompt({ promptText, responses: freeTextBodies })
    );

    const similaritiesResult = await callLLM(
      buildShortResponseSimilaritiesPrompt({ promptText, responses: freeTextBodies })
    );

    const summaryResult = await callLLM(
      buildShortResponseSummaryPrompt({ promptText, responses: freeTextBodies })
    );

    analysis = {
      word_bubbles: bubblesResult.word_bubbles || { keywords: [], phrases: [] },
      labels: labelsResult.labels || { labels: [] },
      similarities: similaritiesResult.similarities || { pairs: [], clusters: [] },
      free_text_summary:
        summaryResult.free_text_summary || {
          tones: [],
          motifs: [],
          absences: [],
          questions: [],
        },
    };

    try {
      const synthesisResult = await callLLM(
        buildShortResponseSynthesisPrompt({
          promptText,
          analysis,
        })
      );
      conciseSummary =
        synthesisResult?.free_text_summary?.summary ||
        synthesisResult?.free_text_summary?.paragraph ||
        '';
    } catch (err) {
      console.error('AI synthesis error for prompt', promptId, err);
      conciseSummary = '';
    }
  }

  // Attach concise summary in a backward-compatible way
  if (!analysis.free_text_summary) {
    analysis.free_text_summary = {
      tones: [],
      motifs: [],
      absences: [],
      questions: [],
    };
  }
  analysis.free_text_summary.concise_summary = conciseSummary;
  analysis.concise_summary = conciseSummary;

  await upsertPromptAIAnalysis({
    promptId,
    templateId: templateId ?? promptRow.prompt_template_id,
    analysisVersion: 1,
    analysisPayload: analysis,
  });
}
