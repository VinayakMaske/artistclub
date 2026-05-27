// src/app/artwork1/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, Sparkles, Heart, Share2, Gavel,
  Loader2, Palette, UserCircle, ArrowUpRight, Users, MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import MuseumNav from '@/components/MuseumNav';
import SupportModal from '@/components/SupportModal';
import AuctionBidModal from '@/components/AuctionBidModal';
import { createBrowserClient } from '@supabase/ssr';

type Artwork = {
  id: string;
  title: string;
  description: string | null;
  medium: string | null;
  image_url: string;
  hours_invested: number | null;
  total_support: number;
  supporter_count: number;
  status: string;
  created_at: string;
  dimensions: string | null;
  message_delivers: string | null;
  technique_notes: string | null;
  materials_used: string[] | null;
  inspiration_story: string | null;
  is_sold: boolean;
  winner_tag: string | null;
  minimum_bid: number; // ← NEW
  artist: {
    id: string;
    full_name: string;
    city: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
};

type Supporter = {
  id: string;
  display_name: string;
  amount: number;
  message: string | null;
  avatar_url: string | null;
  is_anonymous: boolean;
  created_at: string;
  badge: string;
};

type AuctionBid = {
  id: string;
  bidder_name: string;
  bid_amount: number;
  message: string | null;
  is_winning_bid: boolean;
  created_at: string;
};

const DEMO_ARTWORKS: Record<string, Artwork> = {
  '1': {
    id: '1',
    title: 'Monsoon Memories',
    description: 'A meditation on the Indian monsoon — the waiting, the arrival, the surrender. This piece captures the emotional landscape of a Pune monsoon through layered acrylic washes.',
    medium: 'Acrylic on Canvas',
    image_url: '',
    hours_invested: 45,
    total_support: 12400,
    supporter_count: 89,
    status: 'live',
    created_at: '2026-04-15',
    dimensions: '24 x 36 inches',
    message_delivers: 'This painting speaks to anyone who has waited for rain. The grey washes represent anticipation, the sudden blue burst is the first drop, and the white streaks are the surrender to the downpour.',
    technique_notes: 'Built in 12 layers over 3 weeks. Each layer was allowed to dry for 24 hours before the next was applied. The final glaze uses interference blue to catch light differently at various angles.',
    materials_used: ['Acrylic paint', 'Canvas', 'Interference medium', 'Gel medium'],
    inspiration_story: 'Created during the 2025 monsoon in Pune, watching the first rains from my studio window.',
    is_sold: false,
    winner_tag: null,
    minimum_bid: 5000, // ← NEW
    artist: {
      id: 'a1',
      full_name: 'Aarav Mehta',
      city: 'Pune',
      avatar_url: null,
      bio: 'Aarav is a contemporary artist exploring the intersection of memory and landscape.',
    },
  },
  '2': {
    id: '2',
    title: 'Identity Fragmented',
    description: 'An exploration of self in a world of constant change and digital personas.',
    medium: 'Mixed Media',
    image_url: '',
    hours_invested: 60,
    total_support: 15600,
    supporter_count: 112,
    status: 'live',
    created_at: '2026-04-10',
    dimensions: '30 x 40 inches',
    message_delivers: 'Who are we when we are alone versus who we are online? This piece holds a mirror to the fractured self.',
    technique_notes: 'Combines traditional collage, acrylic paint, and digital projection mapping. The physical layers are scanned and reprinted at different opacities.',
    materials_used: ['Found photographs', 'Acrylic paint', 'Digital print', 'Resin'],
    inspiration_story: 'Inspired by the duality of social media personas versus real life.',
    is_sold: false,
    winner_tag: null,
    minimum_bid: 7500, // ← NEW
    artist: {
      id: 'a2',
      full_name: 'Priya Krishnan',
      city: 'Mumbai',
      avatar_url: null,
      bio: 'Priya uses collage and digital manipulation to question identity in the modern age.',
    },
  },
};

const DEMO_SUPPORTERS: Supporter[] = [
  {
    id: 's1',
    display_name: 'Priya Sharma',
    amount: 199,
    message: 'This piece moved me deeply. The way you capture the monsoon is extraordinary. Thank you for sharing your gift with the world.',
    avatar_url: null,
    is_anonymous: false,
    created_at: '2026-05-20T10:30:00',
    badge: 'Diamond Benefactor',
  },
  {
    id: 's2',
    display_name: 'Rohan Deshpande',
    amount: 149,
    message: 'The layers in this work are mesmerizing. Can feel the rain just looking at it.',
    avatar_url: null,
    is_anonymous: false,
    created_at: '2026-05-19T14:22:00',
    badge: 'Gold Champion',
  },
  {
    id: 's3',
    display_name: 'Anonymous Patron',
    amount: 99,
    message: null,
    avatar_url: null,
    is_anonymous: true,
    created_at: '2026-05-18T09:15:00',
    badge: 'Silver Advocate',
  },
];

const DEMO_AUCTION_BIDS: AuctionBid[] = [
  {
    id: 'b1',
    bidder_name: 'Vikram Patel',
    bid_amount: 15000,
    message: 'This piece would be perfect for my collection.',
    is_winning_bid: true,
    created_at: '2026-05-25T10:00:00',
  },
  {
    id: 'b2',
    bidder_name: 'Ananya Sharma',
    bid_amount: 12000,
    message: 'Beautiful work!',
    is_winning_bid: false,
    created_at: '2026-05-24T14:00:00',
  },
];

export default function ArtworkPage() {
  const params = useParams();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [auctionBids, setAuctionBids] = useState<AuctionBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [useDemo, setUseDemo] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [auctionModalOpen, setAuctionModalOpen] = useState(false);

  // CRITICAL: Validate env variables BEFORE creating client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🔍 ENV CHECK — URL exists:', !!supabaseUrl);
  console.log('🔍 ENV CHECK — KEY exists:', !!supabaseKey);

  // Create client only if env vars exist, otherwise we'll use demo mode
  const supabase = (supabaseUrl && supabaseKey)
    ? createBrowserClient(supabaseUrl, supabaseKey)
    : null;

  useEffect(() => {
    const id = params.id as string;
    console.log('🔍 Page ID from URL:', id);

    async function fetchData() {
      try {
        // If no Supabase client (env vars missing), go straight to demo
        if (!supabase) {
          console.error('❌ Supabase client not created — env vars missing');
          throw new Error('Supabase not configured');
        }

        // Check if ID is a valid UUID format
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        console.log('🔍 Is valid UUID:', isUUID);

        let artworkData: any = null;

        if (isUUID) {
          // Fetch from Supabase using UUID
          const { data, error } = await supabase
            .from('artworks')
            .select(`
              *,
              artist:artist_id(id, full_name, city, avatar_url, bio)
            `)
            .eq('id', id)
            .maybeSingle();

          console.log('🔍 Supabase data:', data);
          console.log('🔍 Supabase error:', error);

          if (error) {
            console.error('❌ Supabase error:', JSON.stringify(error, null, 2));
            throw new Error('Database query failed');
          }

          artworkData = data;
        } else {
          console.log('🔍 ID is not UUID, skipping Supabase query');
        }

        // If no data from Supabase (or invalid ID), use demo data
        if (!artworkData) {
          console.log('🔍 Falling back to demo data for ID:', id);
          const demoArtwork = DEMO_ARTWORKS[id];
          
          if (!demoArtwork) {
            console.error('❌ No demo artwork found for ID:', id);
            throw new Error('Artwork not found');
          }

          setArtwork(demoArtwork);
          setSupporters(DEMO_SUPPORTERS);
          setAuctionBids(DEMO_AUCTION_BIDS);
          setUseDemo(true);
          setLoading(false);
          return; // Exit early, skip Supabase sub-queries
        }

        // Handle artist relation (Supabase returns array for joined data)
        const artistData = Array.isArray(artworkData.artist)
          ? artworkData.artist[0]
          : artworkData.artist;

        setArtwork({
          ...artworkData,
          artist: artistData,
        });

        // Fetch supporters for this artwork
        const { data: supportersData, error: supportersError } = await supabase
          .from('supporters')
          .select('id, display_name, amount, message, avatar_url, is_anonymous, created_at')
          .eq('artwork_id', id)
          .eq('payment_status', 'completed')
          .order('created_at', { ascending: false });

        if (!supportersError && supportersData) {
          const badgeMap: Record<number, string> = {
            49: 'Bronze Patron',
            99: 'Silver Advocate',
            149: 'Gold Champion',
            199: 'Diamond Benefactor',
          };

          const formattedSupporters: Supporter[] = supportersData.map((s: any) => ({
            ...s,
            badge: badgeMap[s.amount] || 'Bronze Patron',
          }));

          setSupporters(formattedSupporters);
        }

        // Fetch approved auction bids for this artwork
        const { data: bidsData, error: bidsError } = await supabase
          .from('auction_bids')
          .select('id, bidder_name, bid_amount, message, is_winning_bid, created_at')
          .eq('artwork_id', id)
          .eq('status', 'approved')
          .order('bid_amount', { ascending: false });

        if (!bidsError && bidsData) {
          setAuctionBids(bidsData);
        }

        setUseDemo(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setUseDemo(true);
        setArtwork(DEMO_ARTWORKS[id] || null);
        setSupporters(DEMO_SUPPORTERS);
        setAuctionBids(DEMO_AUCTION_BIDS);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id, supabase]);

  const handleNewSupport = (newSupporter: {
    id: string;
    display_name: string;
    amount: number;
    message: string | null;
    badge: string;
    created_at: string;
    is_anonymous: boolean;
    avatar_url: string | null;
  }) => {
    setSupporters((prev) => [newSupporter, ...prev]);
    if (artwork) {
      setArtwork({
        ...artwork,
        total_support: artwork.total_support + newSupporter.amount,
        supporter_count: artwork.supporter_count + 1,
      });
    }
  };

  const highestBid = auctionBids.length > 0 ? auctionBids[0].bid_amount : 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <MuseumNav />
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#c9a96e] mx-auto mb-4" />
          <p className="text-sm text-[#7a7a7a] font-sans-gallery">Loading artwork...</p>
        </div>
      </main>
    );
  }

  if (!artwork) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] text-[#1a1a1a]">
        <MuseumNav />
        <section className="pt-32 pb-20 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f0ece4] border border-[#d0d0d0] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#c9a96e]/40" />
            </div>
            <h2 className="text-2xl font-serif-display text-[#1a1a1a] mb-3">Artwork Not Found</h2>
            <p className="text-sm text-[#7a7a7a] leading-relaxed font-light">
              This piece may have been removed or is no longer on display.
            </p>
            <Link href="/gallery" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[#1a1a1a] text-white text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all font-sans-gallery font-medium">
              <ArrowLeft className="w-4 h-4" />Back to Gallery
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const artistSlug = artwork.artist?.full_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#1a1a1a]">
      <MuseumNav />

      {useDemo && (
        <div className="bg-[#c9a96e]/10 border-b border-[#c9a96e]/20 py-2">
          <p className="text-center text-xs text-[#c9a96e] font-sans-gallery font-medium">
            Demo Mode
          </p>
        </div>
      )}

      <section className="pt-32 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link href="/gallery" className="inline-flex items-center gap-2 p-2 text-sm text-[#7a7a7a] hover:text-[#1a1a1a] transition-colors font-sans-gallery font-medium">
              <ArrowLeft className="w-4 h-4" />Back to Exhibition
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Artwork Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <div className="gallery-frame rounded-sm overflow-hidden bg-white">
                <div className="m-4">
                  <div className="aspect-[4/5] bg-gradient-to-br from-[#f5f5f0] to-[#e8e4dc] flex items-center justify-center relative overflow-hidden">
                    {artwork.image_url ? (
                      <img src={artwork.image_url} alt={artwork.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="relative text-center p-12">
                        <div className="w-32 h-32 mx-auto mb-6 rounded-full border-2 border-[#d0d0d0] bg-white flex items-center justify-center shadow-lg">
                          <Palette className="w-12 h-12 text-[#c9a96e]" />
                        </div>
                        <p className="text-[#9a9a9a] text-sm tracking-wider uppercase font-sans-gallery font-medium">{artwork.medium}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats bar */}
              <div className="mt-6 flex items-center gap-6 p-5 rounded-2xl bg-white border border-[#d0d0d0] shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f0ece4] border border-[#d0d0d0] flex items-center justify-center">
                    <Heart className="w-5 h-5 text-[#c9a96e]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#1a1a1a]">₹{artwork.total_support.toLocaleString()}</p>
                    <p className="text-[10px] text-[#7a7a7a] tracking-wider uppercase font-sans-gallery font-medium">Total Support</p>
                  </div>
                </div>
                <div className="h-10 w-px bg-[#e8e8e8]" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f0ece4] border border-[#d0d0d0] flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#c9a96e]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#1a1a1a]">{artwork.supporter_count}</p>
                    <p className="text-[10px] text-[#7a7a7a] tracking-wider uppercase font-sans-gallery font-medium">Patrons</p>
                  </div>
                </div>
                <div className="h-10 w-px bg-[#e8e8e8]" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f0ece4] border border-[#d0d0d0] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#c9a96e]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#1a1a1a]">{artwork.hours_invested}h</p>
                    <p className="text-[10px] text-[#7a7a7a] tracking-wider uppercase font-sans-gallery font-medium">Hours Invested</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Artwork Details */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px w-12 bg-[#c9a96e]" />
                  <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">{artwork.medium}</span>
                  {artwork.dimensions && (
                    <span className="text-[10px] text-[#7a7a7a] tracking-wider uppercase font-sans-gallery">• {artwork.dimensions}</span>
                  )}
                </div>
                <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-serif-display text-[#1a1a1a] leading-[1.1] tracking-tight mb-4 font-semibold">
                  {artwork.title}
                </h1>
                <p className="text-[#4a4a4a] leading-[1.8] font-light text-lg">
                  {artwork.description}
                </p>
              </div>

              {/* Artist Card */}
              {artwork.artist && (
                <div className="p-6 rounded-2xl bg-white border border-[#d0d0d0]">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#f0ece4] border border-[#c9a96e]/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {artwork.artist.avatar_url ? (
                        <img src={artwork.artist.avatar_url} alt={artwork.artist.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-serif-display text-[#c9a96e]">
                          {artwork.artist.full_name[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-serif-display text-[#1a1a1a] mb-1">{artwork.artist.full_name}</h3>
                      <p className="text-sm text-[#7a7a7a]">{artwork.artist.city}</p>
                      {artwork.artist.bio && (
                        <p className="text-sm text-[#4a4a4a] leading-relaxed mt-2">{artwork.artist.bio}</p>
                      )}
                      <Link
                        href={`/artist1/${artistSlug}`}
                        className="inline-flex items-center gap-1 mt-3 text-[11px] text-[#c9a96e] hover:text-[#1a1a1a] transition-colors font-sans-gallery font-semibold group"
                      >
                        <UserCircle className="w-3 h-3" />
                        Know About Artist
                        <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Deep Details */}
              {artwork.message_delivers && (
                <div className="p-6 rounded-2xl bg-[#f0ece4]/50 border border-[#c9a96e]/20">
                  <h3 className="text-sm font-sans-gallery text-[#c9a96e] tracking-[0.2em] uppercase mb-3 font-semibold">
                    What This Painting Means
                  </h3>
                  <p className="text-[#4a4a4a] leading-relaxed">{artwork.message_delivers}</p>
                </div>
              )}

              {artwork.technique_notes && (
                <div className="p-6 rounded-2xl bg-white border border-[#d0d0d0]">
                  <h3 className="text-sm font-sans-gallery text-[#1a1a1a] tracking-[0.2em] uppercase mb-3 font-semibold">
                    Process & Technique
                  </h3>
                  <p className="text-[#4a4a4a] leading-relaxed">{artwork.technique_notes}</p>
                </div>
              )}

              {artwork.inspiration_story && (
                <div className="p-6 rounded-2xl bg-white border border-[#d0d0d0]">
                  <h3 className="text-sm font-sans-gallery text-[#1a1a1a] tracking-[0.2em] uppercase mb-3 font-semibold">
                    Inspiration
                  </h3>
                  <p className="text-[#4a4a4a] leading-relaxed">{artwork.inspiration_story}</p>
                </div>
              )}

              {artwork.materials_used && artwork.materials_used.length > 0 && (
                <div>
                  <h3 className="text-sm font-sans-gallery text-[#1a1a1a] tracking-[0.2em] uppercase mb-3 font-semibold">
                    Materials Used
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {artwork.materials_used.map((material, i) => (
                      <span key={i} className="px-4 py-2 rounded-full bg-white border border-[#d0d0d0] text-sm text-[#4a4a4a] font-medium">
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* === AUCTION STATUS === */}
              {artwork.is_sold && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-[#c9a96e]/20 to-[#f0ece4] border-2 border-[#c9a96e]">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-[#c9a96e]" />
                    <h3 className="text-lg font-serif-display text-[#1a1a1a] font-semibold">Sold</h3>
                  </div>
                  <p className="text-sm text-[#4a4a4a]">
                    This artwork has found its permanent home. Thank you to all who supported and bid on this piece.
                  </p>
                </div>
              )}

              {/* Minimum Bid Info */}
              {!artwork.is_sold && (
                <div className="p-4 rounded-xl bg-[#f0ece4]/50 border border-[#c9a96e]/20">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-[#c9a96e]" />
                    <span className="text-sm text-[#4a4a4a] font-sans-gallery">
                      Minimum starting bid: <span className="font-semibold text-[#1a1a1a]">₹{artwork.minimum_bid?.toLocaleString() || '5000'}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setSupportModalOpen(true)}
                  className="flex-1 py-4 bg-[#1a1a1a] text-white text-sm font-semibold rounded-xl hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery"
                >
                  <Heart className="w-4 h-4 inline mr-2" />Support
                </button>
                <button
                  onClick={() => setAuctionModalOpen(true)}
                  className="flex-1 py-4 bg-white border-2 border-[#c9a96e] text-[#c9a96e] text-sm font-semibold rounded-xl hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery"
                >
                  <Gavel className="w-4 h-4 inline mr-2" />Place Bid
                </button>
                <button className="px-6 py-4 border-2 border-[#d0d0d0] rounded-xl text-[#7a7a7a] hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Auction History Link */}
              {auctionBids.length > 0 && (
                <Link
                  href="#auction-history"
                  className="inline-flex items-center gap-2 text-sm text-[#c9a96e] hover:text-[#1a1a1a] transition-colors font-sans-gallery font-medium"
                >
                  <Gavel className="w-4 h-4" />
                  View Auction History ({auctionBids.length} bids)
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              )}
            </motion.div>
          </div>

          {/* === AUCTION HISTORY SECTION === */}
          {auctionBids.length > 0 && (
            <motion.section
              id="auction-history"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mt-20 pt-16 border-t border-[#d0d0d0]"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="h-px w-12 bg-[#c9a96e]" />
                <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                  Auction History
                </span>
                <span className="text-[10px] text-[#7a7a7a] tracking-wider uppercase font-sans-gallery">
                  {auctionBids.length} bid{auctionBids.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {auctionBids.map((bid, i) => (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    className={`group bg-white border rounded-2xl p-6 hover:shadow-lg transition-all duration-500 ${
                      bid.is_winning_bid 
                        ? 'border-[#c9a96e] shadow-md shadow-[#c9a96e]/10' 
                        : 'border-[#d0d0d0] hover:border-[#c9a96e]/30'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          bid.is_winning_bid 
                            ? 'bg-[#c9a96e]/20 border border-[#c9a96e]' 
                            : 'bg-[#f0ece4] border border-[#d0d0d0]'
                        }`}>
                          <Gavel className={`w-4 h-4 ${bid.is_winning_bid ? 'text-[#c9a96e]' : 'text-[#7a7a7a]'}`} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#1a1a1a]">{bid.bidder_name}</h4>
                          {bid.is_winning_bid && (
                            <span className="text-[10px] text-[#c9a96e] font-sans-gallery font-semibold tracking-wider uppercase">
                              Highest Bid
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#1a1a1a]">₹{bid.bid_amount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Message */}
                    {bid.message && (
                      <p className="text-sm text-[#4a4a4a] leading-relaxed italic mb-4 pl-3 border-l-2 border-[#c9a96e]/20">
                        "{bid.message}"
                      </p>
                    )}

                    {/* Date */}
                    <p className="text-[10px] text-[#9a9a9a] font-sans-gallery pt-3 border-t border-[#e8e8e8]">
                      {new Date(bid.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* === SUPPORTERS SECTION === */}
          {supporters.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mt-20 pt-16 border-t border-[#d0d0d0]"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="h-px w-12 bg-[#c9a96e]" />
                <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                  Patrons Wall
                </span>
                <span className="text-[10px] text-[#7a7a7a] tracking-wider uppercase font-sans-gallery">
                  {supporters.length} supporter{supporters.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supporters.map((supporter, i) => (
                  <motion.div
                    key={supporter.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="group bg-white border border-[#d0d0d0] rounded-2xl p-6 hover:shadow-lg hover:border-[#c9a96e]/30 transition-all duration-500"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-[#f0ece4] border border-[#c9a96e]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {supporter.avatar_url && !supporter.is_anonymous ? (
                          <img
                            src={supporter.avatar_url}
                            alt={supporter.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-serif-display text-[#c9a96e] font-semibold">
                            {supporter.is_anonymous ? '?' : supporter.display_name[0]}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-[#1a1a1a] truncate">
                          {supporter.is_anonymous ? 'Anonymous Patron' : supporter.display_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0ece4] text-[#c9a96e] font-sans-gallery font-semibold tracking-wider uppercase">
                            {supporter.badge}
                          </span>
                          <span className="text-[10px] text-[#7a7a7a] font-sans-gallery">
                            ₹{supporter.amount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    {supporter.message && (
                      <div className="relative">
                        <MessageCircle className="absolute -top-1 -left-1 w-4 h-4 text-[#c9a96e]/20" />
                        <p className="text-sm text-[#4a4a4a] leading-relaxed italic pl-4 border-l-2 border-[#c9a96e]/20">
                          "{supporter.message}"
                        </p>
                      </div>
                    )}

                    {/* Date */}
                    <p className="text-[10px] text-[#9a9a9a] font-sans-gallery mt-4 pt-3 border-t border-[#e8e8e8]">
                      {new Date(supporter.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </section>

      {/* Support Modal */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        artworkTitle={artwork.title}
        artworkId={artwork.id}
        artistName={artwork.artist?.full_name || 'Unknown'}
        onSupport={handleNewSupport}
      />

      {/* Auction Bid Modal */}
      <AuctionBidModal
        isOpen={auctionModalOpen}
        onClose={() => setAuctionModalOpen(false)}
        artworkTitle={artwork.title}
        artworkId={artwork.id}
        artistName={artwork.artist?.full_name || 'Unknown'}
        currentHighestBid={highestBid}
        minimumBid={artwork.minimum_bid || 5000} // ← NEW: Pass minimum bid to modal
      />
    </main>
  );
}