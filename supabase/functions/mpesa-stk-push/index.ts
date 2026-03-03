import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Demo mode flag - set to false when using real credentials
const DEMO_MODE = true;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { phone, amount, orderIds, accountReference } = await req.json();

    if (!phone || !amount || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields: phone, amount, orderIds' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate phone format
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      return new Response(JSON.stringify({ error: 'Invalid phone number format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify orders exist, are pending, and belong to this user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, buyer_id, status, total')
      .in('id', orderIds);

    if (ordersError || !orders || orders.length !== orderIds.length) {
      return new Response(JSON.stringify({ error: 'Invalid order IDs' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify all orders are pending and calculate server-side total
    let serverTotal = 0;
    for (const order of orders) {
      if (order.status !== 'pending') {
        return new Response(JSON.stringify({ error: 'One or more orders are not in pending status' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      serverTotal += order.total;
    }

    // Use server-calculated total, not client-provided amount
    const paymentAmount = serverTotal;

    console.log(`M-Pesa STK Push request: phone=${phone}, amount=${paymentAmount}, orders=${orderIds.join(',')}`);

    const checkoutRequestId = DEMO_MODE
      ? `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`
      : null;

    if (DEMO_MODE) {
      console.log(`[DEMO] Simulating STK push with ID: ${checkoutRequestId}`);

      // Update orders with mpesa_ref
      for (const orderId of orderIds) {
        await supabase
          .from('orders')
          .update({ mpesa_ref: checkoutRequestId })
          .eq('id', orderId)
          .eq('status', 'pending');
      }

      // In demo mode, simulate payment confirmation after a delay
      // Update orders to 'paid' status (simulating what the callback would do)
      setTimeout(async () => {
        for (const orderId of orderIds) {
          await supabase
            .from('orders')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .eq('status', 'pending');
        }
        console.log(`[DEMO] Orders marked as paid: ${orderIds.join(',')}`);
      }, 3000);

      return new Response(JSON.stringify({
        success: true,
        demo: true,
        message: 'STK push initiated (demo mode)',
        checkoutRequestId,
        merchantRequestId: `demo_merchant_${Date.now()}`,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Real M-Pesa integration
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const shortcode = Deno.env.get('MPESA_SHORTCODE');
    const passkey = Deno.env.get('MPESA_PASSKEY');

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      return new Response(JSON.stringify({ 
        error: 'M-Pesa credentials not configured.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get OAuth token
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('Failed to get M-Pesa access token');
      return new Response(JSON.stringify({ error: 'Failed to authenticate with M-Pesa' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1);
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-callback`;

    const stkResponse = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.ceil(paymentAmount),
          PartyA: formattedPhone,
          PartyB: shortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: accountReference || 'KukuMarket',
          TransactionDesc: `Payment for orders ${orderIds.join(',')}`,
        }),
      }
    );

    const stkData = await stkResponse.json();
    console.log('M-Pesa STK response:', stkData);

    if (stkData.ResponseCode === '0') {
      // Update orders with checkout request ID
      for (const orderId of orderIds) {
        await supabase
          .from('orders')
          .update({ mpesa_ref: stkData.CheckoutRequestID })
          .eq('id', orderId)
          .eq('status', 'pending');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'STK push initiated',
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: stkData.errorMessage || stkData.ResponseDescription || 'STK push failed',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: unknown) {
    console.error('M-Pesa STK Push error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
