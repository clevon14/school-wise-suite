import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const extractionPrompt = `You are analyzing a handwritten staff registration form from Holy Cross English Medium School. Extract all readable information and return it as a JSON object.

IMPORTANT RULES:
1. Return ONLY valid JSON, no additional text or markdown
2. Use null for fields that are blank, illegible, or not present
3. Parse dates in DD/MM/YYYY format and convert to YYYY-MM-DD format
4. For gender, use lowercase: "male", "female", or "other"
5. Clean up text: trim whitespace, fix obvious spelling if clear
6. For numbers (salary, leave days), return as numbers not strings

EXPECTED JSON STRUCTURE:
{
  "basic": {
    "employee_number": "string or null",
    "first_name": "string or null",
    "last_name": "string or null",
    "father_name": "string or null",
    "mother_name": "string or null",
    "email": "string or null",
    "gender": "male|female|other or null",
    "date_of_birth": "YYYY-MM-DD or null",
    "hire_date": "YYYY-MM-DD or null",
    "phone": "string or null",
    "emergency_contact_number": "string or null",
    "marital_status": "string or null",
    "role": "teacher|head_teacher|principal|vice_principal|counselor|admin or null",
    "designation": "senior|junior|assistant|head or null",
    "department": "string or null"
  },
  "address": {
    "current_address": "string or null",
    "permanent_address": "string or null"
  },
  "qualifications": {
    "qualification": "string or null",
    "work_experience": "string or null",
    "pan_number": "string or null",
    "note": "string or null"
  },
  "payroll": {
    "epf_number": "string or null",
    "basic_salary": "number or null",
    "contract_type": "permanent|temporary|contract|probation or null",
    "work_shift": "string or null",
    "work_location": "string or null"
  },
  "leaves": {
    "medical_leave": "number or null",
    "casual_leave": "number or null",
    "maternity_leave": "number or null",
    "sick_leave": "number or null"
  },
  "bank": {
    "account_title": "string or null",
    "account_number": "string or null",
    "bank_name": "string or null",
    "ifsc_code": "string or null",
    "branch_name": "string or null"
  },
  "confidence": {
    "overall": "high|medium|low",
    "notes": "string describing any issues with legibility"
  }
}

Analyze the handwritten form image and extract all visible information.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the Lovable AI Gateway with Gemini vision
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`,
                },
              },
              {
                type: "text",
                text: extractionPrompt,
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to process image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response, handling potential markdown code blocks
    let extractedData;
    try {
      let jsonContent = content.trim();
      // Remove markdown code blocks if present
      if (jsonContent.startsWith("```json")) {
        jsonContent = jsonContent.slice(7);
      } else if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.slice(3);
      }
      if (jsonContent.endsWith("```")) {
        jsonContent = jsonContent.slice(0, -3);
      }
      extractedData = JSON.parse(jsonContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse extracted data",
          raw_response: content 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Scan staff form error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
