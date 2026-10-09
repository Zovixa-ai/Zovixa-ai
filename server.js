import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

const { REPLICATE_API_TOKEN, REPLICATE_MODEL } = process.env;
const DAILY_LIMIT = Number(process.env.DAILY_LIMIT || 50);
const HOURLY = Number(process.env.HOURLY_PER_IP || 5);
const ASPECT_FIELD = process.env.ASPECT_FIELD || '';
const API = 'https://api.replicate.com/v1';

if (!REPLICATE_API_TOKEN || !REPLICATE_MODEL) {
  console.error('REPLICATE_API_TOKEN aur REPLICATE_MODEL .env mein daliye.');
  process.exit(1);
}
let extra = {};
try { extra = JSON.parse(process.env.MODEL_INPUT_JSON || '{}'); }
catch { console.error('MODEL_INPUT_JSON sahi JSON nahi hai.'); process.exit(1); }

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));
app.get('/', (req, res) => res.sendFile(path.join(here, 'index.html')));

const headers = {
  Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
  'Content-Type': 'application/json'
};

let day = new Date().toDateString();
let used = 0;

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: HOURLY,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bahut zyada requests. Thodi der baad try kijiye.' }
});

app.post('/api/generate', limiter, async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim();
  const aspect = String(req.body?.aspect || '');
  if (prompt.length < 3 || prompt.length > 500)
    return res.status(400).json({ error: 'Prompt 3 se 500 akshar ka hona chahiye.' });

  const today = new Date().toDateString();
  if (today !== day) { day = today; used = 0; }
  if (used >= DAILY_LIMIT)
    return res.status(429).json({ error: 'Aaj ki limit poori ho gayi. Kal aaiye.' });

  const input = { ...extra, prompt };
  if (ASPECT_FIELD && ['9:16', '16:9', '1:1'].includes(aspect)) input[ASPECT_FIELD] = aspect;

  try {
    const r = await fetch(`${API}/models/${REPLICATE_MODEL}/predictions`, {
      method: 'POST', headers, body: JSON.stringify({ input })
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Replicate error:', data);
      return res.status(502).json({ error: 'Video service ne mana kar diya. Dobara try kijiye.' });
    }
    used++;
    res.json({ id: data.id });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'Video service se judne mein dikkat aayi.' });
  }
});

app.get('/api/status/:id', async (req, res) => {
  const { id } = req.params;
  if (!/^[a-z0-9]{6,40}$/i.test(id)) return res.status(400).json({ error: 'Galat id.' });
  try {
    const r = await fetch(`${API}/predictions/${id}`, { headers });
    const d = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'Status nahi mila.' });
    let out = d.output;
    if (Array.isArray(out)) out = out[0];
    if (out && typeof out === 'object') out = out.url || null;
    res.json({
      status: d.status,
      video: d.status === 'succeeded' ? out || null : null,
      error: d.status === 'failed' ? 'Video nahi ban payi. Prompt badal kar dekhiye.' : null
    });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'Status nahi mila.' });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Zovixa-ai chal raha hai'));
