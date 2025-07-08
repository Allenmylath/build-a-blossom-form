
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, formId, fieldId, conversationContext = [] } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API configuration for this form
    const { data: apiConfig, error: configError } = await supabase
      .from('chat_api_configs')
      .select('*')
      .eq('form_id', formId)
      .eq('is_active', true)
      .single();

    let geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    let modelName = 'gemini-1.5-flash';
    let systemPrompt = 'You are a helpful assistant that responds to user questions in a friendly and informative way.';
    let maxTokens = 1000;
    let temperature = 0.7;

    // Use custom config if available
    if (apiConfig && !configError) {
      // In production, you'd decrypt the API key here
      // For now, we'll use the environment variable
      modelName = apiConfig.model_name || modelName;
      systemPrompt = apiConfig.system_prompt || systemPrompt;
      maxTokens = apiConfig.max_tokens || maxTokens;
      temperature = apiConfig.temperature || temperature;
    }

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Prepare conversation context for Gemini
    const messages = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      ...conversationContext.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const startTime = Date.now();

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I couldn\'t generate a response.';

    // Update conversation context
    const updatedContext = [
      ...conversationContext,
      { role: 'user', content: message },
      { role: 'model', content: generatedText }
    ];

    // Update session with new context
    await supabase
      .from('chat_sessions')
      .update({
        conversation_context: updatedContext,
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId);

    return new Response(JSON.stringify({ 
      message: generatedText,
      conversationContext: updatedContext,
      responseTime: responseTime,
      tokenUsage: data.usageMetadata || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-gemini function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Sorry, I encountered an error while processing your request. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
