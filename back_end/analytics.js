import express from "express";
import {authenticateTokenAdmin, authenticateToken, connection} from './app.js';
import { getMCAnalytics, getCLAnalytics, getDragAndDropAnalytics, getShortResponseAnalytics, getDropDownAnalytics, getSampleRaterAnalytics, getNotationAnalytics } from "./services/analyticsService.js";
import { getPromptAIAnalysis } from "./services/aiAnalysisService.js";

export const analyticsRouter = express.Router();

analyticsRouter.get("/multiplechoice/:promptId", authenticateToken, async (req, res) => {
    try {
        const promptId = req.params.promptId;
        const analytics = await getMCAnalytics(promptId);
        res.status(200).json(analytics);
    } catch (error) {
        console.error("MC Analytics Error:", error);
        res.status(500).json({ error: "Failed to load analytics." });
    }
});

analyticsRouter.get("/checklist/:promptId", authenticateToken, async (req, res) => {
    try {
        const promptId = req.params.promptId;
        const analytics = await getCLAnalytics(promptId);
        res.status(200).json(analytics);
    } catch (error) {
        console.error("MC Analytics Error:", error);
        res.status(500).json({ error: "Failed to load analytics." });
    }
});

analyticsRouter.get("/draganddrop/:promptId", authenticateToken, async (req, res) => {
    try {
        const { promptId } = req.params;
        const analytics = await getDragAndDropAnalytics(promptId);
        res.status(200).json(analytics);
    } catch (error) {
        console.error("DragAndDrop Analytics Error:", error);
        res.status(500).json({ error: "Failed to load analytics." });
    }
});

analyticsRouter.get("/shortresponse/:promptId", authenticateToken, async (req, res) => {
    try {
        const { promptId } = req.params;
        const analytics = await getShortResponseAnalytics(promptId);
        res.status(200).json(analytics);
    } catch (error) {
        console.error("ShortResponse Analytics Error:", error);
        res.status(500).json({ error: "Failed to load analytics." });
    }
});

analyticsRouter.get("/dropdown/:promptId", authenticateToken, async (req, res) => {
    try {
        const { promptId } = req.params;
        const analytics = await getDropDownAnalytics(promptId);
        res.status(200).json(analytics);
    } catch (error) {
        console.error("DropDown Analytics Error:", error);
        res.status(500).json({ error: "Failed to load analytics." });
    }
});

analyticsRouter.get("/samplerater/:promptId", authenticateToken, async (req, res) => {
    try {
        const { promptId } = req.params;
        const analytics = await getSampleRaterAnalytics(promptId);
        res.status(200).json(analytics);
    } catch (error) {
        console.error("SampleRater Analytics Error:", error);
        res.status(500).json({ error: "Failed to load analytics." });
    }
});

analyticsRouter.get("/notation/:promptId", authenticateToken, async (req, res) => {
    try {
        const { promptId } = req.params;
        const analytics = await getNotationAnalytics(promptId);
        res.status(200).json(analytics);
    } catch (error) {
        console.error("Notation Analytics Error:", error);
        res.status(500).json({ error: "Failed to load analytics." });
    }
});

// AI-driven, non-prescriptive analysis bundle for a prompt
analyticsRouter.get("/ai/:promptId", authenticateTokenAdmin, async (req, res) => {
    try {
        const { promptId } = req.params;
        const analysis = await getPromptAIAnalysis(promptId);

        if (!analysis) {
            return res.status(404).json({ message: "No AI analysis found for this prompt." });
        }

        return res.status(200).json(analysis);
    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ error: "Failed to load AI analysis." });
    }
});

// Admin-only endpoints for per-prompt facilitator analysis
analyticsRouter.get("/admin-analysis/:promptId", authenticateTokenAdmin, async (req, res) => {
    try {
        const { promptId } = req.params;
        const [rows] = await connection.query(
            "SELECT workshop_prompt_admin_analysis FROM workshop_prompts WHERE workshop_prompt_id = ?",
            [promptId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Prompt not found" });
        }

        const value = rows[0].workshop_prompt_admin_analysis;
        return res.status(200).json({
            promptId: Number(promptId),
            adminAnalysis: value,
        });
    } catch (error) {
        console.error("Admin analysis GET error:", error);
        return res.status(500).json({ message: "Failed to load admin analysis.", error: String(error) });
    }
});

analyticsRouter.put("/admin-analysis/:promptId", authenticateTokenAdmin, async (req, res) => {
    try {
        const { promptId } = req.params;
        let { adminAnalysis } = req.body;
        
        if (typeof adminAnalysis !== "string") {
            adminAnalysis = adminAnalysis == null ? "" : String(adminAnalysis);
        }
        
        const [result] = await connection.execute(
            "UPDATE workshop_prompts SET workshop_prompt_admin_analysis = ? WHERE workshop_prompt_id = ?",
            [adminAnalysis, promptId]
        );

        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ message: "Prompt not found" });
        }

        return res.status(200).json({
            promptId: Number(promptId),
            adminAnalysis,
        });
    } catch (error) {
        console.error("Admin analysis PUT error:", error);
        return res.status(500).json({ message: "Failed to save admin analysis.", error: String(error) });
    }
});
