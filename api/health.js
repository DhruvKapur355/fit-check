import { dialogflowStatus } from '../lib/dialogflow.js';
import { llmHealth } from '../lib/llm.js';

export default async function handler(req, res) {
  const [llm] = await Promise.all([llmHealth()]);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ dialogflow: dialogflowStatus(), llm });
}
