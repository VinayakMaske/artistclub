'use client';

import { useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Upload, Loader2, ImageIcon, X } from 'lucide-react';

export default function HeroAdminPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    
    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    // Show preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `hero_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('hero-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hero-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      alert('Image uploaded successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + err.message);
      setPreview('');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!imageUrl) {
      alert('Please upload or enter an image URL');
      return;
    }

    setLoading(true);
    
    try {
      // Deactivate current
      await supabase.from('featured_hero').update({ is_active: false }).eq('is_active', true);
      
      // Insert new
      const { error } = await supabase.from('featured_hero').insert({
        title: title || 'Where art finds its true audience.',
        image_url: imageUrl,
        artist_name: artistName || 'Featured Artist',
        is_active: true,
      });

      if (error) throw error;
      
      alert('Featured image updated successfully!');
      // Clear form
      setImageUrl('');
      setTitle('');
      setArtistName('');
      setPreview('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f2] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-serif-display text-[#1a1a1a] mb-2">Update Hero Image</h1>
        <p className="text-sm text-[#7a7a7a] mb-8">Change the featured image on the landing page</p>

        {/* Image Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Hero Image</label>
          
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border border-[#d0d0d0]">
              <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
              <button
                onClick={() => { setPreview(''); setImageUrl(''); }}
                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-[#d0d0d0] rounded-xl p-8 text-center hover:border-[#c9a96e] transition-colors bg-white"
            >
              <ImageIcon className="w-10 h-10 text-[#c9a96e] mx-auto mb-3" />
              <p className="text-sm text-[#4a4a4a] font-medium">Click to upload image</p>
              <p className="text-xs text-[#7a7a7a] mt-1">JPG, PNG — Max 5MB</p>
              
              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[#c9a96e]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />
        </div>

        {/* Or enter URL manually */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Or Image URL</label>
          <input 
            type="url" 
            value={imageUrl} 
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 bg-white border border-[#d0d0d0] rounded-xl text-sm focus:border-[#c9a96e] focus:outline-none"
          />
        </div>

        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Where art finds its true audience."
            className="w-full px-4 py-3 bg-white border border-[#d0d0d0] rounded-xl text-sm focus:border-[#c9a96e] focus:outline-none"
          />
        </div>

        {/* Artist Name */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Artist Name</label>
          <input 
            type="text" 
            value={artistName} 
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Featured Artist"
            className="w-full px-4 py-3 bg-white border border-[#d0d0d0] rounded-xl text-sm focus:border-[#c9a96e] focus:outline-none"
          />
        </div>

        {/* Update Button */}
        <button 
          onClick={handleUpdate}
          disabled={loading || !imageUrl}
          className="w-full py-4 bg-[#1a1a1a] text-white font-semibold text-sm rounded-full hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Update Hero Image
            </>
          )}
        </button>
      </div>
    </div>
  );
}