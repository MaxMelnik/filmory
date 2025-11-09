import { User } from '../models/index.js';

/**
 * UserService — відповідає за роботу з користувачами в базі даних.
 */
export class UserService {
    /**
     * Find user by telegramId
     */
    static async getByTelegramId(telegramId) {
        return User.findOne({ telegramId });
    }
}
