const serverless = require("serverless-http");
const express = require("express");
const { Client } = require("@notionhq/client");
const { Anthropic } = require("@anthropic-ai/sdk");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// Parse JSON payloads
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Initialize Anthropic client
const anthropic = new Anthropic();

// The ID of the database where email content will be saved
const databaseId = process.env.NOTION_DATABASE_ID;

// Function to summarize email content using Claude
async function summarizeEmail(content) {
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `Please provide a concise summary of this email in the format of an action item with all relevant information and/or links to complete the task:\n\n${content}`
      }]
    });
    return message.content[0].text;
  } catch (error) {
    console.error("Error summarizing email:", error);
    return "Failed to generate summary";
  }
}

// Mailgun webhook endpoint
app.post("/mailgun-webhook", async (req, res) => {
  try {
    console.log("Received webhook from Mailgun:", JSON.stringify(req.body));
    
    // Extract email data from Mailgun payload
    const { subject, "body-plain": bodyPlain } = req.body;
    
    if (!subject) {
      return res.status(400).json({ error: "Missing email subject" });
    }
    
    // Use plain text content or fallback to empty string
    const content = bodyPlain || "";
    
    // Generate summary using Claude
    const summary = await summarizeEmail(content);
    
    // Create a new page in Notion database
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        Title: {
          title: [
            {
              text: {
                content: subject,
              },
            },
          ],
        },
      },
      // Add the email summary to the page
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                text: {
                  content: summary,
                },
              },
            ],
          },
        },
      ],
    });
    
    console.log("Successfully created Notion page:", response.id);
    
    return res.status(200).json({
      message: "Email successfully processed and added to Notion",
      notionPageId: response.id,
    });
  } catch (error) {
    console.error("Error processing email:", error);
    return res.status(500).json({
      error: "Failed to process email",
      details: error.message,
    });
  }
});

exports.handler = serverless(app);
