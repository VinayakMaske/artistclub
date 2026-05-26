// src/app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Palette, Eye, Heart, Sparkles, Paintbrush, ArrowUpRight, Star } from 'lucide-react';
import Link from 'next/link';
import MuseumNav from '@/components/MuseumNav';
import { createBrowserClient } from '@supabase/ssr';

type FeaturedHero = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  artist_name: string;
  cta_text: string;
  cta_link: string;
};

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [featuredHero, setFeaturedHero] = useState<FeaturedHero | null>(null);
  const [loading, setLoading] = useState(true);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchFeaturedHero() {
      try {
        const { data, error } = await supabase
          .from('featured_hero')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setFeaturedHero({
            id: data.id,
            title: data.title,
            subtitle: data.subtitle,
            image_url: data.image_url,
            artist_name: data.artist_name,
            cta_text: data.cta_text || 'Enter the Gallery',
            cta_link: data.cta_link || '/gallery',
          });
        }
      } catch (err) {
        console.error('Featured hero fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedHero();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#1a1a1a] overflow-x-hidden">
      <MuseumNav />

      {/* Hero - Gallery Entrance */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f7f5f2]">
        {/* Subtle warm glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#c9a96e]/[0.06] to-transparent rounded-full blur-[100px]" />

        <motion.div 
          style={{ y: springY, opacity, scale }} 
          className="relative z-10 w-full max-w-[1000px] mx-auto px-6 py-32 text-center"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="flex items-center justify-center gap-6 mb-12"
          >
            <div className="h-px w-20 md:w-24 bg-gradient-to-r from-transparent to-[#c9a96e]" />
            <Palette className="w-5 h-5 text-[#c9a96e]" />
            <div className="h-px w-20 md:w-24 bg-gradient-to-l from-transparent to-[#c9a96e]" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-[10px] md:text-[11px] text-[#c9a96e] tracking-[0.4em] uppercase font-sans-gallery mb-8 font-semibold"
          >
            Est. 2026 · India
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif-display text-[#1a1a1a] leading-[1.05] tracking-tight mb-8"
          >
            Where art finds
            <br />
            its <span className="italic text-[#c9a96e]">true</span>{' '}
            <span className="block sm:inline">audience.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="text-base md:text-lg text-[#4a4a4a] leading-[1.8] max-w-xl mx-auto mb-12 font-light px-4"
          >
            Five artists. One month. You decide who deserves the spotlight.
            Browse our gallery, feel the work, and cast your support.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
          >
            <Link
              href="/gallery"
              className="group px-8 py-4 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#2a2a2a] hover:shadow-xl hover:shadow-black/20 transition-all duration-500 flex items-center gap-2 font-sans-gallery whitespace-nowrap"
            >
              Enter the Gallery
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#about"
              className="px-8 py-4 border-2 border-[#1a1a1a] text-[#1a1a1a] text-sm rounded-full hover:bg-[#1a1a1a] hover:text-white transition-all duration-500 font-sans-gallery whitespace-nowrap"
            >
              Discover Our Story
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 mt-16 md:mt-20"
          >
            {[
              { value: '5', label: 'Artists This Month' },
              { value: '₹49', label: 'Minimum Support' },
              { value: '1', label: 'Artist of the Month' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-serif-display text-[#1a1a1a] mb-1 font-semibold">{stat.value}</p>
                <p className="text-[9px] md:text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery font-medium">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <span className="text-[9px] text-[#7a7a7a] tracking-[0.3em] uppercase font-sans-gallery font-medium">
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-px h-10 bg-gradient-to-b from-[#c9a96e] to-transparent"
          />
        </motion.div>
      </section>

      {/* Marquee */}
      <section className="py-8 md:py-10 border-y border-[#d0d0d0] overflow-hidden bg-white">
        <div className="flex animate-marquee-gallery">
          {[...Array(2)].flatMap(() => [
            'Human Art', 'Real Emotion', 'Slow Creation', 'Direct Support',
            'Community Choice', 'Artist Dignity', 'No Algorithms', 'Permanent Legacy',
          ]).map((item, i) => (
            <div key={i} className="flex items-center gap-6 md:gap-8 px-6 md:px-8 shrink-0">
              <span className="text-lg md:text-xl font-serif-display text-[#d0d0d0] tracking-tight whitespace-nowrap font-semibold">
                {item}
              </span>
              <div className="w-2 h-2 rounded-full bg-[#c9a96e] shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-32 relative bg-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="order-2 lg:order-1"
            >
              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="h-px w-12 md:w-16 bg-[#c9a96e]" />
                <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                  Our Philosophy
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif-display text-[#1a1a1a] leading-[1.05] tracking-tight mb-6 md:mb-8">
                The gallery
                <br />
                <span className="italic text-[#c9a96e]">reimagined.</span>
              </h2>

              <div className="space-y-4 md:space-y-6 text-[#4a4a4a] leading-[1.8] md:leading-[1.9] font-light text-sm md:text-base">
                <p>
                  Traditional galleries decide what you should see. We believe you should decide 
                  what deserves to be seen. Every month, five artists submit their most honest work. 
                  No curators. No gatekeepers. Just you, the art, and your judgment.
                </p>
                <p>
                  When you support an artwork — ₹49, ₹99, ₹149, or ₹199 — you are not buying a 
                  product. You are casting a vote for the kind of art you want to exist in the world.
                </p>
                <p>
                  The other four? They keep every rupee they earned. Because this is not a 
                  competition with losers. It is a platform where every artist is witnessed.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-3 mt-6 md:mt-8">
                {['Direct Patronage', 'Transparent Pricing', 'Community Access', 'Digital Legacy'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-[#f0ece4] border border-[#d0d0d0] text-[10px] md:text-[11px] text-[#4a4a4a] tracking-wide font-sans-gallery font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="order-1 lg:order-2"
            >
              {/* REAL gallery frame with FEATURED HERO IMAGE */}
              <div className="gallery-frame rounded-sm overflow-hidden bg-white max-w-[400px] mx-auto lg:max-w-none">
                <div className="m-4">
                  <div className="aspect-[4/5] bg-gradient-to-br from-[#f5f5f0] to-[#e8e4dc] relative overflow-hidden">
                    {featuredHero?.image_url ? (
                      <Link href={featuredHero.cta_link} className="block w-full h-full">
                        <img
                          src={featuredHero.image_url}
                          alt={featuredHero.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        />
                        {/* Artwork info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-white text-sm font-serif-display font-semibold">{featuredHero.title}</p>
                          <p className="text-white/80 text-xs font-sans-gallery">{featuredHero.artist_name}</p>
                        </div>
                      </Link>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="grid grid-cols-2 gap-4">
                          {[Eye, Heart, Sparkles, Palette].map((Icon, i) => (
                            <div
                              key={i}
                              className="w-16 h-16 rounded-xl bg-white border border-[#d0d0d0] shadow-md flex items-center justify-center"
                            >
                              <Icon className="w-6 h-6 text-[#c9a96e]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-32 relative bg-[#f0ece4]">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4 md:mb-6">
              <div className="h-px w-12 md:w-16 bg-[#c9a96e]" />
              <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                The Process
              </span>
              <div className="h-px w-12 md:w-16 bg-[#c9a96e]" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif-display text-[#1a1a1a] leading-[1.1]">
              Five steps. One month.{' '}
              <span className="italic text-[#c9a96e]">Infinite impact.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {[
              { num: '01', title: 'Discovery', desc: 'We handpick 5 artists from across India' },
              { num: '02', title: 'Exhibition', desc: 'Their work goes live in our gallery' },
              { num: '03', title: 'Support', desc: 'You browse, feel, and cast your support' },
              { num: '04', title: 'Tally', desc: 'Live leaderboard shows community voice' },
              { num: '05', title: 'Crown', desc: 'Winner declared.' },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 md:p-8 bg-white rounded-lg border border-[#d0d0d0] hover:border-[#c9a96e] hover:shadow-lg hover:shadow-black/10 transition-all duration-500 relative"
              >
                <span className="text-[10px] text-[#c9a96e] tracking-[0.2em] uppercase font-sans-gallery font-semibold">
                  Step {step.num}
                </span>
                <h3 className="text-lg md:text-xl font-serif-display text-[#1a1a1a] mt-3 md:mt-4 mb-2 md:mb-3 font-semibold">{step.title}</h3>
                <p className="text-xs md:text-sm text-[#7a7a7a] leading-relaxed">{step.desc}</p>
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ARTIST PARTICIPATION SECTION */}
      <section className="py-20 md:py-32 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#c9a96e]/[0.03] to-transparent" />

        <div className="relative max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Visual with REAL gallery frame */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="gallery-frame rounded-sm max-w-[500px] mx-auto">
                <div className="relative aspect-square bg-gradient-to-br from-[#f5f5f0] to-[#e8e4dc] flex items-center justify-center m-6">
                  <div className="relative">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#c9a96e]/20 to-[#c9a96e]/10 border-2 border-[#c9a96e] flex items-center justify-center shadow-lg">
                      <Paintbrush className="w-12 h-12 md:w-16 md:h-16 text-[#c9a96e]" />
                    </div>

                    {/* Static orbiting stars */}
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                      {[
                        { top: '10%', left: '50%' },
                        { top: '40%', left: '90%' },
                        { top: '80%', left: '70%' },
                        { top: '80%', left: '30%' },
                        { top: '40%', left: '10%' },
                      ].map((pos, i) => (
                        <div
                          key={i}
                          className="absolute w-8 h-8 rounded-full bg-white border border-[#d0d0d0] shadow-md flex items-center justify-center"
                          style={{
                            top: pos.top,
                            left: pos.left,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <Star className="w-3 h-3 text-[#c9a96e]" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="h-px w-12 md:w-16 bg-[#c9a96e]" />
                <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                  For Artists
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif-display text-[#1a1a1a] leading-[1.05] tracking-tight mb-6 md:mb-8">
                Your canvas
                <br />
                <span className="italic text-[#c9a96e]">awaits.</span>
              </h2>

              <div className="space-y-4 md:space-y-6 text-[#4a4a4a] leading-[1.8] md:leading-[1.9] font-light text-sm md:text-base mb-8 md:mb-10">
                <p>
                  Are you an artist looking for a platform that values your work and connects 
                  you directly with patrons who care? PalettePune is built for creators like you.
                </p>
                <p>
                  Every month, we select five artists to showcase their work. The community 
                  supports what moves them — and you keep every rupee you earn, win or not.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-10">
                {[
                  { icon: Paintbrush, label: 'Direct Patronage', desc: 'Keep 70% of all support' },
                  { icon: Eye, label: 'Community Exposure', desc: '1,000+ potential patrons' },
                  { icon: Heart, label: 'Fair Competition', desc: 'Community decides, not judges' },
                  { icon: Star, label: 'Artist of the Month', desc: 'Featured + bonus commission' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="p-4 rounded-lg bg-[#f0ece4] border border-[#d0d0d0]">
                      <Icon className="w-5 h-5 text-[#c9a96e] mb-2" />
                      <p className="text-sm text-[#1a1a1a] font-semibold mb-1">{item.label}</p>
                      <p className="text-xs text-[#7a7a7a]">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              <Link
                href="/artist/apply"
                className="group inline-flex items-center gap-3 px-8 md:px-10 py-4 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery"
              >
                Participate Next Month
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <p className="text-xs text-[#7a7a7a] mt-4">
                All mediums welcome · No application fee · Open to artists across India
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 relative bg-[#f0ece4]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-2xl mx-auto px-6 text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-8 md:mb-10">
            <div className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-[#c9a96e]" />
            <Palette className="w-5 h-5 text-[#c9a96e]" />
            <div className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-[#c9a96e]" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif-display text-[#1a1a1a] leading-[1.1] mb-6 md:mb-8">
            The gallery
            <br />
            <span className="italic text-[#c9a96e]">awaits you.</span>
          </h2>

          <p className="text-[#4a4a4a] leading-[1.8] max-w-lg mx-auto mb-8 md:mb-10 font-light text-sm md:text-base">
            Five artworks are hanging in our halls right now. Each one carries 
            hours of human effort, doubt, and breakthrough. Walk through. Feel them. 
            Support the one that moves you.
          </p>

          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 px-8 md:px-10 py-4 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery"
          >
            Enter the Gallery
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-16 border-t border-[#d0d0d0] bg-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-[#c9a96e] flex items-center justify-center">
                <Palette className="w-4 h-4 text-[#c9a96e]" />
              </div>
              <span className="text-sm font-serif-display text-[#1a1a1a] font-semibold">
                Artist<span className="text-[#c9a96e]">Club</span>
              </span>
            </div>
            <p className="text-[9px] md:text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery text-center font-medium">
              © 2026 · A Gallery of Contemporary Art · Built by Artist for Artist
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}