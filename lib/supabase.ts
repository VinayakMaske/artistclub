import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Artist {
  id: string;
  full_name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  city: string;
  created_at: string;
  total_earnings: number;
  is_verified: boolean;
}

export interface Artwork {
  id: string;
  artist_id: string;
  competition_id: string;
  title: string;
  description: string | null;
  medium: string | null;
  image_url: string;
  hours_invested: number | null;
  inspiration_story: string | null;
  status: string;
  total_support: number;
  supporter_count: number;
  created_at: string;
  artist?: Artist;
}

export interface Supporter {
  id: string;
  artwork_id: string;
  user_id: string | null;
  amount: number;
  display_name: string;
  email: string | null;
  is_anonymous: boolean;
  message: string | null;
  payment_status: string;
  created_at: string;
}

export interface MonthlyCompetition {
  id: string;
  month_year: string;
  status: string;
  start_date: string;
  end_date: string;
  winner_artwork_id: string | null;
  total_support: number;
  created_at: string;
}

// API Functions
export async function getCurrentCompetition() {
  const { data, error } = await supabase
    .from('monthly_competitions')
    .select('*')
    .eq('status', 'active')
    .single();

  if (error) throw error;
  return data as MonthlyCompetition;
}

export async function getArtworksWithArtists(competitionId: string) {
  const { data, error } = await supabase
    .from('artworks')
    .select(`
      *,
      artist:artists(*)
    `)
    .eq('competition_id', competitionId)
    .eq('status', 'approved')
    .order('total_support', { ascending: false });

  if (error) throw error;
  return data as Artwork[];
}

export async function getArtworkDetail(artworkId: string) {
  const { data, error } = await supabase
    .from('artworks')
    .select(`
      *,
      artist:artists(*)
    `)
    .eq('id', artworkId)
    .single();

  if (error) throw error;
  return data as Artwork;
}

export async function getSupporters(artworkId: string) {
  const { data, error } = await supabase
    .from('supporters')
    .select('*')
    .eq('artwork_id', artworkId)
    .eq('payment_status', 'completed')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Supporter[];
}

export async function createSupport(support: {
  artwork_id: string;
  user_id?: string;
  amount: number;
  display_name: string;
  email?: string;
  is_anonymous: boolean;
  message?: string;
  payment_id: string;
}) {
  const { data, error } = await supabase
    .from('supporters')
    .insert([{ ...support, payment_status: 'completed' }])
    .select()
    .single();

  if (error) throw error;
  return data as Supporter;
}

export async function getLeaderboard() {
  const { data: competition } = await supabase
    .from('monthly_competitions')
    .select('id')
    .eq('status', 'active')
    .single();

  if (!competition) return [];

  const { data, error } = await supabase
    .from('artworks')
    .select(`
      *,
      artist:artists(full_name, avatar_url)
    `)
    .eq('competition_id', competition.id)
    .order('total_support', { ascending: false });

  if (error) throw error;
  return data as Artwork[];
}