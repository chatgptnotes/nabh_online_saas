export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'superadmin' | 'admin' | 'staff' | 'quality_coordinator';
  hospital_id: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  bed_count: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  hospital_name: string;
  role?: 'superadmin' | 'admin' | 'staff' | 'quality_coordinator';
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthError {
  error: string;
  message?: string;
}
