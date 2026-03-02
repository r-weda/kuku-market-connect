import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('M-Pesa callback received:', JSON.stringify(body, null, 2));

    // Extract callback data
    const { Body } = body;
    if (!Body?.stkCallback) {
      return new Response(JSON.stringify({ error: 'Invalid callback format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { stkCallback } = Body;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    console.log(`Payment result: ${ResultCode} - ${ResultDesc}`);

    // Validate that we have a matching pending order with this CheckoutRequestID
    // The STK push function stores the CheckoutRequestID in mpesa_ref when initiating
    const { data: matchingOrder, error: matchError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('mpesa_ref', CheckoutRequestID)
      .eq('status', 'pending')
      .maybeSingle();

    if (matchError) {
      console.error('Error looking up order:', matchError);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!matchingOrder) {
      console.warn(`No matching pending order found for CheckoutRequestID: ${CheckoutRequestID}. Ignoring callback.`);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (ResultCode === 0) {
      // Payment successful - extract transaction details
      const metadata = CallbackMetadata?.Item || [];
      const getMetadataValue = (name: string) => metadata.find((i: any) => i.Name === name)?.Value;

      const mpesaRef = getMetadataValue('MpesaReceiptNumber');
      const amount = getMetadataValue('Amount');
      const phone = getMetadataValue('PhoneNumber');

      console.log(`Payment successful: ${mpesaRef}, Amount: ${amount}, Phone: ${phone}`);

      // Update the verified order with the real M-Pesa receipt number
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          mpesa_ref: mpesaRef,
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchingOrder.id)
        .eq('status', 'pending'); // Double-check status to prevent replay

      if (updateError) {
        console.error('Error updating order:', updateError);
      }
    } else {
      console.log(`Payment failed or cancelled: ${ResultDesc}`);
    }

    // Safaricom expects a simple acknowledgment
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('M-Pesa callback error:', error);
    // Don't leak error details externally
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
