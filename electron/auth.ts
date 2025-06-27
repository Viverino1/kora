import * as dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

import express from 'express';
import { BrowserWindow } from 'electron';
import { OAuth2Client } from 'google-auth-library';

// You should set these as environment variables for security in production
const CLIENT_ID = '435707567871-9i61b2fnksitmlqk9ols75upuhn2pp4i.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:42813/auth-callback';

const SCOPES = ['profile', 'email', 'openid'];

export function startGoogleAuth(mainWindow: BrowserWindow) {
  const app = express();
  const oAuth2Client = new OAuth2Client({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI
  });

  app.get('/auth-callback', async (req, res) => {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).send('No code provided');
      return;
    }
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      // Send the id_token to the renderer process
      if (tokens.id_token) {
        mainWindow.webContents.send('google-auth-token', tokens.id_token);
      }
      res.send('<script>window.close();</script>Authentication successful! You can close this window.');
    } catch (err) {
      res.status(500).send('Authentication failed');
    }
    server.close();
  });

  const server = app.listen(42813, async () => {
    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'select_account'
      // Do NOT add client_id here, google-auth-library handles it
    });
    const { shell } = require('electron');
    await shell.openExternal(url);
  });
}
