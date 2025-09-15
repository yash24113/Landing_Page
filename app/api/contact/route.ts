import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { env } from "@/lib/env"

// Form validation schema
const contactFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  businessType: z.string().min(1, "Business type is required"),
  annualVolume: z.string().optional(),
  primaryMarkets: z.string().optional(),
  fabricTypes: z.array(z.string()).min(1, "At least one fabric type is required"),
  specifications: z.string().optional(),
  timeline: z.string().optional(),
  message: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate form data
    const validatedData = contactFormSchema.parse(body)

    // Rate limiting check (implement with Upstash Redis in production)
    const clientIP = request.headers.get("x-forwarded-for") || "unknown"

    // Send email notification
    await sendEmailNotification(validatedData)

    // Save to database (if configured)
    if (env.DATABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL) {
      await saveToDatabase(validatedData)
    }

    // Send to CRM (if configured)
    await sendToCRM(validatedData)

    // Send webhook (if configured)
    if (process.env.FORM_WEBHOOK_URL) {
      await sendWebhook(validatedData)
    }

    return NextResponse.json({
      success: true,
      message: "Quote request submitted successfully",
    })
  } catch (error) {
    console.error("Contact form error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

async function sendEmailNotification(data: any) {
  // Implement email sending based on your chosen service
  if (env.RESEND_API_KEY) {
    // Use Resend
    const { Resend } = await import("resend")
    const resend = new Resend(env.RESEND_API_KEY)

    await resend.emails.send({
      from: "noreply@fabricpro.com",
      to: env.NEXT_PUBLIC_COMPANY_EMAIL!,
      subject: `New Quote Request from ${data.companyName}`,
      html: generateEmailTemplate(data),
    })
  } else if (env.SENDGRID_API_KEY) {
    // Use SendGrid
    const sgMail = await import("@sendgrid/mail")
    sgMail.default.setApiKey(env.SENDGRID_API_KEY)

    await sgMail.default.send({
      from: "noreply@fabricpro.com",
      to: env.NEXT_PUBLIC_COMPANY_EMAIL!,
      subject: `New Quote Request from ${data.companyName}`,
      html: generateEmailTemplate(data),
    })
  }
}

async function saveToDatabase(data: any) {
  // Implement database saving based on your chosen database
  if (env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY!)

    await supabase.from("contact_forms").insert([
      {
        ...data,
        created_at: new Date().toISOString(),
      },
    ])
  }
}

async function sendToCRM(data: any) {
  // Implement CRM integration based on your chosen CRM
  if (process.env.HUBSPOT_API_KEY) {
    // HubSpot integration
    await fetch("https://api.hubapi.com/contacts/v1/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
      },
      body: JSON.stringify({
        properties: [
          { property: "email", value: data.email },
          { property: "firstname", value: data.contactPerson },
          { property: "company", value: data.companyName },
          { property: "phone", value: data.phone },
        ],
      }),
    })
  }
}

async function sendWebhook(data: any) {
  if (process.env.FORM_WEBHOOK_URL) {
    await fetch(process.env.FORM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }
}

function generateEmailTemplate(data: any) {
  return `
    <h2>New Quote Request</h2>
    <p><strong>Company:</strong> ${data.companyName}</p>
    <p><strong>Contact Person:</strong> ${data.contactPerson}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Phone:</strong> ${data.phone}</p>
    <p><strong>Business Type:</strong> ${data.businessType}</p>
    <p><strong>Annual Volume:</strong> ${data.annualVolume || "Not specified"}</p>
    <p><strong>Primary Markets:</strong> ${data.primaryMarkets || "Not specified"}</p>
    <p><strong>Fabric Types:</strong> ${data.fabricTypes.join(", ")}</p>
    <p><strong>Specifications:</strong> ${data.specifications || "None provided"}</p>
    <p><strong>Timeline:</strong> ${data.timeline || "Not specified"}</p>
    <p><strong>Message:</strong> ${data.message || "None provided"}</p>
  `
}
