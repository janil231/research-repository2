# Backend Troubleshooting Guide

## Step-by-Step Troubleshooting

### 1. Check if Node.js is installed
Open Command Prompt and type:
```bash
node --version
```
If you get an error, install Node.js from https://nodejs.org/

### 2. Check if dependencies are installed
Navigate to your project folder:
```bash
cd C:\Users\janne\OneDrive\Desktop\research-repository2
```
Then check if node_modules exists:
```bash
dir node_modules
```
If it doesn't exist or is empty, install dependencies:
```bash
npm install
```

### 3. Check if MongoDB is running
Open Command Prompt and type:
```bash
mongod --version
```
If MongoDB is not installed, you need to install it from https://www.mongodb.com/try/download/community

To check if MongoDB is running:
```bash
mongo --version
```
Or check Windows Services:
- Press `Windows + R`, type `services.msc`
- Look for "MongoDB" service
- Make sure it's "Running"

### 4. Start MongoDB (if not running)
If MongoDB is installed but not running, start it:
```bash
mongod
```
Keep this window open in a separate Command Prompt.

### 5. Try starting the backend server
Navigate to backend folder:
```bash
cd C:\Users\janne\OneDrive\Desktop\research-repository2\backend
```

Start the server:
```bash
node server.js
```

### Common Error Messages and Solutions:

#### Error: "Cannot find module 'express'"
**Solution:** Run `npm install` in the project root folder

#### Error: "MongoDB connection error"
**Solution:** 
- Make sure MongoDB is installed and running
- Check if MongoDB service is running in Windows Services
- Try starting MongoDB manually: `mongod`

#### Error: "Port 5000 is already in use"
**Solution:** 
- Another program is using port 5000
- Close that program, or
- Change the port in server.js or use environment variable: `PORT=3000 node server.js`

#### Error: "EADDRINUSE: address already in use"
**Solution:** 
- Stop any other server running on port 5000
- Or change the port number

#### Error: "Cannot find module './routes/auth'"
**Solution:** 
- Make sure you're running from the `backend` folder
- Check that all route files exist in `backend/routes/` folder

### 6. Check Firewall Settings
Windows Firewall might be blocking the connection:
1. Press `Windows + R`, type `wf.msc`
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → Next
4. Select "TCP" and enter port "5000"
5. Select "Allow the connection"
6. Apply to all profiles
7. Name it "Node.js Server"

### 7. Test the server locally first
Before accessing from another laptop, test locally:
1. Open browser on the same computer
2. Go to: `http://localhost:5000`
3. If this works, then try from the other laptop

### 8. Verify IP Address
Make sure you're using the correct IP:
```bash
ipconfig
```
Look for IPv4 Address under your WiFi adapter (not Ethernet)

## Quick Test Commands

Run these one by one to check everything:

```bash
node --version
npm --version
mongod --version
cd C:\Users\janne\OneDrive\Desktop\research-repository2
npm install
cd backend
node server.js
```

If all commands work, you should see:
```
MongoDB connected
Server running on http://0.0.0.0:5000
Accessible from network at: http://<your-ip>:5000
```

