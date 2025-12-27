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
