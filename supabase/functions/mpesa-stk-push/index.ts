 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 // Demo mode flag - set to false when using real credentials
 const DEMO_MODE = true;
 
 serve(async (req) => {
   // Handle CORS preflight
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
 
     const { phone, amount, orderId, accountReference } = await req.json();
 
     if (!phone || !amount) {
       return new Response(JSON.stringify({ error: 'Missing required fields: phone, amount' }), {
         status: 400,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
 
     console.log(`M-Pesa STK Push request: phone=${phone}, amount=${amount}, orderId=${orderId}`);
 
     if (DEMO_MODE) {
       // Demo mode: simulate successful STK push
       const checkoutRequestId = `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
       
       console.log(`[DEMO] Simulating STK push with ID: ${checkoutRequestId}`);
       
       // Simulate a 3-second delay for the "payment processing"
       // In real mode, the callback would update this
       
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
 
     // Real M-Pesa integration (requires secrets)
     const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
     const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
     const shortcode = Deno.env.get('MPESA_SHORTCODE');
     const passkey = Deno.env.get('MPESA_PASSKEY');
 
     if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
       return new Response(JSON.stringify({ 
         error: 'M-Pesa credentials not configured. Please add MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, and MPESA_PASSKEY secrets.' 
       }), {
         status: 500,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
 
     // Get OAuth token from Safaricom
     const auth = btoa(`${consumerKey}:${consumerSecret}`);
     const tokenResponse = await fetch(
       'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
       {
         headers: { Authorization: `Basic ${auth}` },
       }
     );
 
     const tokenData = await tokenResponse.json();
     if (!tokenData.access_token) {
       console.error('Failed to get M-Pesa access token:', tokenData);
       return new Response(JSON.stringify({ error: 'Failed to authenticate with M-Pesa' }), {
         status: 500,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
 
     // Generate timestamp and password
     const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
     const password = btoa(`${shortcode}${passkey}${timestamp}`);
 
     // Format phone number (remove leading 0 or +254)
     let formattedPhone = phone.replace(/\s+/g, '');
     if (formattedPhone.startsWith('0')) {
       formattedPhone = '254' + formattedPhone.slice(1);
     } else if (formattedPhone.startsWith('+')) {
       formattedPhone = formattedPhone.slice(1);
     }
 
     // Initiate STK Push
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
           Amount: Math.ceil(amount),
           PartyA: formattedPhone,
           PartyB: shortcode,
           PhoneNumber: formattedPhone,
           CallBackURL: callbackUrl,
           AccountReference: accountReference || 'KukuMarket',
           TransactionDesc: `Payment for order ${orderId}`,
         }),
       }
     );
 
     const stkData = await stkResponse.json();
     console.log('M-Pesa STK response:', stkData);
 
     if (stkData.ResponseCode === '0') {
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
       status: 500,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   }
 });