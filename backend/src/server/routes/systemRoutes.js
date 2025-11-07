import { Router } from "express";
import { healthController } from "../controllers/healthController.js";

const router = Router();

router.get("/healthz", healthController.getHealth);

export default router;
