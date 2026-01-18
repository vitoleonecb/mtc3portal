import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Prevent app.js from binding the HTTP port; this script only needs the
// shared MySQL pool and services.
process.env.DISABLE_APP_LISTEN = 'true';

// Load the same .env used by the backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Import AI services *after* setting DISABLE_APP_LISTEN so that app.js
// does not call app.listen() when its connection pool is imported.
const { runPromptAIAnalysis, getPromptAIAnalysis } = await import('../services/aiAnalysisService.js');

async function main() {
  const promptIdArg = process.argv[2];

  if (!promptIdArg) {
    console.error('Usage: node run_ai_for_prompt.mjs <promptId>');
    process.exit(1);
  }

  const promptId = Number(promptIdArg);

  if (!Number.isFinite(promptId)) {
    console.error('promptId must be a number');
    process.exit(1);
  }

  console.log('Running AI analysis for promptId:', promptId);

  try {
    // Force a fresh run for this prompt
    await runPromptAIAnalysis({ promptId, templateId: undefined });

    // Fetch and print the stored analysis from prompt_ai_analysis
    const analysis = await getPromptAIAnalysis(promptId);

    console.log('--- Stored AI analysis JSON ---');
    console.log(JSON.stringify(analysis, null, 2));
  } catch (err) {
    console.error('Error while running AI analysis:', err);
    process.exit(1);
  }
}

main();
