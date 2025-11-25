import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AbsenceNotificationRequest {
  studentId: string;
  date: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY FIX: Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with anon key for auth check
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify user has teacher or admin role
    const supabaseServiceRole = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userRole, error: roleError } = await supabaseServiceRole
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "teacher"])
      .single();

    if (roleError || !userRole) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. Only teachers and admins can send SMS notifications." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { studentId, date, status }: AbsenceNotificationRequest = await req.json();

    // Get student and parent info
    const { data: student, error: studentError } = await supabaseServiceRole
      .from("students")
      .select("first_name, last_name, parent_name, parent_phone, class_id")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      throw new Error("Student not found");
    }

    // Verify teacher has access to this student's class (unless admin)
    if (userRole.role === "teacher") {
      const { data: employee } = await supabaseServiceRole
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (employee) {
        const { data: classAccess } = await supabaseServiceRole
          .from("class_subjects")
          .select("id")
          .eq("teacher_id", employee.id)
          .eq("class_id", student.class_id)
          .single();

        if (!classAccess) {
          return new Response(
            JSON.stringify({ error: "You do not have access to this student's class" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
      }
    }

    if (!student.parent_phone) {
      console.log("No parent phone number available");
      return new Response(
        JSON.stringify({ message: "No parent phone number available" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Only send SMS for absent status
    if (status !== "absent") {
      return new Response(
        JSON.stringify({ message: "SMS only sent for absent status" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Twilio credentials
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    // Format message
    const message = `Dear ${student.parent_name || "Parent"},\n\nYour child ${student.first_name} ${student.last_name} was marked absent on ${date}.\n\nPlease contact the school if you have any questions.\n\nRegards,\nSchool Administration`;

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: student.parent_phone,
        From: twilioPhoneNumber,
        Body: message,
      }),
    });

    if (!twilioResponse.ok) {
      const error = await twilioResponse.text();
      throw new Error(`Twilio error: ${error}`);
    }

    const result = await twilioResponse.json();

    console.log("SMS sent successfully:", result.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: result.sid,
        message: "SMS notification sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-absence-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
