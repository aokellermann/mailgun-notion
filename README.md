# Mailgun to Notion Integration

This service includes an integration between Mailgun and Notion. When an email is forwarded from Mailgun to the webhook endpoint, it automatically creates a new page in a specified Notion database.

## Usage

### Deployment

Install dependencies with:

```sh
npm install
```

and then deploy with:

```sh
sls deploy
```

### Setup

1. **Notion API Setup**:
   - Create a Notion integration at https://www.notion.so/my-integrations
   - Get your API key from the integration
   - Share your target database with the integration
   - Get the database ID from the database URL (the part after the workspace name and before the question mark)

2. **Environment Variables**:
   - Create a `.env` file in the root directory with the following variables:
     ```
     SLS_ORG=your_serverless_org_here
     NOTION_API_KEY=your_notion_api_key_here
     NOTION_DATABASE_ID=your_notion_database_id_here
     ```

3. **Mailgun Setup**:
   - Create a new [Mailgun route](https://app.mailgun.com/mg/receiving/routes) to forward emails to your webhook endpoint
   - The full webhook URL will be: `https://your-deployed-api.com/mailgun-webhook`

### How It Works

1. When you send an email to an address at one of your
[domains](https://app.mailgun.com/mg/sending/domains), Mailgun forwards an email to the `/mailgun-webhook` endpoint (you should be able to just use the default sandbox domain to receive emails)
2. The service extracts the email subject and body
3. It creates a new page in your Notion database with:
   - The page title set to the email subject
   - The page content set to the email body

### Database Structure

Your Notion database should have at least one property:
- `Title` (type: title) - This will store the email subject
