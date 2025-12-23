export default function splitTelegramMessage(message, maxLength = 4096) {
    const messages = [];
    let currentMessage = '';

    const parts = message.split('\n\n');

    for (const part of parts) {
        const potentialMessage = currentMessage ? `${currentMessage}\n\n${part}` : part;

        // If adding this part exceeds the max length, push the current message and start a new one
        if (potentialMessage.length > maxLength) {
            if (currentMessage) {
                messages.push(currentMessage);
                currentMessage = part;
            } else {
                // If a single part is longer than maxLength, force split it anyway
                for (let i = 0; i < part.length; i += maxLength) {
                    messages.push(part.slice(i, i + maxLength));
                }
                currentMessage = '';
            }
        } else {
            currentMessage = potentialMessage;
        }
    }

    // Push the last message if it exists
    if (currentMessage) {
        messages.push(currentMessage);
    }

    return messages;
}
