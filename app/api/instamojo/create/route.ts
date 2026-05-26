import { NextResponse } from 'next/server';

const BASE_URL = process.env.INSTAMOJO_BASE_URL || 'https://www.instamojo.com/api/1.1';
const API_KEY = process.env.INSTAMOJO_API_KEY!;
const AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, buyer_name, email, phone, purpose, artwork_id, tier_amount } = body;

    if (!amount || !buyer_name || !email || !purpose || !artwork_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const formData = new URLSearchParams();
    formData.append('amount', amount.toString());
    formData.append('purpose', purpose.slice(0, 30));
    formData.append('buyer_name', buyer_name.slice(0, 100));
    formData.append('email', email.slice(0, 75));
    if (phone) formData.append('phone', phone);
    formData.append('send_email', 'false');
    formData.append('send_sms', 'false');
    formData.append('allow_repeated_payments', 'true');
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${appUrl}/payment/success?artwork_id=${artwork_id}&tier=${tier_amount}`;
    formData.append('redirect_url', redirectUrl);

    // CORRECT: Instamojo v1.1 uses X-Api-Key and X-Auth-Token headers
    const response = await fetch(`${BASE_URL}/payment-requests/`, {
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY,
        'X-Auth-Token': AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    console.log('Instamojo response status:', response.status);
    console.log('Instamojo response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      const errorMessage = data.message || data.detail || data.raw || `HTTP ${response.status}`;
      return NextResponse.json(
        { error: `Instamojo error: ${errorMessage}` },
        { status: 500 }
      );
    }

    if (!data.payment_request || !data.payment_request.longurl) {
      return NextResponse.json(
        { error: 'Invalid response from Instamojo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment_request_id: data.payment_request.id,
      longurl: data.payment_request.longurl,
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message || 'Unknown'}` },
      { status: 500 }
    );
  }
}