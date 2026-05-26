import { Router } from "express";
import { getScholarships } from "../controllers/scholarshipController";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

router.get("/scholarships", getScholarships);

export default router;
