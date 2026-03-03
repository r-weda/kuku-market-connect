import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('M-Pesa callback received:', JSON.stringify(body, null, 2));

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

    // Replay protection: check if this callback was already processed
    const { data: existingCallback } = await supabase
      .from('mpesa_callbacks')
      .select('id')
      .eq('checkout_request_id', CheckoutRequestID)
      .maybeSingle();

    if (existingCallback) {
      console.warn(`Duplicate callback for CheckoutRequestID: ${CheckoutRequestID}. Ignoring.`);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Already processed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record callback for replay protection
    await supabase.from('mpesa_callbacks').insert({
      checkout_request_id: CheckoutRequestID,
      merchant_request_id: MerchantRequestID,
      result_code: ResultCode,
      raw_payload: body,
    });

    // Find matching pending orders with timestamp validation (within 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 600000).toISOString();
    const { data: matchingOrders, error: matchError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('mpesa_ref', CheckoutRequestID)
      .eq('status', 'pending')
      .gte('created_at', tenMinutesAgo);

    if (matchError) {
      console.error('Error looking up orders:', matchError);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!matchingOrders || matchingOrders.length === 0) {
      console.warn(`No matching pending orders found for CheckoutRequestID: ${CheckoutRequestID}. Ignoring.`);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (ResultCode === 0) {
      const metadata = CallbackMetadata?.Item || [];
      const getMetadataValue = (name: string) => metadata.find((i: any) => i.Name === name)?.Value;

      const mpesaRef = getMetadataValue('MpesaReceiptNumber');
      const amount = getMetadataValue('Amount');
      const phone = getMetadataValue('PhoneNumber');

      console.log(`Payment successful: ${mpesaRef}, Amount: ${amount}, Phone: ${phone}`);

      // Update all matching orders
      for (const order of matchingOrders) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            mpesa_ref: mpesaRef,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
          .eq('status', 'pending');

        if (updateError) {
          console.error(`Error updating order ${order.id}:`, updateError);
        }
      }
    } else {
      console.log(`Payment failed or cancelled: ${ResultDesc}`);
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('M-Pesa callback error:', error);
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
