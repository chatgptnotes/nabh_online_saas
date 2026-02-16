import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { name, email, password, phone, hospital_name, role } = req.body;

    // Validation
    if (!name || !email || !password || !hospital_name) {
      return res.status(400).json({ error: 'Name, email, password, and hospital name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const trimmedHospitalName = hospital_name.trim();
    if (!trimmedHospitalName) {
      return res.status(400).json({ error: 'Hospital name is required' });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('nabh_users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Find or create hospital
    let hospital_id: string;

    // Search for existing hospital by name (case-insensitive)
    const { data: existingHospital } = await supabase
      .from('hospitals')
      .select('slug')
      .ilike('name', trimmedHospitalName)
      .single();

    if (existingHospital) {
      hospital_id = existingHospital.slug;
    } else {
      // Create new hospital
      const slug = trimmedHospitalName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const { data: newHospital, error: hospitalError } = await supabase
        .from('hospitals')
        .insert({
          slug,
          name: trimmedHospitalName,
          is_active: true,
        })
        .select('slug')
        .single();

      if (hospitalError) {
        console.error('Hospital creation error:', hospitalError);
        return res.status(500).json({ error: 'Failed to register hospital' });
      }

      hospital_id = newHospital.slug;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const { data: user, error } = await supabase
      .from('nabh_users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash,
        phone: phone || null,
        hospital_id,
        role: role || 'admin',
      })
      .select('id, name, email, phone, role, hospital_id, is_active, created_at')
      .single();

    if (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ error: 'Failed to create account' });
    }

    return res.status(201).json({ user });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
