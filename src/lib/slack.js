/**
 * Sends a summary message to a Slack channel
 * @param {string} webhookUrl - Slack incoming webhook URL
 * @param {object} data - Data to send to Slack (emails and mentions)
 * @returns {boolean} - Success status
 */
export async function sendSlackSummary(webhookUrl, data) {
    const { emails = [], slackMentions = [] } = data;
    
    try {
      // Create the message blocks
      const blocks = [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "📬 Your Productivity Summary",
            "emoji": true
          }
        },
        {
          "type": "divider"
        }
      ];
      
      // Add email section if we have emails
      if (emails.length > 0) {
        blocks.push(
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Important Emails:*"
            }
          }
        );
        
        // Add each email as a section
        emails.forEach(email => {
          blocks.push({
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*From:* ${email.from}\n*Subject:* ${email.subject}\n${email.snippet}`
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Open Email",
                "emoji": true
              },
              "url": email.url
            }
          });
        });
      } else {
        blocks.push({
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "No important emails to report! 🎉"
          }
        });
      }
      
      // Add Slack mentions section if we have any
      if (slackMentions.length > 0) {
        blocks.push(
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Recent Slack Mentions:*"
            }
          }
        );
        
        // Add each mention as a context block
        slackMentions.forEach(mention => {
          blocks.push({
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*${mention.user}* in *${mention.channel}*:\n${mention.text}`
            }
          });
        });
      }
      
      // Add timestamp at the bottom
      blocks.push(
        {
          "type": "context",
          "elements": [
            {
              "type": "plain_text",
              "text": `Last updated: ${new Date().toLocaleTimeString()}`,
              "emoji": true
            }
          ]
        }
      );
      
      // Send the message to Slack
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blocks
        })
      });
      
      if (!response.ok) {
        throw new Error(`Slack API responded with status: ${response.status}`);
      }
      
      return true;
      
    } catch (error) {
      console.error('Error sending Slack message:', error);
      return false;
    }
  }
  
  /**
   * Fetches recent mentions from Slack
   * @param {string} slackToken - User's Slack token
   * @param {string} userId - Slack user ID to check mentions for
   * @returns {Array} - Array of recent mentions
   */
  export async function getSlackMentions(slackToken, userId) {
    // For MVP, we'll return a placeholder
    // In a real implementation, this would call the Slack API
    
    console.log('Getting Slack mentions for user:', userId);
    
    // This is a simplified example - in a real app, you'd call the Slack API
    // to get actual mentions for the user
    return [
      /* Example structure when implemented:
      {
        user: "John Doe",
        channel: "#project-updates",
        text: "Hey @user, can you review the latest design?",
        timestamp: "2023-04-15T14:30:00Z",
        url: "https://slack.com/archives/C12345/p1234567890"
      }
      */
    ];
  }