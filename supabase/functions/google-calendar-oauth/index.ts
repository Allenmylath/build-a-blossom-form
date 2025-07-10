import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let action, userId, appOrigin;

    if (req.method === 'POST') {
      const body = await req.json();
      action = body.action;
      userId = body.user_id;
      appOrigin = body.app_origin;
    } else {
      action = url.searchParams.get('action');
      userId = url.searchParams.get('user_id');
    }

    if (action === 'auth') {
      // Generate OAuth URL
      if (!userId) {
        throw new Error('User ID is required');
      }

      const redirectUri = `${url.origin}/supabase/functions/v1/google-calendar-oauth?action=callback`;
      const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' ');

      const state = btoa(JSON.stringify({ userId, appOrigin }));
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', googleClientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', state);

      return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'callback') {
      // Handle OAuth callback
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code || !state) {
        throw new Error('Authorization code or state missing');
      }

      const { userId, appOrigin } = JSON.parse(atob(state));
      const redirectUri = `${url.origin}/supabase/functions/v1/google-calendar-oauth?action=callback`;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokens.error_description}`);
      }

      // Get user email from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const userInfo = await userInfoResponse.json();

      // Store encrypted tokens in database
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      const { error } = await supabase
        .from('calendar_integrations')
        .upsert({
          user_id: userId,
          provider: 'google',
          calendar_email: userInfo.email,
          access_token_encrypted: tokens.access_token, // In production, encrypt this
          refresh_token_encrypted: tokens.refresh_token, // In production, encrypt this
          expires_at: expiresAt,
          is_active: true,
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Redirect back to settings page with success
      // Use the app origin from the decoded state or a fallback
      const finalAppOrigin = appOrigin || 'https://modalformz.com'; // fallback
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${finalAppOrigin}/settings?calendar_connected=true`,
        },
      });

    } else if (action === 'disconnect') {
      // Handle disconnection
      const { user_id } = await req.json();

      const { error } = await supabase
        .from('calendar_integrations')
        .update({ is_active: false })
        .eq('user_id', user_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Google Calendar OAuth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});