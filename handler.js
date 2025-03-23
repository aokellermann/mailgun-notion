const serverless = require("serverless-http");
const express = require("express");
const { Client } = require("@notionhq/client");
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

// The ID of the database where email content will be saved
const databaseId = process.env.NOTION_DATABASE_ID;

// Mailgun webhook endpoint
app.post("/mailgun-webhook", async (req, res) => {
  try {
    console.log("Received webhook from Mailgun:", JSON.stringify(req.body));
    
    // Extract email data from Mailgun payload
    const { subject, "body-plain": bodyPlain, "body-html": bodyHtml } = req.body;
    
    if (!subject) {
      return res.status(400).json({ error: "Missing email subject" });
    }
    
    // Use plain text content or fallback to empty string
    const content = bodyPlain || "";
    
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
      // Add the email content to the page
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                text: {
                  content: content,
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
