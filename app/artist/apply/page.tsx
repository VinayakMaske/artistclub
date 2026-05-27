// src/app/artist/apply/page.tsx
'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, ArrowRight, CheckCircle, Upload, User, Mail,
  MapPin, FileText, Link as LinkIcon, Image as ImageIcon,
  X, Loader2, Paintbrush, Clock, Sparkles, Heart, Gavel
} from 'lucide-react';
import Link from 'next/link';
import MuseumNav from '@/components/MuseumNav';
import { createBrowserClient } from '@supabase/ssr';

type FormStatus = 'form' | 'submitting' | 'success';

export default function ArtistApplyPage() {
  const [status, setStatus] = useState<FormStatus>('form');
  const [formData, setFormData] = useState({
    // Artist Profile
    fullName: '',
    email: '',
    phone: '',
    city: 'Pune',
    bio: '',
    instagramHandle: '',
    portfolioUrl: '',
    // Artwork
    title: '',
    description: '',
    medium: '',
    dimensions: '',
    messageDelivers: '',
    techniqueNotes: '',
    materialsUsed: '',
    hoursInvested: '',
    inspirationStory: '',
    minimumBid: '', // ← NEW: Minimum bid amount
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [artworkPreview, setArtworkPreview] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (type: 'avatar' | 'artwork', file: File | null) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [type]: 'File must be under 5MB' }));
      return;
    }

    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, avatar: '' }));
    } else {
      setArtworkFile(file);
      setArtworkPreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, artwork: '' }));
    }
  };

  const uploadImage = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('artworks')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.bio.trim() || formData.bio.length < 50) newErrors.bio = 'Bio must be at least 50 characters';
    
    if (!formData.title.trim()) newErrors.title = 'Artwork title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.medium.trim()) newErrors.medium = 'Medium is required';
    if (!formData.messageDelivers.trim()) newErrors.messageDelivers = 'What this painting means is required';
    
    // Validate minimum bid
    if (!formData.minimumBid.trim()) {
      newErrors.minimumBid = 'Minimum bid amount is required';
    } else if (Number(formData.minimumBid) < 500) {
      newErrors.minimumBid = 'Minimum bid must be at least ₹500';
    }

    if (!avatarFile && !avatarPreview) newErrors.avatar = 'Profile photo is required';
    if (!artworkFile && !artworkPreview) newErrors.artwork = 'Artwork image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    setUploadProgress('Uploading images...');

    try {
      // Upload images
      const avatarUrl = avatarFile ? await uploadImage(avatarFile, 'avatars') : '';
      const artworkUrl = artworkFile ? await uploadImage(artworkFile, 'paintings') : '';

      setUploadProgress('Submitting application...');

      // Parse materials array
      const materialsArray = formData.materialsUsed
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0);

      // Insert into artist_applications
      const { error } = await supabase
        .from('artist_applications')
        .insert([{
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          city: formData.city,
          bio: formData.bio,
          avatar_url: avatarUrl,
          instagram_handle: formData.instagramHandle || null,
          portfolio_url: formData.portfolioUrl || null,
          
          title: formData.title,
          description: formData.description,
          medium: formData.medium,
          dimensions: formData.dimensions || null,
          image_url: artworkUrl,
          
          message_delivers: formData.messageDelivers,
          technique_notes: formData.techniqueNotes || null,
          materials_used: materialsArray.length > 0 ? materialsArray : null,
          hours_invested: formData.hoursInvested ? parseInt(formData.hoursInvested) : null,
          inspiration_story: formData.inspirationStory || null,
          
          // NEW: Save minimum bid to application (will be transferred to artworks when approved)
          minimum_bid: Number(formData.minimumBid),
          
          status: 'pending'
        }]);

      if (error) throw error;

      setStatus('success');
    } catch (err) {
      console.error('Submit error:', err);
      setErrors(prev => ({ ...prev, submit: 'Failed to submit. Please try again.' }));
      setStatus('form');
    }
  };

  const inputClasses = (field: string, hasIcon = false) => `
    w-full ${hasIcon ? 'pl-11' : 'px-4'} pr-4 py-3 bg-white border rounded-lg 
    text-[#1a1a1a] text-sm placeholder:text-[#7a7a7a]/60 
    focus:border-[#c9a96e] focus:outline-none transition-colors
    ${errors[field] ? 'border-red-400' : 'border-[#d0d0d0]'}
  `;

  const labelClasses = "text-[10px] text-[#7a7a7a] tracking-[0.2em] uppercase font-sans-gallery block mb-2 font-semibold";

  if (status === 'submitting') {
    return (
      <main className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <MuseumNav />
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#c9a96e] mx-auto mb-4" />
          <p className="text-lg font-serif-display text-[#1a1a1a]">{uploadProgress}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#1a1a1a]">
      <MuseumNav />
      
      <section className="pt-28 md:pt-32 pb-20">
        <div className="max-w-[720px] mx-auto px-6">
          <AnimatePresence mode="wait">
            {status === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Header */}
                <div className="text-center mb-10">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-[#c9a96e]/30 flex items-center justify-center bg-white">
                    <Palette className="w-6 h-6 text-[#c9a96e]" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-serif-display text-[#1a1a1a] mb-2">
                    Participate Next Month
                  </h1>
                  <p className="text-sm text-[#4a4a4a] leading-relaxed font-light">
                    One form. Your story. Your art. We handle the rest.
                  </p>
                </div>

                {errors.submit && (
                  <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {errors.submit}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* === ARTIST PROFILE SECTION === */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-px w-8 bg-[#c9a96e]" />
                      <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                        About You
                      </span>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className={labelClasses}>Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a]" />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleChange('fullName', e.target.value)}
                          placeholder="Your full name"
                          className={inputClasses('fullName', true)}
                        />
                      </div>
                      {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                    </div>

                    {/* Email & Phone */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a]" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="your@email.com"
                            className={inputClasses('email', true)}
                          />
                        </div>
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className={labelClasses}>Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="+91 98765 43210"
                          className={inputClasses('phone')}
                        />
                      </div>
                    </div>

                    {/* City */}
                    <div>
                      <label className={labelClasses}>City *</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a]" />
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleChange('city', e.target.value)}
                          placeholder="Pune, Mumbai, Delhi..."
                          className={inputClasses('city', true)}
                        />
                      </div>
                      {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                    </div>

                    {/* Bio */}
                    <div>
                      <label className={labelClasses}>Artist Bio * (min 50 characters)</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-3.5 w-4 h-4 text-[#7a7a7a]" />
                        <textarea
                          value={formData.bio}
                          onChange={(e) => handleChange('bio', e.target.value)}
                          placeholder="Tell us about yourself, your journey, your artistic philosophy..."
                          rows={4}
                          className={`${inputClasses('bio', true)} resize-none`}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        {errors.bio && <p className="text-xs text-red-500">{errors.bio}</p>}
                        <p className="text-xs text-[#7a7a7a] ml-auto font-sans-gallery">{formData.bio.length} chars</p>
                      </div>
                    </div>

                    {/* Instagram & Portfolio */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>Instagram Handle</label>
                        <input
                          type="text"
                          value={formData.instagramHandle}
                          onChange={(e) => handleChange('instagramHandle', e.target.value)}
                          placeholder="@yourhandle"
                          className={inputClasses('instagramHandle')}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Portfolio URL</label>
                        <div className="relative">
                          <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a]" />
                          <input
                            type="url"
                            value={formData.portfolioUrl}
                            onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                            placeholder="https://yourportfolio.com"
                            className={inputClasses('portfolioUrl', true)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Profile Photo Upload */}
                    <div>
                      <label className={labelClasses}>Profile Photo *</label>
                      <div 
                        onClick={() => avatarInputRef.current?.click()}
                        className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                          errors.avatar ? 'border-red-400 bg-red-50' : 'border-[#d0d0d0] hover:border-[#c9a96e] bg-white'
                        }`}
                      >
                        {avatarPreview ? (
                          <div className="relative inline-block">
                            <img src={avatarPreview} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover mx-auto" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setAvatarFile(null); setAvatarPreview(''); }}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-[#c9a96e] mx-auto mb-2" />
                            <p className="text-sm text-[#4a4a4a]">Click to upload profile photo</p>
                            <p className="text-xs text-[#7a7a7a] mt-1">JPG, PNG — Max 5MB</p>
                          </>
                        )}
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect('avatar', e.target.files?.[0] || null)}
                        />
                      </div>
                      {errors.avatar && <p className="text-xs text-red-500 mt-1">{errors.avatar}</p>}
                    </div>
                  </div>

                  {/* === ARTWORK SECTION === */}
                  <div className="space-y-5 pt-4 border-t border-[#d0d0d0]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-px w-8 bg-[#c9a96e]" />
                      <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                        Your Artwork
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <label className={labelClasses}>Artwork Title *</label>
                      <div className="relative">
                        <Paintbrush className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a]" />
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                          placeholder="What is this piece called?"
                          className={inputClasses('title', true)}
                        />
                      </div>
                      {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                      <label className={labelClasses}>Description *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Describe your artwork — the concept, the emotion, what inspired it..."
                        rows={3}
                        className={`${inputClasses('description')} resize-none`}
                      />
                      {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                    </div>

                    {/* Medium & Dimensions */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>Medium *</label>
                        <input
                          type="text"
                          value={formData.medium}
                          onChange={(e) => handleChange('medium', e.target.value)}
                          placeholder="Acrylic on Canvas, Oil, Mixed Media..."
                          className={inputClasses('medium')}
                        />
                        {errors.medium && <p className="text-xs text-red-500 mt-1">{errors.medium}</p>}
                      </div>
                      <div>
                        <label className={labelClasses}>Dimensions</label>
                        <input
                          type="text"
                          value={formData.dimensions}
                          onChange={(e) => handleChange('dimensions', e.target.value)}
                          placeholder="24 x 36 inches"
                          className={inputClasses('dimensions')}
                        />
                      </div>
                    </div>

                    {/* Hours Invested */}
                    <div>
                      <label className={labelClasses}>Hours Invested</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a]" />
                        <input
                          type="number"
                          value={formData.hoursInvested}
                          onChange={(e) => handleChange('hoursInvested', e.target.value)}
                          placeholder="How many hours did this take?"
                          className={inputClasses('hoursInvested', true)}
                        />
                      </div>
                    </div>

                    {/* === NEW: Minimum Bid Amount === */}
                    <div>
                      <label className={labelClasses}>Minimum Bid Amount *</label>
                      <div className="relative">
                        <Gavel className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a96e]" />
                        <div className="relative">
                          <span className="absolute left-11 top-1/2 -translate-y-1/2 text-[#1a1a1a] font-semibold text-sm">₹</span>
                          <input
                            type="number"
                            value={formData.minimumBid}
                            onChange={(e) => handleChange('minimumBid', e.target.value)}
                            placeholder="5000"
                            min="500"
                            className={`${inputClasses('minimumBid', true)} pl-14`}
                          />
                        </div>
                      </div>
                      {errors.minimumBid && <p className="text-xs text-red-500 mt-1">{errors.minimumBid}</p>}
                      <p className="text-xs text-[#7a7a7a] mt-1 font-sans-gallery">
                        Minimum ₹500. This is the starting bid buyers will see.
                      </p>
                    </div>

                    {/* Artwork Image Upload */}
                    <div>
                      <label className={labelClasses}>Artwork Image *</label>
                      <div 
                        onClick={() => artworkInputRef.current?.click()}
                        className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                          errors.artwork ? 'border-red-400 bg-red-50' : 'border-[#d0d0d0] hover:border-[#c9a96e] bg-white'
                        }`}
                      >
                        {artworkPreview ? (
                          <div className="relative inline-block">
                            <img src={artworkPreview} alt="Artwork preview" className="max-h-64 rounded-lg mx-auto object-contain" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setArtworkFile(null); setArtworkPreview(''); }}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-[#c9a96e] mx-auto mb-2" />
                            <p className="text-sm text-[#4a4a4a]">Click to upload artwork image</p>
                            <p className="text-xs text-[#7a7a7a] mt-1">JPG, PNG — Max 5MB</p>
                          </>
                        )}
                        <input
                          ref={artworkInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect('artwork', e.target.files?.[0] || null)}
                        />
                      </div>
                      {errors.artwork && <p className="text-xs text-red-500 mt-1">{errors.artwork}</p>}
                    </div>
                  </div>

                  {/* === DEEP DETAILS SECTION === */}
                  <div className="space-y-5 pt-4 border-t border-[#d0d0d0]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-px w-8 bg-[#c9a96e]" />
                      <span className="text-[10px] text-[#c9a96e] tracking-[0.3em] uppercase font-sans-gallery font-semibold">
                        The Story Behind
                      </span>
                    </div>

                    {/* What This Painting Means */}
                    <div>
                      <label className={labelClasses}>What This Artwork Means *</label>
                      <div className="relative">
                        <Heart className="absolute left-4 top-3.5 w-4 h-4 text-[#7a7a7a]" />
                        <textarea
                          value={formData.messageDelivers}
                          onChange={(e) => handleChange('messageDelivers', e.target.value)}
                          placeholder="What emotion or message does this piece convey? What should the viewer feel?"
                          rows={3}
                          className={`${inputClasses('messageDelivers', true)} resize-none`}
                        />
                      </div>
                      {errors.messageDelivers && <p className="text-xs text-red-500 mt-1">{errors.messageDelivers}</p>}
                    </div>

                    {/* Technique Notes */}
                    <div>
                      <label className={labelClasses}>Technique & Process</label>
                      <textarea
                        value={formData.techniqueNotes}
                        onChange={(e) => handleChange('techniqueNotes', e.target.value)}
                        placeholder="Describe your technique — layers, materials, unique methods used..."
                        rows={3}
                        className={`${inputClasses('techniqueNotes')} resize-none`}
                      />
                    </div>

                    {/* Materials Used */}
                    <div>
                      <label className={labelClasses}>Materials Used</label>
                      <input
                        type="text"
                        value={formData.materialsUsed}
                        onChange={(e) => handleChange('materialsUsed', e.target.value)}
                        placeholder="Acrylic paint, Canvas, Gold leaf, Gel medium... (comma separated)"
                        className={inputClasses('materialsUsed')}
                      />
                      <p className="text-xs text-[#7a7a7a] mt-1">Separate with commas</p>
                    </div>

                    {/* Inspiration Story */}
                    <div>
                      <label className={labelClasses}>Inspiration Story</label>
                      <div className="relative">
                        <Sparkles className="absolute left-4 top-3.5 w-4 h-4 text-[#7a7a7a]" />
                        <textarea
                          value={formData.inspirationStory}
                          onChange={(e) => handleChange('inspirationStory', e.target.value)}
                          placeholder="What inspired this piece? A memory, a place, a person, a moment?"
                          rows={3}
                          className={`${inputClasses('inspirationStory', true)} resize-none`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-4 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-black/20"
                    >
                      Submit Application
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-center text-xs text-[#7a7a7a] font-sans-gallery mt-4">
                      By submitting, you agree that your application will be reviewed before going live.
                      For any queries contact us on supportartistclub@gmail.com
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-[#c9a96e]/20 to-[#c9a96e]/5 border border-[#c9a96e]/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-[#c9a96e]" />
                </div>
                <h2 className="text-3xl font-serif-display text-[#1a1a1a] mb-4 font-light">
                  Application Received
                </h2>
                <p className="text-[#4a4a4a] leading-relaxed max-w-md mx-auto mb-8">
                  Thank you for your submission. Our team will review your application and artwork. 
                  If approved, your piece will be featured in next month's exhibition.
                </p>
                <div className="p-5 rounded-lg bg-[#f0ece4] border border-[#c9a96e]/15 mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#c9a96e] animate-pulse" />
                    <span className="text-sm text-[#c9a96e] font-sans-gallery font-semibold">Under Review</span>
                  </div>
                  <p className="text-sm text-[#4a4a4a] leading-relaxed font-light">
                    You'll hear from us within <span className="text-[#1a1a1a] font-medium">24-48 hours</span>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/gallery"
                    className="px-8 py-3 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 font-sans-gallery"
                  >
                    View Current Exhibition
                  </Link>
                  <Link
                    href="/"
                    className="px-8 py-3 border border-[#d0d0d0] text-[#7a7a7a] text-sm rounded-full hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all font-sans-gallery"
                  >
                    Return Home
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}