'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Palette } from 'lucide-react';
import Link from 'next/link';

export default function MuseumNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: 'Exhibition', href: '/gallery' },
    { label: 'The Artists', href: '/gallery#artists' },
    { label: 'Leaderboard', href: '/gallery#leaderboard' },
    { label: 'Participate', href: '/artist/apply' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-2xl border-b border-[#d0d0d0] shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.8 }}
              className="w-10 h-10 rounded-full border-2 border-[#c9a96e] flex items-center justify-center bg-white"
            >
              <Palette className="w-5 h-5 text-[#c9a96e]" />
            </motion.div>
            <div>
              <span className="text-lg font-serif-display text-[#1a1a1a] tracking-wide font-semibold">
                Palette<span className="text-[#c9a96e]">Pune</span>
              </span>
              <span className="block text-[9px] text-[#7a7a7a] tracking-[0.3em] uppercase font-sans-gallery font-medium">
                Gallery of Contemporary Art
              </span>
            </div>
          </Link>

          {/* Desktop Nav — Four items on the right */}
          <div className="hidden lg:flex items-center gap-10">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[13px] text-[#4a4a4a] hover:text-[#c9a96e] tracking-[0.2em] uppercase font-sans-gallery transition-colors duration-500 relative group font-medium"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#c9a96e] group-hover:w-full transition-all duration-500" />
              </Link>
            ))}
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden text-[#4a4a4a] hover:text-[#1a1a1a] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-white/98 backdrop-blur-2xl lg:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="text-2xl font-serif-display text-[#4a4a4a] hover:text-[#c9a96e] transition-colors font-semibold"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}