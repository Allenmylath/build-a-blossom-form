import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateEventRequest {
  formId: string;
  fieldId: string;
  date: string;
  time: string;
  duration: number;
  title?: string;
  description?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  ownerId?: string; // For shared forms
  userInfo?: {
    name: string;
    email: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: CreateEventRequest = await req.json();
    const { formId, fieldId, date, time, duration, title, description, attendeeEmail, attendeeName, ownerId, userInfo } = requestData;

    let user = null;
    let targetUserId = ownerId; // For shared forms, use form owner

    // If no ownerId, this is an authenticated user booking
    if (!ownerId) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Verify the user's session
      const { data: userData, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !userData.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      user = userData.user;
      targetUserId = user.id;
    }

    console.log('Creating calendar event for target user:', targetUserId, 'data:', requestData);

    // Get the calendar integration (either user's or form owner's)
    const { data: integration, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (integrationError || !integration) {
      console.error('Calendar integration not found:', integrationError);
      return new Response(JSON.stringify({ error: 'Calendar integration not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get form details for event context
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('name, description, user_id')
      .eq('id', formId)
      .maybeSingle();

    if (formError || !form) {
      console.error('Form not found:', formError);
      return new Response(JSON.stringify({ error: 'Form not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Verify the calendar integration belongs to the form owner
    if (ownerId && form.user_id !== targetUserId) {
      return new Response(JSON.stringify({ error: 'Invalid form owner' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create the event datetime strings
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 1000));

    // Prepare the calendar event
    const eventData = {
      summary: title || `Appointment - ${form.name}`,
      description: description || `Appointment booked through ${form.name}${form.description ? `\n\n${form.description}` : ''}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: (attendeeEmail || userInfo?.email) ? [
        {
          email: attendeeEmail || userInfo?.email,
          displayName: attendeeName || userInfo?.name || attendeeEmail || userInfo?.email,
          responseStatus: 'needsAction'
        }
      ] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
      status: 'confirmed',
    };

    console.log('Event data prepared:', eventData);

    // Check if we have a valid access token
    if (!integration.access_token_encrypted) {
      return new Response(JSON.stringify({ error: 'No valid access token found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if token is expired and refresh if needed
    let accessToken = integration.access_token_encrypted;
    const now = new Date();
    const expiresAt = new Date(integration.expires_at);
    
    if (expiresAt <= now) {
      console.log('Access token expired, attempting to refresh...');
      
      if (!integration.refresh_token_encrypted) {
        return new Response(JSON.stringify({ 
          error: 'Access token expired and no refresh token available. Please reconnect your calendar.' 
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          refresh_token: integration.refresh_token_encrypted,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        const refreshError = await refreshResponse.text();
        console.error('Token refresh failed:', refreshError);
        return new Response(JSON.stringify({ 
          error: 'Failed to refresh access token. Please reconnect your calendar.' 
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      
      // Update the integration with new token and expiry
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);
      
      const { error: updateError } = await supabase
        .from('calendar_integrations')
        .update({
          access_token_encrypted: accessToken,
          expires_at: newExpiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', integration.id);

      if (updateError) {
        console.error('Failed to update access token:', updateError);
        // Continue anyway with the new token
      }

      console.log('Token refreshed successfully');
    }

    // Create the calendar event using Google Calendar API
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${integration.calendar_id || 'primary'}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Google Calendar API error:', calendarResponse.status, errorText);
      
      // If token is expired, we should refresh it
      if (calendarResponse.status === 401) {
        return new Response(JSON.stringify({ 
          error: 'Calendar access token expired. Please reconnect your calendar.' 
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Failed to create calendar event',
        details: errorText 
      }), {
        status: calendarResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const calendarEvent = await calendarResponse.json();
    console.log('Calendar event created successfully:', calendarEvent.id);

    // Store the appointment in our database for tracking
    const { data: appointment, error: appointmentError } = await supabase
      .from('form_submissions')
      .insert({
        form_id: formId,
        user_id: user?.id || null, // Null for shared form submissions
        submission_type: 'appointment',
        data: {
          fieldId,
          date,
          time,
          duration,
          calendarEventId: calendarEvent.id,
          calendarEventLink: calendarEvent.htmlLink,
          attendeeEmail: attendeeEmail || userInfo?.email,
          attendeeName: attendeeName || userInfo?.name,
          title: eventData.summary,
          description: eventData.description,
          sharedForm: !!ownerId,
          formOwnerId: ownerId || targetUserId,
        },
        metadata: {
          appointmentType: 'calendar_event',
          calendarProvider: 'google',
          calendarIntegrationId: integration.id,
          bookedBySharedForm: !!ownerId,
        }
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('Failed to save appointment to database:', appointmentError);
      // Event was created but we couldn't save it to DB - still return success
    }

    return new Response(JSON.stringify({
      success: true,
      event: {
        id: calendarEvent.id,
        htmlLink: calendarEvent.htmlLink,
        summary: calendarEvent.summary,
        start: calendarEvent.start,
        end: calendarEvent.end,
        attendees: calendarEvent.attendees,
      },
      appointment: appointment || null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in create-calendar-event function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);