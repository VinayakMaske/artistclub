// src/app/gallery/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Trophy, Clock, Users, ArrowUpRight,
  Sparkles, Filter, Loader2, Palette, UserCircle
} from 'lucide-react';
import Link from 'next/link';
import MuseumNav from '@/components/MuseumNav';
import SupportModal from '@/components/SupportModal';
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
  artist_id: string;
  artist_name: string;
  artist_city: string | null;
  artist_avatar: string | null;
  artist_slug: string;
};

type Supporter = {
  id: string;
  display_name: string;
  amount: number;
  badge: string;
  created_at: string;
  is_anonymous: boolean;
};

const DEMO_ARTWORKS: Artwork[] = [
  {
    id: '1',
    title: 'Monsoon Memories',
    description: 'A meditation on the Indian monsoon — the waiting, the arrival, the surrender.',
    medium: 'Acrylic on Canvas',
    image_url: '',
    hours_invested: 45,
    total_support: 12400,
    supporter_count: 89,
    status: 'live',
    artist_id: 'a1',
    artist_name: 'Aarav Mehta',
    artist_city: 'Pune',
    artist_avatar: null,
    artist_slug: 'aarav-mehta',
  },
  {
    id: '2',
    title: 'Identity Fragmented',
    description: 'An exploration of self in a world of constant change and digital personas.',
    medium: 'Mixed Media',
    image_url: '',
    hours_invested: 60,
    total_support: 15600,
    supporter_count: 112,
    status: 'live',
    artist_id: 'a2',
    artist_name: 'Priya Krishnan',
    artist_city: 'Mumbai',
    artist_avatar: null,
    artist_slug: 'priya-krishnan',
  },
  {
    id: '3',
    title: 'The Last Garden',
    description: 'A traditional miniature depicting a modern ecological crisis.',
    medium: 'Gouache on Paper',
    image_url: '',
    hours_invested: 80,
    total_support: 9800,
    supporter_count: 67,
    status: 'live',
    artist_id: 'a3',
    artist_name: 'Rohan Deshpande',
    artist_city: 'Pune',
    artist_avatar: null,
    artist_slug: 'rohan-deshpande',
  },
  {
    id: '4',
    title: 'Urban Skin',
    description: 'The city as a living organism — layers, scars, beauty in decay.',
    medium: 'Mixed Media Collage',
    image_url: '',
    hours_invested: 55,
    total_support: 11200,
    supporter_count: 78,
    status: 'live',
    artist_id: 'a4',
    artist_name: 'Ananya Sharma',
    artist_city: 'Bangalore',
    artist_avatar: null,
    artist_slug: 'ananya-sharma',
  },
  {
    id: '5',
    title: 'Reclaimed Dreams',
    description: 'Sculptural painting using materials destined for landfill.',
    medium: 'Reclaimed Materials on Wood',
    image_url: '',
    hours_invested: 70,
    total_support: 8900,
    supporter_count: 54,
    status: 'live',
    artist_id: 'a5',
    artist_name: 'Vikram Patel',
    artist_city: 'Delhi',
    artist_avatar: null,
    artist_slug: 'vikram-patel',
  },
];

const DEMO_SUPPORTERS: Supporter[] = [
  { id: 's1', display_name: 'Priya S.', amount: 199, badge: 'Diamond Benefactor', created_at: '2026-05-20', is_anonymous: false },
  { id: 's2', display_name: 'Rohan D.', amount: 149, badge: 'Gold Champion', created_at: '2026-05-19', is_anonymous: false },
  { id: 's3', display_name: 'Anonymous', amount: 99, badge: 'Silver Advocate', created_at: '2026-05-18', is_anonymous: true },
  { id: 's4', display_name: 'Ananya K.', amount: 199, badge: 'Diamond Benefactor', created_at: '2026-05-17', is_anonymous: false },
  { id: 's5', display_name: 'Vikram P.', amount: 49, badge: 'Bronze Patron', created_at: '2026-05-16', is_anonymous: false },
];

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'leaderboard'>('grid');
  const [useDemo, setUseDemo] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchGalleryData();
  }, []);

  const fetchGalleryData = async () => {
    try {
      // Fetch artworks with artist info from NEW simple schema
      const { data: artworksData, error: artworksError } = await supabase
        .from('artworks')
        .select(`
          id, title, description, medium, image_url,
          hours_invested, total_support, supporter_count, status,
          artist:artists(id, full_name, city, avatar_url)
        `)
        .eq('status', 'live')
        .order('total_support', { ascending: false });

      if (artworksError) throw artworksError;

      if (artworksData && artworksData.length > 0) {
        const formattedArtworks: Artwork[] = artworksData.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          medium: item.medium,
          image_url: item.image_url || '',
          hours_invested: item.hours_invested,
          total_support: Number(item.total_support) || 0,
          supporter_count: Number(item.supporter_count) || 0,
          status: item.status,
          artist_id: item.artist?.id || '',
          artist_name: item.artist?.full_name || 'Unknown',
          artist_city: item.artist?.city,
          artist_avatar: item.artist?.avatar_url,
          artist_slug: item.artist?.full_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
        }));

        setArtworks(formattedArtworks);
        setUseDemo(false);
      } else {
        // Fallback to demo
        setUseDemo(true);
        setArtworks(DEMO_ARTWORKS);
      }

      // Fetch recent supporters
      const { data: supportersData, error: supportersError } = await supabase
        .from('supporters')
        .select('id, display_name, amount, badge, created_at, is_anonymous')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!supportersError && supportersData) {
        setSupporters(supportersData);
      } else {
        setSupporters(DEMO_SUPPORTERS);
      }
    } catch (err) {
      console.error('Gallery fetch error:', err);
      setUseDemo(true);
      setArtworks(DEMO_ARTWORKS);
      setSupporters(DEMO_SUPPORTERS);
    } finally {
      setLoading(false);
    }
  };

  const handleSupport = (artwork: Artwork) => {
    setActiveArtwork(artwork);
    setSupportModalOpen(true);
  };

  const handleNewSupport = (newSupporter: Supporter) => {
    setSupporters((prev: Supporter[]) => [newSupporter, ...prev]);
    if (!useDemo) {
      fetchGalleryData();
    }
  };

  const totalPool = artworks.reduce((sum, a) => sum + a.total_support, 0);
  const totalSupporters = artworks.reduce((sum, a) => sum + a.supporter_count, 0);
  const sortedArtworks = [...artworks].sort((a, b) => b.total_support - a.total_support);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <MuseumNav />
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#c9a96e] mx-auto mb-4" />
          <p className="text-sm text-[#7a7a7a] font-sans-gallery">Curating the exhibition...</p>
        </div>
      </main>
    );
  }

  if (artworks.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] text-[#1a1a1a]">
        <MuseumNav />
        <section className="pt-32 pb-20 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f0ece4] border border-[#d0d0d0] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#c9a96e]/40" />
            </div>
            <h2 className="text-2xl font-serif-display text-[#1a1a1a] mb-3">The Gallery is Being Prepared</h2>
            <p className="text-sm text-[#7a7a7a] leading-relaxed font-light">
              Our curators are selecting this month's featured artworks. Check back soon.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#1a1a1a]">
      <MuseumNav />
      
      {useDemo && (
        <div className="bg-[#c9a96e]/10 border-b border-[#c9a96e]/20 py-2">
          <p className="text-center text-xs text-[#c9a96e] font-sans-gallery font-medium">
            Demo Mode — Connect Supabase to see real data
          </p>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative bg-[#f7f5f2]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#c9a96e]/[0.06] to-transparent rounded-full blur-[100px]" />
        
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-[#c9a96e]" />
              <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                Live Exhibition
              </span>
            </div>
            
            <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-serif-display text-[#1a1a1a] leading-[1.05] tracking-tight mb-6 font-semibold">
              The Exhibition Hall
            </h1>
            
            <p className="text-[#4a4a4a] max-w-xl leading-[1.8] font-light mb-10">
              {artworks.length} artworks hang in these halls. Each one carries hours of human effort, doubt, and breakthrough. Walk through. Feel them. Support the one that moves you.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 p-6 rounded-2xl bg-white border border-[#d0d0d0] shadow-lg shadow-black/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f0ece4] border border-[#d0d0d0] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#c9a96e]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a]">₹{totalPool.toLocaleString()}</p>
                  <p className="text-[10px] text-[#7a7a7a] tracking-wider uppercase font-sans-gallery font-medium">Total Support Pool</p>
                </div>
              </div>
              <div className="h-10 w-px bg-[#e8e8e8]" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f0ece4] border border-[#d0d0d0] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#c9a96e]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a]">{totalSupporters}</p>
                  <p className="text-[10px] text-[#7a7a7a] tracking-wider uppercase font-sans-gallery font-medium">Patrons This Month</p>
                </div>
              </div>
              <div className="h-10 w-px bg-[#e8e8e8]" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f0ece4] border border-[#d0d0d0] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#c9a96e]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a]">{artworks.length}</p>
                  <p className="text-[10px] text-[#7a7a7a] tracking-wider uppercase font-sans-gallery font-medium">Artworks on Display</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* View Toggle */}
      <section className="pb-8 bg-[#f7f5f2]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode('grid')} className={`px-4 py-2 rounded-full text-[11px] tracking-wider uppercase font-sans-gallery transition-all font-medium ${viewMode === 'grid' ? 'bg-[#1a1a1a] text-white' : 'text-[#7a7a7a] hover:text-[#1a1a1a]'}`}>
                Gallery View
              </button>
              <button onClick={() => setViewMode('leaderboard')} className={`px-4 py-2 rounded-full text-[11px] tracking-wider uppercase font-sans-gallery transition-all font-medium ${viewMode === 'leaderboard' ? 'bg-[#1a1a1a] text-white' : 'text-[#7a7a7a] hover:text-[#1a1a1a]'}`}>
                Leaderboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.section key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 bg-[#f7f5f2]">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedArtworks.map((artwork, i) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative"
                  >
                    {/* Frame */}
                    <div className="gallery-frame rounded-sm overflow-hidden bg-white">
                      <div className="m-3">
                        <Link href={`/artwork1/${artwork.id}`} className="block">
                          <div className="aspect-[4/5] bg-gradient-to-br from-[#f5f5f0] to-[#e8e4dc] flex items-center justify-center relative overflow-hidden cursor-pointer">
                            {artwork.image_url ? (
                              <img src={artwork.image_url} alt={artwork.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="relative text-center p-8">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-[#d0d0d0] bg-white flex items-center justify-center shadow-md">
                                  <Palette className="w-8 h-8 text-[#c9a96e]" />
                                </div>
                                <p className="text-[#9a9a9a] text-xs tracking-wider uppercase font-sans-gallery">{artwork.medium}</p>
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Plaque */}
                        <div className="gallery-plaque p-4 mt-3 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Link href={`/artwork1/${artwork.id}`}>
                                <h3 className="text-lg font-serif-display text-[#1a1a1a] group-hover:text-[#c9a96e] transition-colors duration-500 font-semibold">
                                  {artwork.title}
                                </h3>
                              </Link>
                              <p className="text-sm text-[#7a7a7a]">{artwork.artist_name} {artwork.artist_city && `• ${artwork.artist_city}`}</p>
                            </div>
                            {i === 0 && (
                              <div className="px-2 py-1 rounded bg-[#f0ece4] border border-[#c9a96e]/30">
                                <span className="text-[10px] text-[#c9a96e] tracking-wider uppercase font-sans-gallery font-semibold">Leading</span>
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-[#7a7a7a] leading-relaxed mb-3 line-clamp-2">{artwork.description}</p>

                          <Link
  href={`/artist1/${artwork.artist_slug}`}
  className="inline-flex items-center gap-1 text-[11px] text-[#c9a96e] hover:text-[#1a1a1a] transition-colors font-sans-gallery font-semibold mb-3 group/artist"
>
  <UserCircle className="w-3 h-3" />
  Know About Artist
  <ArrowUpRight className="w-3 h-3 group-hover/artist:translate-x-0.5 group-hover/artist:-translate-y-0.5 transition-transform" />
</Link>

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-[#1a1a1a] font-medium">₹{artwork.total_support.toLocaleString()}</span>
                              <span className="text-sm text-[#9a9a9a]"><Users className="w-3.5 h-3.5 inline mr-1" />{artwork.supporter_count}</span>
                            </div>
                            <span className="text-[10px] text-[#9a9a9a] tracking-wider uppercase font-sans-gallery">{artwork.hours_invested}hrs</span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1 bg-[#e8e8e8] rounded-full overflow-hidden mb-3">
                            <motion.div
                              className="h-full bg-gradient-to-r from-[#c9a96e] to-[#b8956a] rounded-full"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${Math.min((artwork.total_support / 20000) * 100, 100)}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.5, delay: 0.3 }}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSupport(artwork)}
                              className="flex-1 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded-lg hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery"
                            >
                              <Heart className="w-4 h-4 inline mr-2" />Support
                            </button>
                            <Link
                              href={`/artwork1/${artwork.id}`}
                              className="px-4 py-3 border border-[#d0d0d0] rounded-lg text-[#7a7a7a] hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all duration-300"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        ) : (
          /* Leaderboard View */
          <motion.section key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 bg-[#f7f5f2]">
            <div className="max-w-[800px] mx-auto px-6 lg:px-12">
              <div className="space-y-4">
                {sortedArtworks.map((artwork, i) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group p-6 rounded-2xl bg-white border border-[#e8e8e8] hover:border-[#c9a96e]/30 hover:shadow-lg hover:shadow-black/[0.03] transition-all duration-500"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${i === 0 ? 'bg-[#f0ece4] text-[#c9a96e]' : 'bg-[#f5f5f0] text-[#7a7a7a]'}`}>
                        {i === 0 ? <Trophy className="w-5 h-5" /> : i + 1}
                      </div>
                      <div className="flex-1">
                        <Link href={`/artwork1/${artwork.id}`}>
                          <h3 className="text-lg font-serif-display text-[#1a1a1a] group-hover:text-[#c9a96e] transition-colors font-semibold">
                            {artwork.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-[#7a7a7a]">{artwork.artist_name} • {artwork.medium}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#1a1a1a]">₹{artwork.total_support.toLocaleString()}</p>
                        <p className="text-xs text-[#9a9a9a]">{artwork.supporter_count} patrons</p>
                      </div>
                      <button
                        onClick={() => handleSupport(artwork)}
                        className="px-6 py-3 bg-[#1a1a1a] text-white text-sm rounded-xl hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all font-sans-gallery font-medium"
                      >
                        Support
                      </button>
                    </div>
                    <div className="mt-4 ml-[72px]">
                      <div className="h-1 bg-[#e8e8e8] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#c9a96e] to-[#b8956a] rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(artwork.total_support / sortedArtworks[0].total_support) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Recent Patrons */}
      {supporters.length > 0 && (
        <section className="py-16 border-t border-[#d0d0d0] bg-white">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px w-12 bg-[#c9a96e]" />
              <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">Recent Patrons</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {supporters.map((supporter, i) => (
                <motion.div
                  key={supporter.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="px-4 py-2 rounded-full bg-[#f5f5f0] border border-[#d0d0d0] flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-[#f0ece4] border border-[#c9a96e]/30 flex items-center justify-center">
                    <span className="text-[10px] text-[#c9a96e] font-semibold">{supporter.display_name[0]}</span>
                  </div>
                  <span className="text-xs text-[#4a4a4a] font-medium">{supporter.display_name}</span>
                  <span className="text-[10px] text-[#c9a96e] font-semibold">₹{supporter.amount}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Support Modal */}
      {activeArtwork && (
        <SupportModal
          isOpen={supportModalOpen}
          onClose={() => { setSupportModalOpen(false); setActiveArtwork(null); }}
          artworkTitle={activeArtwork.title}
          artworkId={activeArtwork.id}
          artistName={activeArtwork.artist_name}
          onSupport={handleNewSupport}
        />
      )}
    </main>
  );
}