import { HealthService } from '../../services/system/HealthService.js';

export const healthController = {
    async getHealth(req, res) {
        try {
            const data = await HealthService.getFullHealth();
            const allOk = Object.values(data.services).every((s) => s.status === 'ok');
            // res.status(allOk ? 200 : 503).json(data);
            if (!allOk) console.log('Healthcheck:', data);
            res.json(data);
        } catch (err) {
            res.status(500).json({ status: 'error', error: err.message });
        }
    },
};
