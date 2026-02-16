import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const jwtSecret = process.env.JWT_SECRET;

    if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: user, error } = await supabase
      .from('nabh_users')
      .select('id, name, email, phone, role, hospital_id, is_active, last_login_at, created_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Auth me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
