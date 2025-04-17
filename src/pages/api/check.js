import { getToken } from "next-auth/jwt";
import { getImportantEmails } from "../../lib/gmail";
import { getSlackMentions, sendSlackSummary } from "../../lib/slack";
import { getUserData } from "../../lib/db";

// Secret used to decrypt the JWT token
const secret = process.env.NEXTAUTH_SECRET;

export default async function handler(req, res) {
  try {
    // This API can only be called with POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Get the user's email from the request (this will be sent by the cron job)
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Get the user's data from Firestore
    const userData = await getUserData(email);
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Make sure we have the necessary data to proceed
    if (!userData.slackWebhook) {
      return res.status(400).json({ error: 'Slack webhook not configured' });
    }
    
    // Get the user's token from the session (for Gmail API)
    // For a cron job, we'll need to handle token refresh differently
    // This is a simplified example for the MVP
    const token = await getToken({ req, secret });
    
    if (!token?.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get important emails using the Gmail API
    const emails = await getImportantEmails(token.accessToken, {
      whitelist: userData.whitelist || [],
      since: userData.checkInterval || '1h'
    });
    
    // For MVP, we'll skip the Slack mentions part
    // In a real implementation, you'd call the Slack API here
    const slackMentions = [];
    
    // Send the summary to Slack
    const success = await sendSlackSummary(userData.slackWebhook, {
      emails,
      slackMentions
    });
    
    if (success) {
      return res.status(200).json({ 
        success: true, 
        emailCount: emails.length,
        mentionCount: slackMentions.length
      });
    } else {
      return res.status(500).json({ error: 'Failed to send Slack message' });
    }
    
  } catch (error) {
    console.error('Error in check API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}