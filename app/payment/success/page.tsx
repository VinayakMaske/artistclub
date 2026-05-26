'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  
  const paymentId = searchParams.get('payment_id');
  const paymentRequestId = searchParams.get('payment_request_id');
  const paymentStatus = searchParams.get('payment_status');
  const artworkId = searchParams.get('artwork_id');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function recordPayment() {
      const pendingRaw = localStorage.getItem('pending_support');
      if (!pendingRaw) {
        setStatus('success');
        return;
      }

      const pending = JSON.parse(pendingRaw);

      try {
        const insertData: any = {
          artwork_id: pending.artwork_id || artworkId,
          amount: Number(pending.amount),
          display_name: pending.display_name,
          email: pending.email || null,
          is_anonymous: pending.is_anonymous || false,
          message: pending.message || null,
          avatar_url: pending.avatar_url || null,
          payment_status: paymentStatus === 'Credit' ? 'completed' : 'pending',
          payment_id: paymentId || `redirect_${Date.now()}`,
          badge: pending.badge || 'Bronze Patron',
          payment_request_id: paymentRequestId || null,
        };

        console.log('Inserting to Supabase:', insertData);

        const { data, error } = await supabase.from('supporters').insert(insertData).select();

        if (error) {
          console.error('Supabase error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          throw new Error(`${error.message} (code: ${error.code})`);
        }

        console.log('Payment recorded:', data);
        localStorage.removeItem('pending_support');
        setStatus('success');

      } catch (err: any) {
        console.error('Failed to record:', err);
        setErrorMsg(err.message || 'Failed to save payment');
        setStatus('failed');
      }
    }

    if (paymentStatus === 'Failed') {
      setStatus('failed');
      localStorage.removeItem('pending_support');
    } else {
      recordPayment();
    }
  }, [paymentStatus, paymentId, paymentRequestId, artworkId]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#c9a96e] mx-auto mb-4" />
          <p className="text-[#4a4a4a] font-sans-gallery">Recording your support...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-serif-display text-[#1a1a1a] mb-3">Recording Failed</h2>
          <p className="text-[#4a4a4a] mb-2 text-sm">{errorMsg}</p>
          <p className="text-[#7a7a7a] text-xs mb-4">But your payment was successful!</p>
          <Link href="/gallery" className="px-8 py-3 bg-[#1a1a1a] text-white rounded-full text-sm font-semibold hover:bg-[#c9a96e] transition-all inline-block mt-4">Back to Gallery</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md mx-auto px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f0ece4] border-2 border-[#c9a96e] flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-[#c9a96e]" />
        </div>
        <h2 className="text-3xl font-serif-display text-[#1a1a1a] mb-3 font-semibold">Thank You</h2>
        <p className="text-[#4a4a4a] mb-8">Your support has been recorded. The artist appreciates your patronage.</p>
        <div className="flex gap-4 justify-center">
          <Link href={artworkId ? `/artwork1/${artworkId}` : '/gallery'} className="px-8 py-3 bg-[#1a1a1a] text-white rounded-full text-sm font-semibold hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all">View Artwork</Link>
          <Link href="/gallery" className="px-8 py-3 border-2 border-[#d0d0d0] text-[#4a4a4a] rounded-full text-sm hover:border-[#c9a96e] hover:text-[#c9a96e] transition-all">Explore More</Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c9a96e]" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}