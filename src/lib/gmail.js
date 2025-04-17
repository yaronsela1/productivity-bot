/**
 * Fetches important emails based on user preferences
 * @param {string} accessToken - User's Google access token
 * @param {object} options - Options including whitelist and time period
 * @returns {Array} - Array of important emails
 */
export async function getImportantEmails(accessToken, options = {}) {
    const { whitelist = [], since = '1d' } = options;
    
    try {
      // Calculate the time period (default to 1 day ago)
      const sinceDate = new Date();
      if (since === '1d') sinceDate.setDate(sinceDate.getDate() - 1);
      if (since === '4h') sinceDate.setHours(sinceDate.getHours() - 4);
      if (since === '1h') sinceDate.setHours(sinceDate.getHours() - 1);
      
      const sinceFormatted = sinceDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      // Build the Gmail search query
      let query = `is:unread after:${sinceFormatted}`;
      
      // Add whitelist addresses to query if provided
      if (whitelist.length > 0) {
        const whitelistQuery = whitelist.map(email => `from:${email}`).join(' OR ');
        query += ` AND (${whitelistQuery})`;
      }
      
      // Fetch messages matching the query
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      const data = await response.json();
      
      if (!data.messages) {
        return []; // No messages found
      }
      
      // Fetch details for each message
      const emails = await Promise.all(
        data.messages.slice(0, 10).map(async (message) => { // Limit to 10 messages for MVP
          const detailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          
          const messageData = await detailResponse.json();
          
          // Extract header information
          const headers = messageData.payload.headers;
          const subject = headers.find(h => h.name === 'Subject')?.value || '(No subject)';
          const from = headers.find(h => h.name === 'From')?.value || '';
          const date = headers.find(h => h.name === 'Date')?.value || '';
          
          // Extract snippet (preview) of the email
          const snippet = messageData.snippet || '';
          
          return {
            id: message.id,
            from,
            subject,
            date,
            snippet,
            url: `https://mail.google.com/mail/u/0/#inbox/${message.id}`
          };
        })
      );
      
      return emails;
      
    } catch (error) {
      console.error('Error fetching emails:', error);
      return [];
    }
  }