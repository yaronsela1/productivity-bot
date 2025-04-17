import { getImportantEmails } from "../../lib/gmail";
import { sendSlackSummary } from "../../lib/slack";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Verify the request is coming from Vercel Cron
const isVercelCron = (req) => {
  return req.headers['x-vercel-cron'] === process.env.CRON_SECRET;
};

export default async function handler(req, res) {
  try {
    // For security, verify the request is from Vercel Cron
    // if (!isVercelCron(req)) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }
    
    // Get the interval from the query parameters
    const { interval } = req.query;
    
    if (!interval || !['1h', '4h', '1d'].includes(interval)) {
      return res.status(400).json({ error: 'Valid interval is required (1h, 4h, or 1d)' });
    }
    
    // Find all users who have configured this check interval
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('checkInterval', '==', interval));
    const querySnapshot = await getDocs(q);
    
    // Track results
    const results = {
      total: querySnapshot.size,
      successful: 0,
      failed: 0,
      details: []
    };
    
    // For each user, call the check API
    const checkPromises = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Skip users without Slack webhook
      if (!userData.slackWebhook) {
        results.details.push({
          email: doc.id,
          status: 'skipped',
          reason: 'No Slack webhook configured'
        });
        return;
      }
      
      // For MVP, we'll make a simple request to our API
      // In a production app, you'd handle token refresh and direct API calls
      checkPromises.push(
        fetch(`${process.env.NEXTAUTH_URL}/api/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: doc.id
          })
        })
        .then(async (response) => {
          const result = await response.json();
          
          if (response.ok) {
            results.successful++;
            results.details.push({
              email: doc.id,
              status: 'success',
              emailCount: result.emailCount
            });
          } else {
            results.failed++;
            results.details.push({
              email: doc.id,
              status: 'failed',
              error: result.error
            });
          }
        })
        .catch((error) => {
          results.failed++;
          results.details.push({
            email: doc.id,
            status: 'error',
            error: error.message
          });
        })
      );
    });
    
    // Wait for all checks to complete
    await Promise.all(checkPromises);
    
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('Error in cron API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}