import { connection } from '../app.js';
import dayjs from "dayjs";

function safeParse(value) {
    // If it’s already an object, return it directly
    if (typeof value === "object") return value;
  
    // If it's null or empty, return empty array (or null)
    if (!value) return [];
  
    // Otherwise try parsing
    try {
      return JSON.parse(value);
    } catch (e) {
      console.error("JSON parse failed for value:", value);
      throw e;
    }
  }

export async function getMCAnalytics(promptId) {
    const [rows] = await connection.query(
      `
      SELECT workshop_response_content, workshop_response_created
      FROM workshop_responses
      WHERE workshop_prompt_id = ?
        AND workshop_response_acceptance = 1
      `,
      [promptId]
    );
  
    const analytics = {
      promptId,
      totalResponses: rows.length,
      questions: {},
      timeSeries: {}
    };
  
    rows.forEach(row => {
      const content = safeParse(row.workshop_response_content);
      if (!Array.isArray(content)) return;
  
      content.forEach((item, qIndex) => {
        if (!item?.optionLabel) return;
  
        if (!analytics.questions[qIndex]) {
          analytics.questions[qIndex] = {
            questionText: item.questionText || "Untitled Question",
            totalResponses: 0,
            options: {}
          };
        }
  
        const label = item.optionLabel.trim();
  
        analytics.questions[qIndex].totalResponses++;
  
        if (!analytics.questions[qIndex].options[label]) {
          analytics.questions[qIndex].options[label] = {
            optionText: label,
            count: 0
          };
        }
  
        analytics.questions[qIndex].options[label].count++;
      });
  
      // time series
      const day = dayjs(row.workshop_response_created).format("YYYY-MM-DD");
      analytics.timeSeries[day] = (analytics.timeSeries[day] || 0) + 1;
    });
  
    // percentages
    Object.values(analytics.questions).forEach(q => {
      Object.values(q.options).forEach(opt => {
        opt.percentage =
          q.totalResponses === 0
            ? 0
            : (opt.count / q.totalResponses) * 100;
      });
    });
  
    return analytics;
}
  

export async function getCLAnalytics(promptId) {
    // 1. Fetch all responses for the prompt
    const [rows] = await connection.query(
        `
        SELECT workshop_response_content, workshop_response_created
        FROM workshop_responses
        WHERE workshop_prompt_id = ?
          AND workshop_response_acceptance = 1
        `,
        [promptId]
      );

    // Parsed output
    const responses = rows.map(r => ({
        content: safeParse(r.workshop_response_content),
        created: r.workshop_response_created
    }));

    // Create final structured analytics
    const analytics = {
        promptId,
        totalResponses: responses.length,
        questions: {},
        timeSeries: {}
    };


    // 2. Aggregate per question + per option
    // ----------------------------
    responses.forEach(response => {
        const questions = Array.isArray(response.content) ? response.content : [];
    
        questions.forEach((question, qIndex) => {
    
            if (!question || typeof question !== "object") return;
    
            if (!analytics.questions[qIndex]) {
                analytics.questions[qIndex] = {
                    questionText: question.questionText || "Untitled Question",
                    totalResponses: 0,
                    options: {}
                };
            }
    
            analytics.questions[qIndex].totalResponses++;
    
            // Ensure options is always an array
            const opts = Array.isArray(question.options) ? question.options : [];
    
            opts.forEach(opt => {
                if (!opt) return;

                if (!opt.optionText || opt.optionText.trim() === "") {
                    return; // Skip empty options
                }
    
                const optionId = (opt.optionText && opt.optionText.trim()) || opt.id || "unknown";
    
                if (!analytics.questions[qIndex].options[optionId]) {
                    analytics.questions[qIndex].options[optionId] = {
                        optionText: opt.optionText || "Unknown Option",
                        count: 0
                    };
                }
    
                if (opt.selected) {
                    analytics.questions[qIndex].options[optionId].count++;
                }
            });
        });
    });

    // 3. Add percentages
    // ----------------------------
    Object.values(analytics.questions).forEach(q => {
        Object.values(q.options).forEach(option => {
        option.percentage =
            q.totalResponses === 0
            ? 0
            : (option.count / q.totalResponses) * 100;
        });
    });

    // 4. TIME SERIES: responses per day (for line graph)
    // ----------------------------
    responses.forEach(r => {
        const day = dayjs(r.created).format("YYYY-MM-DD");
        if (!analytics.timeSeries[day]) {
        analytics.timeSeries[day] = 0;
        }
        analytics.timeSeries[day]++;
    });

    return analytics;
}

async function getTimeSeriesOnlyAnalytics(promptId) {
    const [rows] = await connection.query(
        `
        SELECT workshop_response_created
        FROM workshop_responses
        WHERE workshop_prompt_id = ?
          AND workshop_response_acceptance = 1
        `,
        [promptId]
    );

    const analytics = {
        promptId,
        totalResponses: rows.length,
        timeSeries: {}
    };

    rows.forEach(row => {
        const day = dayjs(row.workshop_response_created).format("YYYY-MM-DD");
        analytics.timeSeries[day] = (analytics.timeSeries[day] || 0) + 1;
    });

    return analytics;
}

// Layout-aware analytics for drag-and-drop prompts
// ---------------- Drag-and-drop layout-specific aggregators -----------------

function computeSpectrumAnalytics(base, responses) {
  // scores per token; fallback to position.x when semantics.scoreX missing
  const perToken = {}; // token -> { scores: number[] }

  responses.forEach(r => {
    const items = Array.isArray(r.content) ? r.content : (r.content ? [r.content] : []);
    items.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const token = item.keyName || item.label || 'unknown';
      const s = item.semantics || {};
      const raw = (typeof s.scoreX === 'number') ? s.scoreX : item.position?.x;
      if (typeof raw !== 'number') return;
      const score = Math.min(Math.max(raw, 0), 1);
      if (!perToken[token]) perToken[token] = { scores: [] };
      perToken[token].scores.push(score);
    });
  });

  const tokens = {};
  Object.entries(perToken).forEach(([token, data]) => {
    const scores = data.scores;
    if (!scores.length) return;
    const n = scores.length;
    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const stddev = Math.sqrt(variance);

    // Bucket scores into 5 equal-width buckets
    const buckets = [0, 0, 0, 0, 0];
    scores.forEach(v => {
      const idx = Math.min(4, Math.floor(v * 5));
      buckets[idx]++;
    });

    tokens[token] = {
      count: n,
      mean,
      stddev,
      buckets: buckets.map((c, i) => ({
        index: i,
        rangeMin: i / 5,
        rangeMax: (i + 1) / 5,
        count: c,
      })),
    };
  });

  // Global distribution summary (for AI + UI hints)
  let leftLeaningCount = 0;
  let rightLeaningCount = 0;
  let balancedCount = 0;

  Object.values(tokens).forEach((t) => {
    if (!Number.isFinite(t.mean)) return;
    if (t.mean < 1 / 3) leftLeaningCount += 1;
    else if (t.mean > 2 / 3) rightLeaningCount += 1;
    else balancedCount += 1;
  });

  // Aggregate bucket occupancy across all tokens to find underused regions
  const totalBucketCounts = [0, 0, 0, 0, 0];
  Object.values(tokens).forEach((t) => {
    t.buckets.forEach((b, i) => {
      totalBucketCounts[i] += b.count;
    });
  });

  const totalBucketSum = totalBucketCounts.reduce((a, b) => a + b, 0) || 1;
  const underusedRanges = [];
  let currentRange = null;
  const threshold = 0.02; // ~2% of placements considered "near zero"

  totalBucketCounts.forEach((count, i) => {
    const pct = count / totalBucketSum;
    if (pct < threshold) {
      const rangeMin = i / 5;
      const rangeMax = (i + 1) / 5;
      if (!currentRange) {
        currentRange = { rangeMin, rangeMax };
      } else {
        currentRange.rangeMax = rangeMax;
      }
    } else if (currentRange) {
      underusedRanges.push(currentRange);
      currentRange = null;
    }
  });
  if (currentRange) {
    underusedRanges.push(currentRange);
  }

  return {
    ...base,
    mode: 'spectrum',
    tokens,
    summary: {
      leftLeaningCount,
      rightLeaningCount,
      balancedCount,
      underusedRanges,
    },
  };
}

function computeZoneAnalytics(base, responses) {
  const zoneCounts = {};        // zoneLabel -> count
  const zoneCountsById = {};    // zoneId -> count (currently unused but kept for future)
  const perTokenZone = {};      // token -> { zoneLabel -> count }

  responses.forEach(r => {
    const items = Array.isArray(r.content) ? r.content : (r.content ? [r.content] : []);
    items.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const token = item.keyName || item.label || 'unknown';
      const s = item.semantics || {};
      const zoneId = s.zoneId || null;
      const zoneLabel = s.zoneLabel || zoneId || 'unknown';
      if (!zoneLabel) return;

      zoneCounts[zoneLabel] = (zoneCounts[zoneLabel] || 0) + 1;
      if (zoneId) zoneCountsById[zoneId] = (zoneCountsById[zoneId] || 0) + 1;

      if (!perTokenZone[token]) perTokenZone[token] = {};
      perTokenZone[token][zoneLabel] = (perTokenZone[token][zoneLabel] || 0) + 1;
    });
  });

  // Normalize for percentages
  const totalZonePlacements = Object.values(zoneCounts).reduce((a, b) => a + b, 0) || 1;

  const zones = Object.entries(zoneCounts).map(([label, count]) => ({
    zoneLabel: label,
    count,
    percentage: (count / totalZonePlacements) * 100,
  }));

  const tokens = {};
  Object.entries(perTokenZone).forEach(([token, zmap]) => {
    const total = Object.values(zmap).reduce((a, b) => a + b, 0) || 1;
    const perZone = Object.entries(zmap).map(([label, count]) => ({
      zoneLabel: label,
      count,
      percentage: (count / total) * 100,
    }));

    // Sort to expose primary / secondary zones for this token
    const sorted = perZone.slice().sort((a, b) => b.count - a.count);

    tokens[token] = {
      total,
      zones: perZone,
      primaryZone: sorted[0] || null,
      secondaryZone: sorted[1] || null,
    };
  });

  // Zones that are rarely used overall (cold spots)
  const coldZones = zones.filter((z) => z.percentage < 5);

  // For each zone, which tokens most often appear there (leaders)
  const zoneLeaders = {};
  Object.entries(tokens).forEach(([token, info]) => {
    info.zones.forEach((z) => {
      const key = z.zoneLabel;
      if (!zoneLeaders[key]) zoneLeaders[key] = [];
      zoneLeaders[key].push({ token, count: z.count });
    });
  });

  Object.keys(zoneLeaders).forEach((zoneLabel) => {
    zoneLeaders[zoneLabel] = zoneLeaders[zoneLabel]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3) // keep top 3 tokens per zone to avoid bloat
      .map((entry) => entry.token);
  });

  return {
    ...base,
    mode: 'zones',
    zones,
    tokens,
    summary: {
      coldZones,
      zoneLeaders,
    },
  };
}

function computeFreeAnalytics(base, responses) {
  const perToken = {}; // token -> { points: {x,y}[] }

  responses.forEach(r => {
    const items = Array.isArray(r.content) ? r.content : (r.content ? [r.content] : []);
    items.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const token = item.keyName || item.label || 'unknown';
      const pos = item.position || item.semantics || {};
      if (typeof pos.x !== 'number' || typeof pos.y !== 'number') return;
      const point = {
        x: Math.min(Math.max(pos.x, 0), 1),
        y: Math.min(Math.max(pos.y, 0), 1),
      };
      if (!perToken[token]) perToken[token] = { points: [] };
      perToken[token].points.push(point);
    });
  });

  const tokens = {};
  Object.entries(perToken).forEach(([token, data]) => {
    const pts = data.points;
    if (!pts.length) return;
    const n = pts.length;
    const sum = pts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    const centroid = { x: sum.x / n, y: sum.y / n };

    // Average radial distance from centroid (spread)
    const avgDistanceFromCentroid = pts.reduce((acc, p) => {
      const dx = p.x - centroid.x;
      const dy = p.y - centroid.y;
      return acc + Math.sqrt(dx * dx + dy * dy);
    }, 0) / n;

    // Bounding box of all points for this token
    const bounds = pts.reduce(
      (acc, p) => ({
        minX: Math.min(acc.minX, p.x),
        maxX: Math.max(acc.maxX, p.x),
        minY: Math.min(acc.minY, p.y),
        maxY: Math.max(acc.maxY, p.y),
      }),
      { minX: 1, maxX: 0, minY: 1, maxY: 0 }
    );

    tokens[token] = {
      count: n,
      centroid,
      avgDistanceFromCentroid,
      bounds,
      // Raw points for scatter/heatmap if needed
      points: pts,
    };
  });

  // Build a coarse global heatmap (3x3 grid) over all points
  const rows = 3;
  const cols = 3;
  const cells = [];
  const allPoints = Object.values(perToken).flatMap((t) => t.points);
  const cellCounts = Array.from({ length: rows * cols }, () => 0);

  allPoints.forEach((p) => {
    const r = Math.min(rows - 1, Math.max(0, Math.floor(p.y * rows)));
    const c = Math.min(cols - 1, Math.max(0, Math.floor(p.x * cols)));
    const idx = r * cols + c;
    cellCounts[idx] += 1;
  });

  const totalPoints = allPoints.length || 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const count = cellCounts[idx];
      cells.push({
        row: r,
        col: c,
        count,
        percentage: (count / totalPoints) * 100,
      });
    }
  }

  const coldCells = cells.filter((cell) => cell.percentage < 5);

  return {
    ...base,
    mode: 'free',
    tokens,
    heatmap: {
      rows,
      cols,
      cells,
    },
    summary: {
      coldCells,
    },
  };
}

export async function getDragAndDropAnalytics(promptId) {
    // 1) Load prompt config to determine layout and grid metadata
    const [[promptRow]] = await connection.query(
      `SELECT prompt_template_id, workshop_prompt_options
       FROM workshop_prompts
       WHERE workshop_prompt_id = ?`,
      [promptId]
    );

    if (!promptRow) {
      return { promptId, layout: 'unknown', totalResponses: 0, timeSeries: {} };
    }

    const templateId = Number(promptRow.prompt_template_id);
    let layout = 'free';
    let gridMeta = null;
    let axisMeta = null;

    if (promptRow.workshop_prompt_options) {
      const opts = safeParse(promptRow.workshop_prompt_options);
      if (opts && typeof opts === 'object') {
        if (opts.layout) layout = opts.layout;
        if (opts.grid && typeof opts.grid === 'object') {
          gridMeta = {
            rows: Number(opts.grid.rows || 0),
            cols: Number(opts.grid.cols || 0),
            labels: Array.isArray(opts.grid.labels) ? opts.grid.labels : null,
          };
        }
        if (opts.axes && typeof opts.axes === 'object') {
          axisMeta = opts.axes;
        }
      }
    }

    // 2) Fetch accepted responses for this prompt
    const [rows] = await connection.query(
      `
      SELECT workshop_response_content, workshop_response_created
      FROM workshop_responses
      WHERE workshop_prompt_id = ?
        AND workshop_response_acceptance = 1
      `,
      [promptId]
    );

    const responses = rows.map(r => ({
      content: safeParse(r.workshop_response_content),
      created: r.workshop_response_created,
    }));

    const base = {
      promptId,
      templateId,
      layout,
      grid: gridMeta,
      axes: axisMeta,
      totalResponses: responses.length,
      timeSeries: {},
    };

    // 3) Record time series (common to all layouts)
    responses.forEach(r => {
      const day = dayjs(r.created).format("YYYY-MM-DD");
      base.timeSeries[day] = (base.timeSeries[day] || 0) + 1;
    });

    if (layout === 'x-spectrum') {
      return computeSpectrumAnalytics(base, responses);
    }

    if (layout === 'grid-zones') {
      return computeZoneAnalytics(base, responses);
    }

    // default: free layout
    return computeFreeAnalytics(base, responses);
}

export async function getShortResponseAnalytics(promptId) {
    return getTimeSeriesOnlyAnalytics(promptId);
}

export async function getDropDownAnalytics(promptId) {
    // Fetch all accepted dropdown responses for the prompt
    const [rows] = await connection.query(
        `
        SELECT workshop_response_content, workshop_response_created
        FROM workshop_responses
        WHERE workshop_prompt_id = ?
          AND workshop_response_acceptance = 1
        `,
        [promptId]
    );

    const responses = rows.map(r => ({
        content: safeParse(r.workshop_response_content),
        created: r.workshop_response_created,
    }));

    const analytics = {
        promptId,
        totalResponses: responses.length,
        questions: {},
        timeSeries: {},
    };

    // Aggregate per question + per selected option (similar to checklist analytics)
    responses.forEach(response => {
        const questions = Array.isArray(response.content) ? response.content : [];

        questions.forEach((question, qIndex) => {
            if (!question || typeof question !== "object") return;

            if (!analytics.questions[qIndex]) {
                analytics.questions[qIndex] = {
                    questionText: question.questionText || "Untitled Question",
                    totalResponses: 0,
                    options: {},
                };
            }

            analytics.questions[qIndex].totalResponses++;

            // For dropdowns, each question has a single selected answer.
            const rawLabel = (question.optionLabel ?? question.answer ?? "");
            const label = typeof rawLabel === "string" ? rawLabel.trim() : String(rawLabel || "");
            if (!label) return;

            const optionId = label;

            if (!analytics.questions[qIndex].options[optionId]) {
                analytics.questions[qIndex].options[optionId] = {
                    optionText: label,
                    count: 0,
                };
            }

            analytics.questions[qIndex].options[optionId].count++;
        });
    });

    // Percentages per option, mirroring checklist logic
    Object.values(analytics.questions).forEach(q => {
        Object.values(q.options).forEach(option => {
            option.percentage =
                q.totalResponses === 0
                    ? 0
                    : (option.count / q.totalResponses) * 100;
        });
    });

    // Time series: responses per day
    responses.forEach(r => {
        const day = dayjs(r.created).format("YYYY-MM-DD");
        if (!analytics.timeSeries[day]) {
            analytics.timeSeries[day] = 0;
        }
        analytics.timeSeries[day]++;
    });

    return analytics;
}

export async function getSampleRaterAnalytics(promptId) {
    const [rows] = await connection.query(
        `
        SELECT workshop_response_content, workshop_response_created
        FROM workshop_responses
        WHERE workshop_prompt_id = ?
          AND workshop_response_acceptance = 1
        `,
        [promptId]
    );

    let ratingSum = 0;
    let ratingCount = 0;

    // Always track buckets for a fixed 1–5 star scale
    const ratingBuckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const analytics = {
        promptId,
        totalResponses: rows.length,
        averageRating: null,
        ratingBuckets,
        timeSeries: {}
    };

    rows.forEach(row => {
        const content = safeParse(row.workshop_response_content);
        const ratings = [];

        if (Array.isArray(content)) {
            // e.g. [{ rating: 4 }, ...]
            content.forEach(item => {
                if (item && typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "rating")) {
                    ratings.push(Number(item.rating));
                }
            });
        } else if (content != null && typeof content === "object") {
            // e.g. { rating: 4 }
            if (Object.prototype.hasOwnProperty.call(content, "rating")) {
                ratings.push(Number(content.rating));
            }
        } else if (typeof content === "number" || typeof content === "string") {
            // e.g. raw numeric value
            ratings.push(Number(content));
        }

        ratings.forEach(rating => {
            if (Number.isFinite(rating) && rating >= 1 && rating <= 5) {
                ratingSum += rating;
                ratingCount += 1;
                ratingBuckets[rating] = (ratingBuckets[rating] || 0) + 1;
            }
        });

        const day = dayjs(row.workshop_response_created).format("YYYY-MM-DD");
        analytics.timeSeries[day] = (analytics.timeSeries[day] || 0) + 1;
    });

    if (ratingCount > 0) {
        const avg = ratingSum / ratingCount;
        analytics.averageRating = Math.round(avg * 10) / 10;
    } else {
        analytics.averageRating = null;
    }

    return analytics;
}

export async function getNotationAnalytics(promptId) {
    return getTimeSeriesOnlyAnalytics(promptId);
}
