// api/send-webhook.js
export default async function handler(req, res) {
  // Hanya terima POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ambil URL Webhook dari Environment Variable Vercel
  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    return res.status(500).json({ error: 'Webhook URL not set' });
  }

  try {
    // Forward body dari frontend ke Discord
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    return res.status(response.status).json({ 
      ok: response.ok, 
      status: response.status 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to send to Discord', 
      message: error.message 
    });
  }
}
