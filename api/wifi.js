import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS so your frontend can talk to it
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Automatically delete records older than 7 days on every request
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await supabase
      .from('wifi_credentials')
      .delete()
      .lt('created_at', sevenDaysAgo.toISOString());

    // 2. Handle POST request (Save new Wi-Fi)
    if (req.method === 'POST') {
      const { ssid, password } = req.body;
      if (!ssid || !password) {
        return res.status(400).json({ error: 'SSID and password are required' });
      }

      const { data, error } = await supabase
        .from('wifi_credentials')
        .insert([{ ssid, password }])
        .select();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    // 3. Handle GET request (Fetch active 7-day records)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('wifi_credentials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
    }
