import {HealthService} from '../../services/system/HealthService.js';

export const healthController = {
    async getHealth(req, res) {
        try {
            const data = await HealthService.getFullHealth();
            const allOk = Object.values(data.services).every(s => s.status === 'ok');
            // res.status(allOk ? 200 : 503).json(data);
            console.log(allOk);
            if (!allOk) console.log(data);
            res.json(data);
        } catch (err) {
            res.status(500).json({status: 'error', error: err.message});
        }
    },
};
