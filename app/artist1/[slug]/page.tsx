// src/app/artist/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Instagram, Link as LinkIcon,
  Loader2, Palette, ArrowUpRight, Heart
} from 'lucide-react';
import Link from 'next/link';
import MuseumNav from '@/components/MuseumNav';
import { createBrowserClient } from '@supabase/ssr';

type Artist = {
  id: string;
  full_name: string;
  email: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  instagram_handle: string | null;
  portfolio_url: string | null;
  total_earnings: number;
  artworks_count: number;
  created_at: string;
};

type Artwork = {
  id: string;
  title: string;
  description: string | null;
  medium: string | null;
  image_url: string;
  total_support: number;
  supporter_count: number;
  hours_invested: number | null;
  message_delivers: string | null;
  technique_notes: string | null;
  materials_used: string[] | null;
  inspiration_story: string | null;
};

export default function ArtistPage() {
  const params = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const slug = params.slug as string;

    async function fetchArtist() {
      try {
        const { data: artistsData, error: artistsError } = await supabase
          .from('artists')
          .select('*');

        if (artistsError) throw artistsError;

        const matchedArtist = artistsData?.find((a: Artist) =>
          a.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
        );

        if (!matchedArtist) {
          setArtist(null);
          setArtworks([]);
        } else {
          setArtist(matchedArtist);

          const { data: artworksData, error: artworksError } = await supabase
            .from('artworks')
            .select('id, title, description, medium, image_url, total_support, supporter_count, hours_invested, message_delivers, technique_notes, materials_used, inspiration_story')
            .eq('artist_id', matchedArtist.id)
            .eq('status', 'live')
            .order('total_support', { ascending: false });

          if (!artworksError && artworksData) {
            setArtworks(artworksData);
          }
        }
      } catch (err) {
        console.error('Artist fetch error:', err);
        setArtist(null);
        setArtworks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchArtist();
  }, [params.slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <MuseumNav />
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#c9a96e] mx-auto mb-4" />
          <p className="text-sm text-[#7a7a7a] font-sans-gallery">Loading...</p>
        </div>
      </main>
    );
  }

  if (!artist) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] text-[#1a1a1a]">
        <MuseumNav />
        <section className="pt-32 pb-20 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f0ece4] border border-[#d0d0d0] flex items-center justify-center">
              <Palette className="w-8 h-8 text-[#c9a96e]/40" />
            </div>
            <h2 className="text-2xl font-serif-display text-[#1a1a1a] mb-3">Artist Not Found</h2>
            <p className="text-sm text-[#7a7a7a] leading-relaxed font-light">
              This artist profile may have been removed or is not yet published.
            </p>
            <Link href="/gallery" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[#1a1a1a] text-white text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all font-sans-gallery font-medium">
              <ArrowLeft className="w-4 h-4" />Back to Gallery
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#1a1a1a]">
      <MuseumNav />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative">
        <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#f0ece4] to-transparent" />
        <div className="relative max-w-[900px] mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/gallery" className="inline-flex items-center gap-2 text-sm text-[#7a7a7a] hover:text-[#1a1a1a] transition-colors font-sans-gallery font-medium mb-8">
              <ArrowLeft className="w-4 h-4" />Back to Exhibition
            </Link>

            {/* Avatar */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white border-2 border-[#c9a96e] flex items-center justify-center shadow-lg overflow-hidden">
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={artist.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-serif-display text-[#c9a96e] font-semibold">
                  {artist.full_name[0]}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif-display text-[#1a1a1a] mb-4 font-semibold leading-[1.1]">
              {artist.full_name}
            </h1>

            {/* Meta */}
            <div className="flex items-center justify-center gap-6 mb-6 text-sm text-[#7a7a7a] font-sans-gallery">
              {artist.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#c9a96e]" />{artist.city}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-[#c9a96e]" />₹{artist.total_earnings.toLocaleString()} Earned
              </span>
              <span className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#c9a96e]" />{artist.artworks_count} Artworks
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-4">
              {artist.instagram_handle && (
                <a
                  href={`https://instagram.com/${artist.instagram_handle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white border border-[#d0d0d0] flex items-center justify-center text-[#7a7a7a] hover:text-[#c9a96e] hover:border-[#c9a96e] transition-all"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {artist.portfolio_url && (
                <a
                  href={artist.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white border border-[#d0d0d0] flex items-center justify-center text-[#7a7a7a] hover:text-[#c9a96e] hover:border-[#c9a96e] transition-all"
                >
                  <LinkIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Blog Content */}
      <section className="pb-20">
        <div className="max-w-[680px] mx-auto px-6">
          
          {/* Bio */}
          {artist.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-[#c9a96e]" />
                <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                  About
                </span>
              </div>
              <p className="text-xl md:text-2xl text-[#1a1a1a] leading-[1.6] font-serif-display font-light">
                {artist.bio}
              </p>
            </motion.div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-16">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
            <Palette className="w-5 h-5 text-[#c9a96e]" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
          </div>

          {/* Artworks */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-serif-display text-[#1a1a1a] mb-2 font-semibold">
              Works
            </h2>
            <p className="text-[#7a7a7a] font-sans-gallery mb-10">
              {artworks.length} artwork{artworks.length !== 1 ? 's' : ''} in exhibition
            </p>

            {artworks.length === 0 ? (
              <div className="text-center py-12 bg-white border border-[#d0d0d0] rounded-xl">
                <p className="text-[#7a7a7a] font-sans-gallery">No artworks on display.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {artworks.map((artwork, i) => (
                  <motion.article
                    key={artwork.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white border border-[#d0d0d0] rounded-xl overflow-hidden"
                  >
                    <Link href={`/artwork1/${artwork.id}`} className="block">
                      <div className="aspect-[16/9] bg-gradient-to-br from-[#f5f5f0] to-[#e8e4dc] relative overflow-hidden">
                        {artwork.image_url ? (
                          <img
                            src={artwork.image_url}
                            alt={artwork.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Palette className="w-12 h-12 text-[#c9a96e]/30" />
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                          {artwork.medium}
                        </span>
                        {artwork.hours_invested && (
                          <span className="text-[10px] text-[#7a7a7a] tracking-wider uppercase font-sans-gallery">
                            {artwork.hours_invested} hours invested
                          </span>
                        )}
                      </div>

                      <Link href={`/artwork1/${artwork.id}`}>
                        <h3 className="text-2xl font-serif-display text-[#1a1a1a] hover:text-[#c9a96e] transition-colors duration-500 font-semibold mb-3">
                          {artwork.title}
                        </h3>
                      </Link>

                      <p className="text-[#4a4a4a] leading-[1.8] mb-6">
                        {artwork.description}
                      </p>

                      {/* What this artwork means */}
                      {artwork.message_delivers && (
                        <div className="p-4 rounded-lg bg-[#f0ece4]/50 border border-[#c9a96e]/20 mb-6">
                          <p className="text-sm text-[#4a4a4a] italic leading-relaxed">
                            "{artwork.message_delivers}"
                          </p>
                        </div>
                      )}

                      {/* Technique */}
                      {artwork.technique_notes && (
                        <div className="mb-6">
                          <h4 className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery font-semibold mb-2">
                            Process
                          </h4>
                          <p className="text-sm text-[#4a4a4a] leading-relaxed">
                            {artwork.technique_notes}
                          </p>
                        </div>
                      )}

                      {/* Materials */}
                      {artwork.materials_used && artwork.materials_used.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery font-semibold mb-2">
                            Materials
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {artwork.materials_used.map((mat, i) => (
                              <span key={i} className="px-3 py-1 rounded-full bg-[#f5f5f0] border border-[#d0d0d0] text-xs text-[#4a4a4a]">
                                {mat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inspiration */}
                      {artwork.inspiration_story && (
                        <div className="mb-6">
                          <h4 className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery font-semibold mb-2">
                            Inspiration
                          </h4>
                          <p className="text-sm text-[#4a4a4a] leading-relaxed">
                            {artwork.inspiration_story}
                          </p>
                        </div>
                      )}

                      {/* Stats & Link */}
                      <div className="flex items-center justify-between pt-6 border-t border-[#e8e8e8]">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-[#1a1a1a]">
                            ₹{artwork.total_support.toLocaleString()}
                          </span>
                          <span className="text-xs text-[#7a7a7a]">
                            <Heart className="w-3 h-3 inline mr-1 text-[#c9a96e]" />
                            {artwork.supporter_count} patrons
                          </span>
                        </div>
                        <Link
                          href={`/artwork1/${artwork.id}`}
                          className="text-[11px] text-[#c9a96e] hover:text-[#1a1a1a] transition-colors font-sans-gallery font-semibold flex items-center gap-1"
                        >
                          View Details <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>

          {/* Back to Gallery */}
          <div className="text-center pt-8">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery"
            >
              <ArrowLeft className="w-4 h-4" />Back to Exhibition
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}