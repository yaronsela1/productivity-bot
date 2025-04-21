// src/pages/index.js - Main Dashboard
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { getUserData, saveUser } from '../lib/db';
import Head from 'next/head';

export default function Dashboard() {
  // Add this state to your component
const [slackPreview, setSlackPreview] = useState(null);

// Modify the test function to save the preview to state
const testSlackMessage = async () => {
    try {
      // First get the real emails from your Gmail account
      const response = await fetch('/api/check-gmail');
      const data = await response.json();
      
      if (data.error) {
        alert(`Error getting emails: ${data.error}`);
        return;
      }
      
      const emails = data.emails || [];
      
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
      
      // Add email section
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
      
      // This is the payload that would be sent to Slack
      const payload = {
        blocks
      };
      
      // Save the preview to state
      setSlackPreview(payload);
      
    } catch (error) {
      console.error('Error generating Slack message:', error);
      alert(`Error generating Slack message: ${error.message}`);
    }
  };
  const { data: session, status } = useSession();
  const [whitelist, setWhitelist] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [checkInterval, setCheckInterval] = useState('1h');
  const [slackWebhook, setSlackWebhook] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Load user data when session is available
  useEffect(() => {
    async function loadUserData() {
      if (session?.user?.email) {
        const userData = await getUserData(session.user.email);
        if (userData) {
          setWhitelist(userData.whitelist || []);
          setCheckInterval(userData.checkInterval || '1h');
          setSlackWebhook(userData.slackWebhook || '');
        }
      }
    }
    
    if (session) {
      loadUserData();
    }
  }, [session]);
  
  // If not logged in, show sign in button
  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Head>
          <title>Productivity Assistant</title>
        </Head>
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">Productivity Assistant</h1>
          <p className="mb-4">Please sign in to access your dashboard</p>
          <button 
            onClick={() => signIn('google')}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }
  

  // Add this function to your dashboard component
const testFullIntegration = async () => {
    try {
      // 1. Get the current user data including Slack webhook
      const userData = await getUserData(session.user.email);
      
      if (!userData || !userData.slackWebhook) {
        alert('Please save a Slack webhook URL first!');
        return;
      }
      
      // 2. Get important emails
      const emailResponse = await fetch('/api/check-gmail');
      const emailData = await emailResponse.json();
      
      if (emailData.error) {
        alert(`Error fetching emails: ${emailData.error}`);
        return;
      }
      
      const emails = emailData.emails || [];
      
      // 3. Create Slack message blocks
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
      
      // Add email section
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
      
      // Add timestamp
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
      
      // 4. Send to Slack
      const slackResponse = await fetch('/api/send-to-slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            webhookUrl: userData.slackWebhook,
            blocks 
        })
      });

      const slackData = await slackResponse.json();
      
      if (slackResponse.ok) {
        alert('Success! Message sent to Slack!');
      } else {
        throw new Error(`Error: ${slackData.error || 'Failed to send to Slack'}`);
      }
          
      } catch (error) {
        console.error('Error in full integration test:', error);
        alert(`Error: ${error.message}`);
      }
  };
  // Add this function in your Dashboard component
  const testGmailIntegration = async () => {
    try {
      const response = await fetch('/api/check-gmail');
      const data = await response.json();
      
      if (data.error) {
        alert(`Error: ${data.error}\n${data.message || ''}`);
        console.error('Gmail test error:', data);
      } else {
        alert(`Success! Found ${data.emailCount} emails.`);
        console.log('Emails found:', data.emails);
      }
    } catch (error) {
      alert(`Failed to test Gmail integration: ${error.message}`);
      console.error('Error testing Gmail:', error);
    }
  };
  
  // Add email to whitelist 
  const addEmail = () => {
    if (newEmail && !whitelist.includes(newEmail)) {
      setWhitelist([...whitelist, newEmail]);
      setNewEmail('');
    }
  };
  
  // Remove email from whitelist
  const removeEmail = (email) => {
    setWhitelist(whitelist.filter(e => e !== email));
  };
  
  // Save settings
  const saveSettings = async () => {
    if (session?.user?.email) {
      setIsSaving(true);
      
      await saveUser(session.user.email, {
        whitelist,
        checkInterval,
        slackWebhook,
        updatedAt: new Date().toISOString()
      });
      
      setIsSaving(false);
      alert('Settings saved successfully!');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Head>
        <title>Dashboard - Productivity Assistant</title>
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-2xl font-bold mb-2">Productivity Assistant</h1>
          <p className="text-gray-600 mb-4">
            Configure your email and Slack notifications
          </p>
          
          {session?.user?.name && (
            <p className="mb-4">
              Signed in as <strong>{session.user.name}</strong>
            </p>
          )}
        </div>
        
        {/* Email Whitelist */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Important Email Senders</h2>
          <p className="text-gray-600 mb-4">
            Add email addresses that are important to you. Don't forget to add your boss! 😉
          </p>
          
          <div className="flex mb-4">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email address"
              className="flex-grow p-2 border rounded-l"
            />
            <button
              onClick={addEmail}
              className="bg-blue-500 text-white p-2 rounded-r"
            >
              Add
            </button>
          </div>
          
          <div className="mb-4">
            {whitelist.length === 0 ? (
              <p className="text-gray-500 italic">No emails added yet</p>
            ) : (
              <ul className="border rounded divide-y">
                {whitelist.map(email => (
                  <li key={email} className="p-2 flex justify-between items-center">
                    <span>{email}</span>
                    <button
                      onClick={() => removeEmail(email)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Check Interval */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Check Interval</h2>
          <p className="text-gray-600 mb-4">
            How often should we check for new messages?
          </p>
          
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setCheckInterval('1h')}
              className={`py-2 px-4 rounded ${
                checkInterval === '1h' 
                  ? 'bg-blue-600 text-white font-bold shadow-md' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Every hour
            </button>
            <button
              onClick={() => setCheckInterval('4h')}
              className={`py-2 px-4 rounded ${
                checkInterval === '4h' 
                  ? 'bg-blue-600 text-white font-bold shadow-md' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Every 4 hours
            </button>
            <button
              onClick={() => setCheckInterval('1d')}
              className={`py-2 px-4 rounded ${
                checkInterval === '1d' 
                  ? 'bg-blue-600 text-white font-bold shadow-md' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Once a day
            </button>
          </div>
        </div>
        
        {/* Slack Webhook */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Slack Integration</h2>
          <p className="text-gray-600 mb-4">
            Enter your Slack incoming webhook URL to receive notifications
          </p>
          
          <input
            type="text"
            value={slackWebhook}
            onChange={(e) => setSlackWebhook(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full p-2 border rounded mb-4"
          />
        </div>
        <button
          onClick={testFullIntegration}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 ml-2"
        >
          Send to Slack
    </button>
        <button
          onClick={testSlackMessage}
          className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 ml-2"
        >
          Test Slack Message
        </button>
        <button
          onClick={testGmailIntegration}
          className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 ml-2"
        >
        Test Gmail Integration
        </button>
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="bg-green-500 text-white py-2 px-8 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
        {/* Slack Message Preview */}
{slackPreview && (
  <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4">Slack Message Preview</h2>
    
    <div className="bg-[#f8f8f8] border border-gray-300 p-4 rounded-md">
      {/* Header */}
      <div className="text-lg font-bold mb-2">
        {slackPreview.blocks[0].text.text}
      </div>
      
      <hr className="my-3" />
      
      {/* Important Emails Section */}
      <div className="font-bold mb-2">Important Emails:</div>
      
      {/* Email Items */}
      {slackPreview.blocks.slice(3, -1).map((block, index) => (
        <div key={index} className="my-3 p-3 bg-white border border-gray-200 rounded">
          {block.text && block.text.text.split('\n').map((line, i) => (
            <div key={i} className={i === 0 || i === 1 ? 'font-medium' : ''}>
              {line}
            </div>
          ))}
          {block.accessory && (
            <a 
              href={block.accessory.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Open Email
            </a>
          )}
        </div>
      ))}
      
      {/* Timestamp */}
      <div className="text-sm text-gray-500 mt-3">
        {slackPreview.blocks[slackPreview.blocks.length - 1].elements[0].text}
      </div>
    </div>
    
    <div className="mt-4">
      <p className="text-sm text-gray-600">
        This is a preview of how your message will appear in Slack when you have a webhook configured.
      </p>
    </div>
  </div>
)}
      </div>
    </div>
  );
}