// src/app/admin/applications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Loader2, User, Mail,
  MapPin, Clock, ArrowLeft, Lock, Eye, EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

type Application = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string;
  bio: string;
  avatar_url: string | null;
  instagram_handle: string | null;
  portfolio_url: string | null;
  title: string;
  description: string;
  medium: string;
  dimensions: string | null;
  image_url: string;
  message_delivers: string;
  technique_notes: string | null;
  materials_used: string[] | null;
  hours_invested: number | null;
  inspiration_story: string | null;
  status: string;
  review_notes: string | null;
  created_at: string;
};

// CHANGE THIS PASSWORD
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'fallback-password';

export default function AdminApplicationsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [processing, setProcessing] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('admin_auth');
    if (saved === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
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
    setApplications([]);
    setSelectedApp(null);
  };

  const fetchApplications = async () => {
    setLoading(true);
    let query = supabase
      .from('artist_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setApplications(data as Application[]);
    }
    setLoading(false);
  };

  const handleApprove = async (appId: string) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('approve_artist_application', {
        app_id: appId
      });

      if (error) throw error;

      setApplications(prev => prev.map(app =>
        app.id === appId ? { ...app, status: 'approved' } : app
      ));
      setSelectedApp(null);
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve. Check console.');
    }
    setProcessing(false);
  };

  const handleReject = async (appId: string) => {
    if (!reviewNote.trim()) {
      alert('Please add a review note explaining why.');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('artist_applications')
        .update({
          status: 'rejected',
          review_notes: reviewNote,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', appId);

      if (error) throw error;

      setApplications(prev => prev.map(app =>
        app.id === appId ? { ...app, status: 'rejected', review_notes: reviewNote } : app
      ));
      setSelectedApp(null);
      setReviewNote('');
    } catch (err) {
      console.error('Reject error:', err);
      alert('Failed to reject. Check console.');
    }
    setProcessing(false);
  };

  // Password Gate Screen
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
              <Lock className="w-7 h-7 text-[#c9a96e]" />
            </div>
            <h1 className="text-2xl font-serif-display text-[#1a1a1a] mb-2 font-semibold">
              Admin Access
            </h1>
            <p className="text-sm text-[#7a7a7a] font-light">
              Enter password to review artist applications
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a7a7a] hover:text-[#1a1a1a] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

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
            <Link
              href="/"
              className="text-xs text-[#7a7a7a] hover:text-[#1a1a1a] transition-colors font-sans-gallery"
            >
              ← Return to Homepage
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  // Main Admin Dashboard (rest of your existing code)
  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#1a1a1a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#d0d0d0]">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-[#f0ece4] rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#7a7a7a]" />
            </Link>
            <div>
              <h1 className="text-lg font-serif-display text-[#1a1a1a] font-semibold">
                Applications Review
              </h1>
              <p className="text-xs text-[#7a7a7a] font-sans-gallery">
                {applications.filter(a => a.status === 'pending').length} pending
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

            {/* Logout */}
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
        {/* Applications List */}
        <div className="grid gap-4">
          <AnimatePresence>
            {applications.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-lg ${
                  app.status === 'pending' ? 'border-[#d0d0d0] hover:border-[#c9a96e]' :
                  app.status === 'approved' ? 'border-green-200 bg-green-50/30' :
                  'border-red-200 bg-red-50/30'
                }`}
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#f0ece4] border border-[#d0d0d0] flex-shrink-0 overflow-hidden">
                    {app.avatar_url ? (
                      <img src={app.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-[#7a7a7a] m-3" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-serif-display text-lg text-[#1a1a1a] font-semibold">
                          {app.full_name}
                        </h3>
                        <p className="text-sm text-[#7a7a7a] font-sans-gallery">
                          {app.title} — {app.medium}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-sans-gallery font-semibold uppercase tracking-wider ${
                        app.status === 'pending' ? 'bg-[#f0ece4] text-[#c9a96e]' :
                        app.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-[#7a7a7a] font-sans-gallery">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {app.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {app.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {applications.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[#7a7a7a] font-sans-gallery">No applications found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedApp(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-[#d0d0d0] p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedApp.avatar_url && (
                    <img src={selectedApp.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <div>
                    <h2 className="font-serif-display text-xl text-[#1a1a1a] font-semibold">
                      {selectedApp.full_name}
                    </h2>
                    <p className="text-xs text-[#7a7a7a] font-sans-gallery">{selectedApp.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="w-8 h-8 rounded-full border border-[#d0d0d0] flex items-center justify-center hover:border-[#1a1a1a] transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Artwork Preview */}
                <div className="gallery-frame rounded-sm overflow-hidden bg-white">
                  <div className="m-4">
                    <div className="aspect-[4/5] bg-gradient-to-br from-[#f5f5f0] to-[#e8e4dc] rounded-lg overflow-hidden">
                      <img
                        src={selectedApp.image_url}
                        alt={selectedApp.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Artwork Info */}
                <div>
                  <h3 className="font-serif-display text-2xl text-[#1a1a1a] mb-2">{selectedApp.title}</h3>
                  <p className="text-sm text-[#c9a96e] font-sans-gallery font-semibold tracking-wider uppercase mb-3">
                    {selectedApp.medium} {selectedApp.dimensions && `• ${selectedApp.dimensions}`}
                  </p>
                  <p className="text-[#4a4a4a] leading-relaxed">{selectedApp.description}</p>
                </div>

                {/* Artist Bio */}
                <div className="p-4 rounded-xl bg-[#f0ece4] border border-[#d0d0d0]">
                  <h4 className="text-xs text-[#7a7a7a] tracking-wider uppercase font-sans-gallery font-semibold mb-2">
                    About the Artist
                  </h4>
                  <p className="text-sm text-[#4a4a4a] leading-relaxed">{selectedApp.bio}</p>
                  <div className="flex gap-4 mt-3 text-xs text-[#7a7a7a] font-sans-gallery">
                    {selectedApp.city && <span>📍 {selectedApp.city}</span>}
                    {selectedApp.instagram_handle && <span>📷 {selectedApp.instagram_handle}</span>}
                    {selectedApp.hours_invested && <span>⏱ {selectedApp.hours_invested} hours</span>}
                  </div>
                </div>

                {/* Deep Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs text-[#c9a96e] tracking-wider uppercase font-sans-gallery font-semibold mb-2">
                      What This Artwork Means
                    </h4>
                    <p className="text-sm text-[#4a4a4a] leading-relaxed">{selectedApp.message_delivers}</p>
                  </div>

                  {selectedApp.technique_notes && (
                    <div>
                      <h4 className="text-xs text-[#7a7a7a] tracking-wider uppercase font-sans-gallery font-semibold mb-2">
                        Process & Technique
                      </h4>
                      <p className="text-sm text-[#4a4a4a] leading-relaxed">{selectedApp.technique_notes}</p>
                    </div>
                  )}

                  {selectedApp.materials_used && selectedApp.materials_used.length > 0 && (
                    <div>
                      <h4 className="text-xs text-[#1a1a1a] tracking-wider uppercase font-sans-gallery font-semibold mb-2">
                        Materials Used
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedApp.materials_used.map((material, i) => (
                          <span key={i} className="px-4 py-2 rounded-full bg-white border border-[#d0d0d0] text-sm text-[#4a4a4a] font-medium">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedApp.status === 'pending' && (
                  <div className="space-y-3 pt-4 border-t border-[#d0d0d0]">
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Review notes (required for rejection, optional for approval)"
                      rows={2}
                      className="w-full px-4 py-3 bg-[#f5f5f0] border border-[#d0d0d0] rounded-xl text-sm text-[#1a1a1a] placeholder:text-[#9a9a9a] focus:border-[#c9a96e] focus:outline-none resize-none"
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(selectedApp.id)}
                        disabled={processing}
                        className="flex-1 py-3 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve & Publish
                      </button>

                      <button
                        onClick={() => handleReject(selectedApp.id)}
                        disabled={processing}
                        className="flex-1 py-3 border-2 border-red-200 text-red-600 font-semibold text-sm rounded-full hover:bg-red-50 transition-all duration-500 font-sans-gallery flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {selectedApp.status !== 'pending' && (
                  <div className="p-4 rounded-xl bg-[#f0ece4] border border-[#d0d0d0]">
                    <p className="text-sm text-[#4a4a4a]">
                      <span className="font-semibold">Status:</span> {selectedApp.status}
                    </p>
                    {selectedApp.review_notes && (
                      <p className="text-sm text-[#7a7a7a] mt-1">
                        <span className="font-semibold">Notes:</span> {selectedApp.review_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}