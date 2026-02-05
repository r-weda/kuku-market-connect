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
 
     if (ResultCode === 0) {
       // Payment successful - extract transaction details
       const metadata = CallbackMetadata?.Item || [];
       const getMetadataValue = (name: string) => metadata.find((i: any) => i.Name === name)?.Value;
 
       const mpesaRef = getMetadataValue('MpesaReceiptNumber');
       const amount = getMetadataValue('Amount');
       const phone = getMetadataValue('PhoneNumber');
       const transactionDate = getMetadataValue('TransactionDate');
 
       console.log(`Payment successful: ${mpesaRef}, Amount: ${amount}, Phone: ${phone}`);
 
       // Update order with payment confirmation
       // Note: In production, you'd store the CheckoutRequestID with the order
       // and use it to match the callback to the correct order
       const { error: updateError } = await supabase
         .from('orders')
         .update({
           status: 'paid',
           mpesa_ref: mpesaRef,
           updated_at: new Date().toISOString(),
         })
         .eq('mpesa_ref', CheckoutRequestID); // Temporarily stored checkout request ID
 
       if (updateError) {
         console.error('Error updating order:', updateError);
       }
     } else {
       console.log(`Payment failed or cancelled: ${ResultDesc}`);
       // Optionally update order status to failed
     }
 
     // Safaricom expects a simple acknowledgment
     return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
       status: 200,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   } catch (error: unknown) {
     console.error('M-Pesa callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
       status: 500,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   }
 });