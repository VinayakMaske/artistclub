// src/components/SupportModal.tsx
'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Sparkles, Eye, Crown, Star, Loader2, Upload, User, ArrowRight } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkTitle: string;
  artworkId: string;
  artistName: string;
  onSupport?: (supporter: {
    id: string;
    display_name: string;
    amount: number;
    message: string | null;
    badge: string;
    created_at: string;
    is_anonymous: boolean;
    avatar_url: string | null;
  }) => void;
}

const TIERS = [
  {
    amount: 49,
    name: 'Appreciator',
    icon: Eye,
    desc: 'Your name on the artwork page',
    badge: 'Bronze Patron',
  },
  {
    amount: 99,
    name: 'Supporter',
    icon: Heart,
    desc: 'High-res download + community access',
    badge: 'Silver Advocate',
  },
  {
    amount: 149,
    name: 'Patron',
    icon: Sparkles,
    desc: 'Process video + artist AMA invite',
    badge: 'Gold Champion',
  },
  {
    amount: 199,
    name: 'Champion',
    icon: Crown,
    desc: 'Personalized certificate + early access',
    badge: 'Diamond Benefactor',
  },
];

export default function SupportModal({
  isOpen,
  onClose,
  artworkTitle,
  artworkId,
  artistName,
  onSupport,
}: SupportModalProps) {
  const [selectedTier, setSelectedTier] = useState(99);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [step, setStep] = useState<'select' | 'details' | 'processing' | 'success' | 'error'>('select');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleAvatarSelect = (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `supporter_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `supporters/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('artworks')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSupport = async () => {
    if (!isAnonymous && !displayName.trim()) return;
    if (!email.trim()) {
      setErrorMsg('Email is required for payment');
      return;
    }

    const selectedTierData = TIERS.find((t) => t.amount === selectedTier);
    setProcessing(true);
    setErrorMsg('');

    try {
      // Upload avatar if provided
      let avatarUrl = null;
      if (avatarFile && !isAnonymous) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      // Create Instamojo payment request via API route
      const response = await fetch('/api/instamojo/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedTier,
          buyer_name: isAnonymous ? 'Anonymous Patron' : displayName,
          email: email,
          phone: phone || undefined,
          purpose: `Support ${artworkTitle.slice(0, 20)}|${artworkId}`,
          artwork_id: artworkId,
          tier_amount: selectedTier,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.longurl) {
        // Show the actual error from the server
        const errorMsg = data.error || 'Failed to create payment link';
        throw new Error(errorMsg);
      }

      // Store pending support info in localStorage for after-payment handling
      const supporterInfo = {
        artwork_id: artworkId,
        amount: selectedTier,
        display_name: isAnonymous ? 'Anonymous Patron' : displayName,
        email,
        message: message || null,
        badge: selectedTierData?.badge || 'Bronze Patron',
        is_anonymous: isAnonymous,
        avatar_url: avatarUrl,
        payment_request_id: data.payment_request_id,
      };
      localStorage.setItem('pending_support', JSON.stringify(supporterInfo));

      // Redirect to Instamojo payment page (REAL MONEY)
      window.location.href = data.longurl;

    } catch (err: any) {
      console.error('Payment creation error:', err);
      setErrorMsg(err.message || 'Failed to initialize payment. Please try again.');
      setProcessing(false);
      setStep('details'); // Go back to details so user can retry
    }
  };

  const resetAndClose = () => {
    setStep('select');
    setSelectedTier(99);
    setDisplayName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setIsAnonymous(false);
    setAvatarFile(null);
    setAvatarPreview('');
    setErrorMsg('');
    setProcessing(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={resetAndClose} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-white border border-[#d0d0d0] rounded-2xl overflow-hidden shadow-2xl shadow-black/20 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="relative p-8 pb-6 border-b border-[#e8e8e8]">
              <button
                onClick={resetAndClose}
                className="absolute top-6 right-6 w-8 h-8 rounded-full border border-[#d0d0d0] flex items-center justify-center text-[#7a7a7a] hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery mb-3 font-semibold">
                Support This Artwork
              </p>
              <h3 className="text-2xl font-serif-display text-[#1a1a1a] leading-tight font-semibold">
                {artworkTitle}
              </h3>
              <p className="text-sm text-[#7a7a7a] mt-1">by {artistName}</p>
            </div>

            {/* Content */}
            <div className="px-8 pb-8 pt-6">
              {step === 'select' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <p className="text-[11px] text-[#7a7a7a] tracking-[0.15em] uppercase font-sans-gallery mb-4 font-medium">
                    Choose your level of support
                  </p>

                  {TIERS.map((tier) => {
                    const Icon = tier.icon;
                    const isSelected = selectedTier === tier.amount;

                    return (
                      <button
                        key={tier.amount}
                        onClick={() => setSelectedTier(tier.amount)}
                        className={`w-full p-5 rounded-xl border-2 transition-all duration-500 flex items-center gap-4 ${
                          isSelected
                            ? 'bg-[#f0ece4] border-[#c9a96e] shadow-md shadow-black/5'
                            : 'bg-white border-[#e8e8e8] hover:border-[#d0d0d0]'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-[#c9a96e]/20' : 'bg-[#f5f5f0]'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-[#c9a96e]' : 'text-[#9a9a9a]'}`} />
                        </div>
                        <div className="text-left flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-[#1a1a1a]">₹{tier.amount}</span>
                            <span className="text-xs text-[#7a7a7a] font-medium">{tier.name}</span>
                          </div>
                          <p className="text-xs text-[#9a9a9a] mt-0.5">{tier.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-[#c9a96e] flex items-center justify-center">
                            <Star className="w-3 h-3 text-white fill-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setStep('details')}
                    className="w-full mt-6 py-4 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery shadow-lg shadow-black/10"
                  >
                    Continue with ₹{selectedTier}
                  </button>
                </motion.div>
              )}

              {step === 'details' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <button
                    onClick={() => setStep('select')}
                    className="text-xs text-[#7a7a7a] hover:text-[#1a1a1a] transition-colors mb-2 font-medium"
                  >
                    ← Back to tiers
                  </button>

                  {/* Avatar Upload */}
                  {!isAnonymous && (
                    <div>
                      <label className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery block mb-2 font-semibold">
                        Your Photo (optional)
                      </label>
                      <div
                        onClick={() => avatarInputRef.current?.click()}
                        className={`cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-colors hover:border-[#c9a96e] ${
                          avatarPreview ? 'border-[#c9a96e] bg-[#f0ece4]/30' : 'border-[#d0d0d0] bg-white'
                        }`}
                      >
                        {avatarPreview ? (
                          <div className="relative inline-block">
                            <img
                              src={avatarPreview}
                              alt="Avatar preview"
                              className="w-16 h-16 rounded-full object-cover mx-auto"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAvatarFile(null);
                                setAvatarPreview('');
                              }}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-[#f5f5f0] flex items-center justify-center">
                              <User className="w-5 h-5 text-[#7a7a7a]" />
                            </div>
                            <p className="text-xs text-[#4a4a4a]">Click to upload photo</p>
                            <p className="text-[10px] text-[#9a9a9a]">JPG, PNG — Max 2MB</p>
                          </div>
                        )}
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleAvatarSelect(e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery block mb-2 font-semibold">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 bg-[#f5f5f0] border border-[#d0d0d0] rounded-xl text-[#1a1a1a] text-sm placeholder:text-[#9a9a9a] focus:border-[#c9a96e] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery block mb-2 font-semibold">
                      Email (optional, for receipt)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 bg-[#f5f5f0] border border-[#d0d0d0] rounded-xl text-[#1a1a1a] text-sm placeholder:text-[#9a9a9a] focus:border-[#c9a96e] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery block mb-2 font-semibold">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-[#f5f5f0] border border-[#d0d0d0] rounded-xl text-[#1a1a1a] text-sm placeholder:text-[#9a9a9a] focus:border-[#c9a96e] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery block mb-2 font-semibold">
                      Message to Artist (optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="A few words of appreciation..."
                      rows={3}
                      className="w-full px-4 py-3 bg-[#f5f5f0] border border-[#d0d0d0] rounded-xl text-[#1a1a1a] text-sm placeholder:text-[#9a9a9a] focus:border-[#c9a96e] focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => {
                        setIsAnonymous(e.target.checked);
                        if (e.target.checked) {
                          setAvatarFile(null);
                          setAvatarPreview('');
                        }
                      }}
                      className="w-4 h-4 rounded border-[#d0d0d0] bg-[#f5f5f0] text-[#c9a96e] focus:ring-[#c9a96e]"
                    />
                    <span className="text-sm text-[#7a7a7a]">Support anonymously (hides your name & photo)</span>
                  </label>

                  {errorMsg && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    onClick={handleSupport}
                    disabled={processing || (!isAnonymous && !displayName.trim())}
                    className="w-full mt-4 py-4 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery shadow-lg shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Complete Support ₹{selectedTier}</>
                    )}
                  </button>

                  <p className="text-[10px] text-[#7a7a7a] text-center">
                    Secure payment via Instamojo. You will be redirected to complete the payment.
                  </p>
                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Loader2 className="w-10 h-10 animate-spin text-[#c9a96e] mx-auto mb-4" />
                  <p className="text-lg font-serif-display text-[#1a1a1a] mb-2">Creating Payment Link...</p>
                  <p className="text-sm text-[#7a7a7a]">Redirecting to secure checkout...</p>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f0ece4] border-2 border-[#c9a96e] flex items-center justify-center">
                    <Heart className="w-8 h-8 text-[#c9a96e] fill-[#c9a96e]" />
                  </div>
                  <h4 className="text-2xl font-serif-display text-[#1a1a1a] mb-2 font-semibold">Thank You</h4>
                  <p className="text-sm text-[#4a4a4a] mb-6">
                    Your support of ₹{selectedTier} has been recorded.
                    <br />
                    {isAnonymous
                      ? 'You chose to remain anonymous.'
                      : `Your name "${displayName || 'Anonymous'}" will appear on the artwork page.`}
                  </p>
                  <button
                    onClick={resetAndClose}
                    className="px-8 py-3 border-2 border-[#d0d0d0] text-[#4a4a4a] text-sm rounded-full hover:border-[#c9a96e] hover:text-[#c9a96e] transition-all font-sans-gallery font-medium"
                  >
                    Return to Gallery
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}