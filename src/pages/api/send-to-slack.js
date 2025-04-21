// src/pages/api/send-to-slack.js
export default async function handler(req, res) {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const { webhookUrl, blocks } = req.body;
      
      if (!webhookUrl || !blocks) {
        return res.status(400).json({ error: 'Missing webhook URL or message blocks' });
      }
      
      // Forward the request to Slack
      const slackResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ blocks })
      });
      
      if (slackResponse.ok) {
        return res.status(200).json({ success: true });
      } else {
        const errorText = await slackResponse.text();
        return res.status(slackResponse.status).json({ 
          error: `Slack API responded with status: ${slackResponse.status}`,
          details: errorText
        });
      }
      
    } catch (error) {
      console.error('Error sending to Slack:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }