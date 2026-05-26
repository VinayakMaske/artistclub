'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gavel, Loader2, User, Mail, Phone, MessageSquare, ArrowRight } from 'lucide-react';

interface AuctionBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkTitle: string;
  artworkId: string;
  artistName: string;
  currentHighestBid?: number;
}

export default function AuctionBidModal({
  isOpen,
  onClose,
  artworkTitle,
  artworkId,
  artistName,
  currentHighestBid = 0,
}: AuctionBidModalProps) {
  const [bidderName, setBidderName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [errorMsg, setErrorMsg] = useState('');

  const minBid = currentHighestBid > 0 ? currentHighestBid + 500 : 5000;

  // Check if we're in demo mode (artworkId is not a valid UUID)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artworkId);
  const isDemo = !isUUID;

  const handleSubmit = async () => {
    // Validation
    if (!bidderName.trim()) { setErrorMsg('Please enter your name'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrorMsg('Please enter a valid email'); return; }
    if (!bidAmount || Number(bidAmount) < minBid) { setErrorMsg(`Minimum bid is ₹${minBid.toLocaleString()}`); return; }

    // If demo mode, show success without API call
    if (isDemo) {
      setStep('success');
      return;
    }

    setStep('submitting');
    setErrorMsg('');

    try {
      const response = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artwork_id: artworkId,
          bidder_name: bidderName,
          email,
          phone: phone || null,
          bid_amount: Number(bidAmount),
          message: message || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bid');
      }

      setStep('success');
    } catch (err: any) {
      console.error('Bid error:', err);
      setErrorMsg(err.message || 'Failed to place bid. Please try again.');
      setStep('form');
    }
  };

  const resetAndClose = () => {
    setStep('form');
    setBidderName('');
    setEmail('');
    setPhone('');
    setBidAmount('');
    setMessage('');
    setErrorMsg('');
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

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#f0ece4] border border-[#c9a96e]/30 flex items-center justify-center">
                  <Gavel className="w-5 h-5 text-[#c9a96e]" />
                </div>
                <p className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                  Place Your Bid
                </p>
              </div>
              <h3 className="text-2xl font-serif-display text-[#1a1a1a] leading-tight font-semibold">
                {artworkTitle}
              </h3>
              <p className="text-sm text-[#7a1a1a] mt-1">by {artistName}</p>
              {currentHighestBid > 0 && (
                <p className="text-xs text-[#c9a96e] mt-2 font-sans-gallery font-medium">
                  Current highest bid: ₹{currentHighestBid.toLocaleString()}
                </p>
              )}
              {isDemo && (
                <p className="text-[10px] text-[#c9a96e] mt-2 font-sans-gallery font-medium bg-[#c9a96e]/10 px-3 py-1 rounded-full inline-block">
                  Demo Mode — Bid will not be saved
                </p>
              )}
            </div>

            {/* Content */}
            <div className="px-8 pb-8 pt-6">
              {step === 'form' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Bid Amount */}
                  <div>
                    <label className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery block mb-2 font-semibold">
                      Your Bid Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a1a1a] font-semibold">₹</span>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Minimum ₹${minBid.toLocaleString()}`}
                        min={minBid}
                        className="w-full pl-8 pr-4 py-3 bg-[#f5f5f0] border border-[#d0d0d0] rounded-xl text-[#1a1a1a] text-sm placeholder:text-[#9a9a9a] focus:border-[#c9a96e] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-[#7a7a7a] mt-1 font-sans-gallery">
                      Minimum bid: ₹{minBid.toLocaleString()}
                    </p>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery block mb-2 font-semibold">
                      Your Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a]" />
                      <input
                        type="text"
                        value={bidderName}
                        onChange={(e) => setBidderName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-11 pr-4 py-3 bg-[#f5f5f0] border border-[#d0d0d0] rounded-xl text-[#1a1a1a] text-sm placeholder:text-[#9a9a9a] focus:border-[#c9a96e] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery block mb-2 font-semibold">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-11 pr-4 py-3 bg-[#f5f5f0] border border-[#d0d0d0] rounded-xl text-[#1a1a1a] text-sm placeholder:text-[#9a9a9a] focus:border-[#c9a96e] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery block mb-2 font-semibold">
                      Phone (optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a]" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-11 pr-4 py-3 bg-[#f5f5f0] border border-[#d0d0d0] rounded-xl text-[#1a1a1a] text-sm placeholder:text-[#9a9a9a] focus:border-[#c9a96e] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery block mb-2 font-semibold">
                      Message to Artist (optional)
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-3.5 w-4 h-4 text-[#7a7a7a]" />
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Why do you want to own this piece?"
                        rows={3}
                        className="w-full pl-11 pr-4 py-3 bg-[#f5f5f0] border border-[#d0d0d0] rounded-xl text-[#1a1a1a] text-sm placeholder:text-[#9a9a9a] focus:border-[#c9a96e] focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    onClick={handleSubmit}
                    className="w-full mt-4 py-4 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                  >
                    {isDemo ? 'Place Demo Bid' : 'Place Bid'} <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[10px] text-[#7a7a7a] text-center">
                    {isDemo 
                      ? 'This is a demo. Bids will not be saved to the database.'
                      : 'Your bid will be reviewed by the artist before being displayed publicly.'
                    }
                  </p>
                </motion.div>
              )}

              {step === 'submitting' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <Loader2 className="w-10 h-10 animate-spin text-[#c9a96e] mx-auto mb-4" />
                  <p className="text-lg font-serif-display text-[#1a1a1a] mb-2">Submitting Your Bid...</p>
                  <p className="text-sm text-[#7a7a7a]">Please wait while we record your offer</p>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f0ece4] border-2 border-[#c9a96e] flex items-center justify-center">
                    <Gavel className="w-8 h-8 text-[#c9a96e]" />
                  </div>
                  <h4 className="text-2xl font-serif-display text-[#1a1a1a] mb-2 font-semibold">Bid Placed!</h4>
                  <p className="text-sm text-[#4a4a4a] mb-6">
                    {isDemo 
                      ? `Your demo bid of ₹${Number(bidAmount).toLocaleString()} was simulated.`
                      : `Your bid of ₹${Number(bidAmount).toLocaleString()} has been submitted.`
                    }
                    <br />
                    {isDemo 
                      ? 'Connect to Supabase to save real bids.'
                      : 'You will be notified via email once it is approved.'
                    }
                  </p>
                  <button
                    onClick={resetAndClose}
                    className="px-8 py-3 border-2 border-[#d0d0d0] text-[#4a4a4a] text-sm rounded-full hover:border-[#c9a96e] hover:text-[#c9a96e] transition-all font-sans-gallery font-medium"
                  >
                    Close
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