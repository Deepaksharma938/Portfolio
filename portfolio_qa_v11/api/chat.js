const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
];

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function cleanModelName(name) {
  return String(name || '').replace(/^models\//, '');
}

async function callGemini(key, body) {
  let lastResponse = null;
  for (const model of GEMINI_MODELS) {
    try {
      const url = `${GEMINI_API_BASE}/models/${cleanModelName(model)}:generateContent?key=${encodeURIComponent(key)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.ok) return response;
      lastResponse = response;
      if (![400, 404, 429].includes(response.status)) return response;
    } catch (error) {
      lastResponse = null;
    }
  }
  return lastResponse;
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return json(res, 200, { configured: Boolean(process.env.GEMINI_API_KEY) });
  }
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return json(res, 503, { error: 'AI chat is not configured' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const contents = Array.isArray(payload.contents) ? payload.contents : null;
    if (!contents) return json(res, 400, { error: 'Invalid chat payload' });

    const response = await callGemini(key, { contents });
    if (!response) return json(res, 502, { error: 'AI provider unavailable' });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json(res, response.status, { error: data?.error?.message || 'AI provider error' });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return json(res, 200, { reply });
  } catch (error) {
    return json(res, 500, { error: 'AI request failed' });
  }
};
