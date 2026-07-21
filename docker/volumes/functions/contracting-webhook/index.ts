import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("Contracting Webhook service started")

const SLACK_BOT_TOKEN = Deno.env.get("SLACK_BOT_TOKEN")
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")
const ADMIN_PHONE = Deno.env.get("WHATSAPP_PHONE_EG") || "+201026762988"

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST requests are allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const payload = await req.json()
    const { title, message, project_id } = payload

    console.log(`Received notification: ${title} - ${message} for project ${project_id}`)

    // 1. Send Slack Notification if token is available
    if (SLACK_BOT_TOKEN) {
      try {
        console.log("Sending Slack notification...")
        const slackResponse = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SLACK_BOT_TOKEN}`,
          },
          body: JSON.stringify({
            channel: "#contracting-alerts",
            text: `⚠️ *${title}*\n${message}\nProject ID: \`${project_id}\``,
          }),
        })
        const slackResult = await slackResponse.json()
        if (!slackResult.ok) {
          console.error("Slack API error:", slackResult)
        }
      } catch (err) {
        console.error("Failed to send Slack alert:", err)
      }
    }

    // 2. Send WhatsApp Notification if keys are available
    if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
      try {
        console.log("Sending WhatsApp notification to", ADMIN_PHONE)
        const whatsappResponse = await fetch(
          `https://graph.facebook.com/v24.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: ADMIN_PHONE,
              type: "text",
              text: {
                body: `*${title}*\n\n${message}\n\nرقم المشروع: ${project_id}`,
              },
            }),
          }
        )
        const waResult = await whatsappResponse.json()
        if (waResult.error) {
          console.error("WhatsApp API error:", waResult.error)
        }
      } catch (err) {
        console.error("Failed to send WhatsApp alert:", err)
      }
    }

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Error processing webhook:", err)
    return new Response(JSON.stringify({ error: err.toString() }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
