// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Loader2, ArrowLeft, Gavel,
  Trophy, Medal, Award, Star, Crown
} from 'lucide-react';
import Link from 'next/link';
import MuseumNav from '@/components/MuseumNav';
import { createBrowserClient } from '@supabase/ssr';

type AuctionBid = {
  id: string;
  artwork_id: string;
  bidder_name: string;
  email: string;
  phone: string | null;
  bid_amount: number;
  message: string | null;
  status: string;
  is_winning_bid: boolean;
  created_at: string;
  artwork: {
    id: string;
    title: string;
    image_url: string;
    winner_tag: string | null;
    is_sold: boolean;
    artist: {
      full_name: string;
    } | null;
  } | null;
};

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'fallback-password';

export default function AdminAuctionPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const saved = localStorage.getItem('admin_auth');
    if (saved === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, filter]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_auth');
    setPassword('');
    setBids([]);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch bids with CORRECT join syntax: artwork:artwork_id(...)
      let query = supabase
        .from('auction_bids')
        .select(`
          id,
          artwork_id,
          bidder_name,
          email,
          phone,
          bid_amount,
          message,
          status,
          is_winning_bid,
          created_at,
          artwork:artwork_id(id, title, image_url, winner_tag, is_sold, artist:artist_id(full_name))
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: bidsData, error: bidsError } = await query;

      console.log('🔍 Admin bids data:', bidsData);
      console.log('🔍 Admin bids error:', bidsError);

      if (bidsError) {
        console.error('❌ Fetch error:', bidsError);
      }

      if (!bidsError && bidsData) {
        const formattedBids = bidsData.map((bid: any) => ({
          ...bid,
          artwork: Array.isArray(bid.artwork) ? bid.artwork[0] : bid.artwork,
        }));
        setBids(formattedBids);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bidId: string) => {
    setProcessing(true);
    try {
      // First get the bid to find artwork_id
      const { data: bidData } = await supabase
        .from('auction_bids')
        .select('artwork_id')
        .eq('id', bidId)
        .single();

      if (!bidData) throw new Error('Bid not found');

      // Update this bid to approved
      const { error } = await supabase
        .from('auction_bids')
        .update({ status: 'approved' })
        .eq('id', bidId);

      if (error) throw error;

      // Reset ALL other bids for same artwork to not winning
      await supabase
        .from('auction_bids')
        .update({ is_winning_bid: false })
        .eq('artwork_id', bidData.artwork_id);

      // Set this as the winning bid
      await supabase
        .from('auction_bids')
        .update({ is_winning_bid: true })
        .eq('id', bidId);

      fetchData();
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve bid');
    }
    setProcessing(false);
  };

  const handleReject = async (bidId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('auction_bids')
        .update({ status: 'rejected', is_winning_bid: false })
        .eq('id', bidId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Reject error:', err);
      alert('Failed to reject bid');
    }
    setProcessing(false);
  };

  const handleMarkSold = async (artworkId: string, bidId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('artworks')
        .update({
          is_sold: true,
          sold_to_bidder_id: bidId,
        })
        .eq('id', artworkId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Mark sold error:', err);
      alert('Failed to mark as sold');
    }
    setProcessing(false);
  };

  const handleSetWinnerTag = async (artworkId: string, tag: string | null) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('artworks')
        .update({ winner_tag: tag })
        .eq('id', artworkId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Set winner tag error:', err);
      alert('Failed to set winner tag');
    }
    setProcessing(false);
  };

  // Password Gate
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md mx-auto px-6"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#f0ece4] border border-[#c9a96e]/30 flex items-center justify-center">
              <Gavel className="w-7 h-7 text-[#c9a96e]" />
            </div>
            <h1 className="text-2xl font-serif-display text-[#1a1a1a] mb-2 font-semibold">
              Auction Admin
            </h1>
            <p className="text-sm text-[#7a7a7a] font-light">
              Manage auction bids and approve offers
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="Enter admin password"
              className={`w-full px-4 py-4 bg-white border rounded-xl text-[#1a1a1a] text-sm placeholder:text-[#9a9a9a] focus:border-[#c9a96e] focus:outline-none transition-colors ${
                passwordError ? 'border-red-400' : 'border-[#d0d0d0]'
              }`}
            />
            {passwordError && (
              <p className="text-xs text-red-500 text-center">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full py-4 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery"
            >
              Access Dashboard
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className="text-xs text-[#7a7a7a] hover:text-[#1a1a1a] transition-colors font-sans-gallery">
              ← Return to Homepage
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#1a1a1a]">
      <MuseumNav />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#d0d0d0]">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-[#f0ece4] rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#7a7a7a]" />
            </Link>
            <div>
              <h1 className="text-lg font-serif-display text-[#1a1a1a] font-semibold">
                Auction Management
              </h1>
              <p className="text-xs text-[#7a7a7a] font-sans-gallery">
                {bids.filter(b => b.status === 'pending').length} pending bids
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#f0ece4] rounded-full p-1">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-sans-gallery font-medium transition-all ${
                    filter === f
                      ? 'bg-[#1a1a1a] text-white'
                      : 'text-[#7a7a7a] hover:text-[#1a1a1a]'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs text-[#7a7a7a] hover:text-red-600 transition-colors font-sans-gallery font-medium border border-[#d0d0d0] rounded-full hover:border-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Bids List */}
        <div className="grid gap-4">
          <AnimatePresence>
            {bids.map((bid) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`bg-white rounded-xl border p-5 transition-all hover:shadow-lg ${
                  bid.status === 'pending' ? 'border-[#d0d0d0] hover:border-[#c9a96e]' :
                  bid.status === 'approved' ? 'border-green-200 bg-green-50/30' :
                  'border-red-200 bg-red-50/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-serif-display text-lg text-[#1a1a1a] font-semibold">
                        {bid.bidder_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-sans-gallery font-semibold uppercase tracking-wider ${
                        bid.status === 'pending' ? 'bg-[#f0ece4] text-[#c9a96e]' :
                        bid.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {bid.status}
                      </span>
                      {bid.is_winning_bid && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-sans-gallery font-semibold uppercase tracking-wider bg-[#c9a96e] text-white">
                          Highest Bid
                        </span>
                      )}
                    </div>

                    {/* Artwork info */}
                    {bid.artwork && (
                      <p className="text-xs text-[#c9a96e] font-sans-gallery font-medium mb-2">
                        For: {bid.artwork.title} by {bid.artwork.artist?.full_name || 'Unknown'}
                      </p>
                    )}

                    <p className="text-sm text-[#7a7a7a] font-sans-gallery mb-1">
                      {bid.email} {bid.phone && `• ${bid.phone}`}
                    </p>

                    <p className="text-2xl font-bold text-[#1a1a1a] mb-2">
                      ₹{bid.bid_amount.toLocaleString()}
                    </p>

                    {bid.message && (
                      <p className="text-sm text-[#4a4a4a] italic mb-3">
                        "{bid.message}"
                      </p>
                    )}

                    <p className="text-xs text-[#9a9a9a] font-sans-gallery">
                      {new Date(bid.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    {/* Winner Tag Section (per bid/artwork) */}
                    {bid.status === 'approved' && bid.artwork && (
                      <div className="mt-3 pt-3 border-t border-[#e8e8e8]">
                        <p className="text-[10px] text-[#7a7a7a] font-sans-gallery mb-2 uppercase tracking-wider">
                          Winner Tag for "{bid.artwork.title}"
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSetWinnerTag(bid.artwork_id, 'gold')}
                            disabled={processing}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-sans-gallery font-medium transition-all ${
                              bid.artwork.winner_tag === 'gold'
                                ? 'bg-[#c9a96e] text-white'
                                : 'bg-[#c9a96e]/10 border border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e] hover:text-white'
                            }`}
                          >
                            <Crown className="w-3 h-3" /> Gold
                          </button>
                          <button
                            onClick={() => handleSetWinnerTag(bid.artwork_id, 'silver')}
                            disabled={processing}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-sans-gallery font-medium transition-all ${
                              bid.artwork.winner_tag === 'silver'
                                ? 'bg-gray-400 text-white'
                                : 'bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-400 hover:text-white'
                            }`}
                          >
                            <Medal className="w-3 h-3" /> Silver
                          </button>
                          <button
                            onClick={() => handleSetWinnerTag(bid.artwork_id, 'bronze')}
                            disabled={processing}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-sans-gallery font-medium transition-all ${
                              bid.artwork.winner_tag === 'bronze'
                                ? 'bg-orange-400 text-white'
                                : 'bg-orange-50 border border-orange-300 text-orange-600 hover:bg-orange-400 hover:text-white'
                            }`}
                          >
                            <Award className="w-3 h-3" /> Bronze
                          </button>
                          <button
                            onClick={() => handleSetWinnerTag(bid.artwork_id, null)}
                            disabled={processing}
                            className="px-3 py-1.5 rounded-full text-xs font-sans-gallery font-medium text-[#7a7a7a] hover:text-red-500 transition-all"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {bid.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(bid.id)}
                          disabled={processing}
                          className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all font-sans-gallery flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(bid.id)}
                          disabled={processing}
                          className="px-4 py-2 border-2 border-red-200 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50 transition-all font-sans-gallery flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </>
                    )}

                    {bid.status === 'approved' && !bid.is_winning_bid && (
                      <button
                        onClick={() => handleApprove(bid.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-[#c9a96e] text-white text-xs font-semibold rounded-full hover:bg-[#a08050] transition-all font-sans-gallery flex items-center gap-1"
                      >
                        <Trophy className="w-3 h-3" /> Set as Winner
                      </button>
                    )}

                    {bid.is_winning_bid && !bid.artwork?.is_sold && (
                      <button
                        onClick={() => handleMarkSold(bid.artwork_id, bid.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-full hover:bg-green-700 transition-all font-sans-gallery flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" /> Mark Sold
                      </button>
                    )}

                    {bid.artwork?.is_sold && (
                      <span className="px-4 py-2 bg-green-100 text-green-700 text-xs font-semibold rounded-full font-sans-gallery flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Sold
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {bids.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[#7a7a7a] font-sans-gallery">No bids found</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}