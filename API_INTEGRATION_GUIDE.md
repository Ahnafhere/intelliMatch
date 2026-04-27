# API Integration Guide - Step by Step

## Part 1: GitHub API Integration (For Student Skill Auto-Fill)

### Step 1: Create a GitHub Account (if you don't have one)
1. Go to https://github.com
2. Click "Sign up"
3. Fill in your details and verify email

### Step 2: Generate GitHub Personal Access Token
1. Go to https://github.com/settings/tokens
   - Alternative: Login → Settings (top right) → Developer settings (left sidebar) → Personal access tokens
2. Click "Generate new token" (classic)
3. Fill in the form:
   - **Token name:** `IntelliMatch-API` (or any name you like)
   - **Expiration:** Select "90 days" or "No expiration"
   - **Select scopes:** Check these boxes:
     - `repo` (Full control of private repositories)
     - `user` (Read user profile data)
     - `read:user` (Read user profile and public repo data)
     - `public_repo` (Access public repositories)

4. Click "Generate token"
5. **IMPORTANT:** Copy the token immediately (you won't see it again!)
   - It looks like: `ghp_xxxxxxxxxxxxx`

### Step 3: Add GitHub Token to .env file
1. Open: `backend/.env`
2. Add this line:
```
GITHUB_API_TOKEN=ghp_xxxxxxxxxxxxx
```
(Replace with your actual token)

3. Save the file

---

## Part 2: Gmail SMTP API Integration (For Notifications & Emails)

### Step 1: Create/Use Gmail Account
1. Go to https://mail.google.com
2. Use your existing Gmail or create new one

### Step 2: Enable 2-Factor Authentication (Required)
1. Go to https://myaccount.google.com
2. Click "Security" (left sidebar)
3. Scroll to "2-Step Verification"
4. Click it and follow the steps to enable 2FA
5. Verify with phone number

### Step 3: Generate Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
   - You must have 2FA enabled (see Step 2)
2. Select:
   - **App:** Choose "Mail"
   - **Device:** Choose "Windows PC" (or your device)
3. Click "Generate"
4. **IMPORTANT:** Copy the 16-character password
   - It looks like: `xxxx xxxx xxxx xxxx` (with spaces)
   - Remove the spaces when pasting

### Step 4: Add Gmail Config to .env file
1. Open: `backend/.env`
2. Add these lines:
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
GMAIL_FROM_NAME=IntelliMatch Notifications
```

### Step 5: Verify Setup
1. Do NOT use your regular Gmail password
2. Use the 16-character App Password generated in Step 3

---

## Example .env File (Complete)

```env
MONGO_URI=mongodb://ayansarkar2157:AyanDB2026@ac-cxtzs3r-shard-00-00.mclbwpe.mongodb.net:27017,ac-cxtzs3r-shard-00-01.mclbwpe.mongodb.net:27017,ac-cxtzs3r-shard-00-02.mclbwpe.mongodb.net:27017/?ssl=true&replicaSet=atlas-t61wql-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=super_secret_jwt_key_here
AFFINDA_API_KEY=aff_421b2c1b0b4ee73112b8abca39f2239f1b2d9249
OPENAI_API_KEY=mock 
AFFINDA_WORKSPACE_ID=YjHedqJD
GITHUB_API_TOKEN=ghp_xxxxxxxxxxxxx
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
GMAIL_FROM_NAME=IntelliMatch Notifications
```

---

## Troubleshooting

### GitHub Token Issues
| Issue | Solution |
|-------|----------|
| "Token not found" error | Make sure you copied the full token and pasted it in .env |
| "Invalid token" | Token might have expired, regenerate a new one |
| "Rate limit exceeded" | Wait 1 hour or use a different token |

### Gmail Issues
| Issue | Solution |
|-------|----------|
| "App password not working" | Make sure you have 2FA enabled first |
| "Access denied" | Use the 16-char App Password, not your regular password |
| "SMTP error" | Make sure email address matches GMAIL_USER in .env |
| "Less secure apps" error | Gmail now requires App Passwords, not "less secure app access" |

---

## Testing Your API Keys

### Test GitHub Token (in Terminal):
```powershell
cd "e:\project471\final CSE471 PROJECT\CSE471 PROJECT\backend"
node -e "
const https = require('https');
const token = process.env.GITHUB_API_TOKEN || 'YOUR_TOKEN_HERE';

const options = {
  hostname: 'api.github.com',
  path: '/user',
  method: 'GET',
  headers: {
    'Authorization': 'token ' + token,
    'User-Agent': 'IntelliMatch'
  }
};

https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ GitHub Token Valid');
      console.log('User:', JSON.parse(data).login);
    } else {
      console.log('❌ GitHub Token Invalid - Status:', res.statusCode);
    }
  });
}).end();
"
```

### Test Gmail Config (will be tested after code integration):
- Integration will automatically test when sending first email

---

## Next Steps
1. Generate both API keys following above steps
2. Add them to `.env` file
3. Restart backend server
4. Run the integration code (provided next)

