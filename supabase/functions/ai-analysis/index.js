// AI Analysis Edge Function for Student Portfolio
// Analyzes file content to generate tags and summaries using OpenAI
// Deploy with: supabase functions deploy ai-analysis

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase admin client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const openaiKey = Deno.env.get('OPENAI_API_KEY') ?? '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}
if (!openaiKey) {
  console.warn('OPENAI_API_KEY not set; AI analysis will be limited');
}

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { fileId, fileType, fileName, textContent } = body;

  // Prepare analysis payload
  const contentToAnalyze = textContent?.trim() || `File: ${fileName || 'unknown'} (${fileType || 'unknown'})`;

  let tags = [];
  let summary = '';

  // If OpenAI key is configured, call the API
  if (openaiKey) {
    try {
      const prompt = `Analyze this file content and return JSON with keys: tags (array of 5–10 relevant keywords/phrases), summary (1–2 sentence summary, max 200 characters). File type: ${fileType}. Filename: ${fileName}. Content: ${contentToAnalyze.substring(0, 4000)}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that analyzes file content. Respond ONLY with valid JSON containing fields: tags (string[]), summary (string). Do not include markdown formatting.'
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          tags = parsed.tags || [];
          summary = parsed.summary || '';
        }
      } else {
        const err = await response.text();
        console.error('OpenAI API error:', response.status, err);
        // Fallback: very basic tags from filename
        tags = fileName?.split(/[_\s-]/).filter(w => w.length > 2).slice(0, 3) || [fileType];
        summary = `${fileName} uploaded`;
      }
    } catch (aiErr) {
      console.error('AI call failed:', aiErr);
      tags = [fileType, 'upload'];
      summary = 'File uploaded';
    }
  } else {
    // No OpenAI key: simple heuristic tags
    console.warn('No OpenAI API key; using basic filename tags');
    tags = fileName?.split(/[_\s-]/).filter(w => w.length > 2).slice(0, 3) || [fileType];
    summary = `File: ${fileName}`;
  }

  // Persist results to database
  if (fileId) {
    try {
      // Update file record if it has summary column; otherwise use file_summaries table
      // The schema uses separate tables: file_tags and file_summaries
      const tagInserts = tags.map(tag =>
        supabase.from('file_tags').insert({ file_id: fileId, tag, confidence: openaiKey ? 0.9 : 0.5 })
      );
      await Promise.all(tagInserts);

      if (summary && (fileType === 'text' || fileType === 'pdf' || fileType === 'doc' || fileType === 'docx')) {
        await supabase
          .from('file_summaries')
          .insert({ file_id: fileId, summary, language: 'en' });
      }
    } catch (dbErr) {
      console.error('Failed to persist AI results:', dbErr);
    }
  }

  // Return result to client
  const result = { tags, summary };
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
});
