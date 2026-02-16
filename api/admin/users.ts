import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

function verifyAdmin(req: VercelRequest): { userId: string; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET!) as any;
    if (decoded.role !== 'superadmin') return null;
    return decoded;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Superadmin access required' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('nabh_users')
      .select('id, name, email, phone, role, hospital_id, is_active, last_login_at, created_at')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ users: data });
  }

  if (req.method === 'PUT') {
    const { id, role, hospital_id, is_active } = req.body;
    if (!id) return res.status(400).json({ error: 'User id is required' });

    // Prevent editing own superadmin role
    if (id === admin.userId && role && role !== 'superadmin') {
      return res.status(400).json({ error: 'Cannot change your own superadmin role' });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (role !== undefined) updates.role = role;
    if (hospital_id !== undefined) updates.hospital_id = hospital_id;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from('nabh_users')
      .update(updates)
      .eq('id', id)
      .select('id, name, email, phone, role, hospital_id, is_active, last_login_at, created_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ user: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
