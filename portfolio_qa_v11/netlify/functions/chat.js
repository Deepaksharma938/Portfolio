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

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

function cleanModelName(name) {
  return String(name || '').replace(/^models\//, '');
}

async function callGemini(key, body) {
  let lastResponse = null;
  for (const model of GEMINI_MODELS) {
    try {
      const url = `${GEMINI_API_BASE}/models/${cleanModelName(model)}:generateContent?key=${encodeURIComponent(key)}`;
      const result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (result.ok) return result;
      lastResponse = result;
      if (![400, 404, 429].includes(result.status)) return result;
    } catch (error) {
      lastResponse = null;
    }
  }
  return lastResponse;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    return response(200, { configured: Boolean(process.env.GEMINI_API_KEY) });
  }
  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return response(503, { error: 'AI chat is not configured' });
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const contents = Array.isArray(payload.contents) ? payload.contents : null;
    if (!contents) return response(400, { error: 'Invalid chat payload' });

    const result = await callGemini(key, { contents });
    if (!result) return response(502, { error: 'AI provider unavailable' });

    const data = await result.json().catch(() => ({}));
    if (!result.ok) {
      return response(result.status, { error: data?.error?.message || 'AI provider error' });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return response(200, { reply });
  } catch (error) {
    return response(500, { error: 'AI request failed' });
  }
};
