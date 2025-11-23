import { Router } from 'express';
import { healthController } from '../controllers/healthController.js';

const router = Router();

router.get('/healthz', healthController.getHealth);

router.get('/fast-healthz', healthController.getFastHealth);

export default router;
