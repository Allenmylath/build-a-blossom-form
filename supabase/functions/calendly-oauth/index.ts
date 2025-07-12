import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const calendlyClientId = Deno.env.get('CALENDLY_CLIENT_ID')!
const calendlyClientSecret = Deno.env.get('CALENDLY_CLIENT_SECRET')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, user_id, app_origin, code, state } = await req.json();

    console.log('Calendly OAuth request:', { action, user_id, app_origin, code: code ? 'present' : 'missing' });

    if (action === 'auth') {
      // Generate OAuth URL for Calendly
      const redirectUri = `${app_origin}/integrations`;
      const scope = 'default'; // Calendly uses 'default' scope for basic access
      const authUrl = `https://auth.calendly.com/oauth/authorize?` +
        `client_id=${calendlyClientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scope}&` +
        `state=${user_id}`;

      console.log('Generated Calendly auth URL:', authUrl);

      return new Response(
        JSON.stringify({ authUrl }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (action === 'callback') {
      if (!code) {
        throw new Error('No authorization code provided');
      }

      const redirectUri = `${app_origin}/integrations`;

      // Exchange code for access token
      const tokenResponse = await fetch('https://auth.calendly.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: calendlyClientId,
          client_secret: calendlyClientSecret,
          redirect_uri: redirectUri,
          code: code,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Token exchange successful');

      // Get user info from Calendly
      const userResponse = await fetch('https://api.calendly.com/users/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('User info fetch failed:', errorText);
        throw new Error(`Failed to fetch user info: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      console.log('User info fetched successfully');

      // Store the integration in the database
      const { error: insertError } = await supabase
        .from('calendar_integrations')
        .upsert({
          user_id: state,
          provider: 'calendly',
          access_token_encrypted: tokenData.access_token, // In production, encrypt this
          refresh_token_encrypted: tokenData.refresh_token || null,
          calendar_email: userData.resource.email,
          calendar_id: userData.resource.uri,
          expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
          is_active: true,
        }, {
          onConflict: 'user_id,provider',
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to store integration: ${insertError.message}`);
      }

      console.log('Calendly integration stored successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (action === 'disconnect') {
      // Deactivate the integration
      const { error: updateError } = await supabase
        .from('calendar_integrations')
        .update({ is_active: false })
        .eq('user_id', user_id)
        .eq('provider', 'calendly');

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Failed to disconnect integration: ${updateError.message}`);
      }

      console.log('Calendly integration disconnected successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('Calendly OAuth error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})