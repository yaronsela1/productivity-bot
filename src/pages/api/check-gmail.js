// src/pages/api/check-gmail.js
import { getToken } from "next-auth/jwt";
import { getImportantEmails } from "../../lib/gmail";
import { getUserData } from "../../lib/db";
import { getSession } from "next-auth/react";

const secret = process.env.NEXTAUTH_SECRET;

export default async function handler(req, res) {
  try {
    // Get the user's token from the session
    const token = await getToken({ req, secret });
    
    if (!token?.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get the user's session to find their email
    const session = await getSession({ req });
    const userEmail = session?.user?.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email not found in session' });
    }
    
    // Get the user's whitelist from Firebase
    const userData = await getUserData(userEmail);
    const whitelist = userData?.whitelist || [];
    
    console.log(`Using whitelist: ${whitelist.join(', ')}`);
    
    // Get emails with the whitelist
    const emails = await getImportantEmails(token.accessToken, {
      whitelist: whitelist,
      since: '1d'  // Check emails from the last day
    });
    
    // Return the found emails
    return res.status(200).json({ 
      success: true,
      emailCount: emails.length,
      emails: emails,
      whitelist: whitelist
    });
    
  } catch (error) {
    console.error('Error testing Gmail:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message
    });
  }
}