import 'dotenv/config';
import { SarvamAIClient } from 'sarvamai';

if (!process.env.SARVAM_API_KEY) {
  console.error('Missing SARVAM_API_KEY. Add it to server/.env and run this script again.');
  process.exit(1);
}

const client = new SarvamAIClient({ apiSubscriptionKey: process.env.SARVAM_API_KEY });

try {
  const response = await client.chat.completions({
    model: process.env.SARVAM_CHAT_MODEL || 'sarvam-105b',
    messages: [
      { role: 'system', content: 'You are SellSense AI, a helpful assistant for small shop owners in India. Reply in simple English.' },
      { role: 'user', content: 'Give me one short greeting for a shop owner using SellSense AI.' }
    ]
  });
  console.log(response.choices?.[0]?.message?.content || JSON.stringify(response));
} catch (error) {
  console.error('Sarvam API call failed:', error.message);
  process.exitCode = 1;
}
