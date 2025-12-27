import express from "express";
import {authenticateTokenAdmin, authenticateToken, connection} from './app.js';
import { getMCAnalytics, getCLAnalytics } from "./services/analyticsService.js";

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
