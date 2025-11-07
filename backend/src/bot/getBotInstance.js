import {Telegraf} from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

let botInstance = null;

function getBotInstance() {
    if (!botInstance) {
        botInstance = new Telegraf(process.env.BOT_TOKEN);
    }
    return botInstance;
}

export default getBotInstance;
