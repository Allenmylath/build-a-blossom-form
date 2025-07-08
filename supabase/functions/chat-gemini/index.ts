
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, sessionId, formId, fieldId, conversationContext = [] } = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Processing message:', message.substring(0, 100) + '...')
    console.log('Session ID:', sessionId)
    console.log('Form ID:', formId)
    console.log('Field ID:', fieldId)

    // Build conversation history for Gemini API
    const conversationHistory = [
      {
        role: 'user',
        parts: [{ text: 'You are a helpful AI assistant integrated into a form. Please provide helpful and accurate responses to user questions.' }]
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I\'m here to help answer questions and assist users with their inquiries. How can I help you today?' }]
      }
    ]

    // Add previous conversation context if available
    if (conversationContext && conversationContext.length > 0) {
      conversationContext.forEach((msg: any) => {
        if (msg.role === 'user') {
          conversationHistory.push({
            role: 'user',
            parts: [{ text: msg.content }]
          })
        } else if (msg.role === 'assistant') {
          conversationHistory.push({
            role: 'model',  
            parts: [{ text: msg.content }]
          })
        }
      })
    }

    // Add current user message
    conversationHistory.push({
      role: 'user',
      parts: [{ text: message }]
    })

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: conversationHistory,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API Error:', geminiResponse.status, errorText)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response generated from Gemini API')
    }

    const responseText = geminiData.candidates[0].content.parts[0].text

    // Update conversation context
    const updatedContext = [
      ...conversationContext,
      { role: 'user', content: message },
      { role: 'assistant', content: responseText }
    ].slice(-10) // Keep last 10 messages for context

    console.log('Generated response:', responseText.substring(0, 100) + '...')

    return new Response(
      JSON.stringify({ 
        message: responseText,
        conversationContext: updatedContext,
        sessionId: sessionId
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
