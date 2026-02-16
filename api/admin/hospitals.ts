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
      .from('hospitals')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ hospitals: data });
  }

  if (req.method === 'POST') {
    const { name, slug, address, city, state, phone, email, website, bed_count } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const { data, error } = await supabase
      .from('hospitals')
      .insert({
        name,
        slug: slug.toLowerCase().trim(),
        address: address || null,
        city: city || 'Nagpur',
        state: state || 'Maharashtra',
        phone: phone || null,
        email: email || null,
        website: website || null,
        bed_count: bed_count || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Hospital slug already exists' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ hospital: data });
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'Hospital id is required' });

    const { data, error } = await supabase
      .from('hospitals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ hospital: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Hospital id is required' });

    // Soft delete
    const { error } = await supabase
      .from('hospitals')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
