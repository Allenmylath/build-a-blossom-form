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
      const redirectUri = 'https://modformz.com/integrations';
      const scope = 'default'; // Calendly uses 'default' scope for basic access
      const authUrl = `https://auth.calendly.com/oauth/authorize?` +
        `client_id=${calendlyClientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scope}&` +
        `state=${user_id}`;

      console.log('Generated Calendly auth URL:', authUrl);
      console.log('Redirect URI being used:', redirectUri);

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

      const redirectUri = 'https://modformz.com/integrations';

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
        .from('calendly_integrations')
        .upsert({
          user_id: state,
          access_token_encrypted: tokenData.access_token, // In production, encrypt this
          refresh_token_encrypted: tokenData.refresh_token || null,
          calendly_email: userData.resource.email,
          calendly_user_uri: userData.resource.uri,
          organization_uri: userData.resource.current_organization,
          expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
          is_active: true,
        }, {
          onConflict: 'user_id',
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
        .from('calendly_integrations')
        .update({ is_active: false })
        .eq('user_id', user_id);

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

    if (action === 'check_status') {
      // Check if user has an active Calendly integration
      const { data: integration, error: queryError } = await supabase
        .from('calendly_integrations')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active', true)
        .maybeSingle();

      if (queryError) {
        console.error('Database query error:', queryError);
        throw new Error(`Failed to check integration status: ${queryError.message}`);
      }

      if (integration) {
        console.log('Found active Calendly integration for user:', user_id);
        return new Response(
          JSON.stringify({ 
            connected: true,
            email: integration.calendly_email,
            user_uri: integration.calendly_user_uri 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        console.log('No active Calendly integration found for user:', user_id);
        return new Response(
          JSON.stringify({ connected: false }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
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