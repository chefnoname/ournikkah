# Running the App Locally

## Prerequisites
- Node.js installed
- Xcode installed (for iOS dev build)
- iPhone and Mac on the **same Wi-Fi network**

---

## First-time setup: Build the dev client

Because the app uses native packages that Expo Go doesn't support, you need to build a custom dev client once:

```bash
npx expo run:ios
```

This compiles the native code and installs the app on your simulator or plugged-in iPhone (~5-10 min first time). After this, you won't need to run it again unless you add new native dependencies.

To target a physical iPhone specifically:
```bash
npx expo run:ios --device
```

---

## Daily development

**1. Start the backend:**
```bash
npm run server:dev
```

**2. Start Expo (in a separate terminal):**
```bash
npm start
```

**3.** Scan the QR code with the dev client app installed on your phone.

---

## Network: phone can't reach the backend

Your phone can't use `localhost` to reach your Mac — it needs the Mac's actual local IP.

**Get your Mac's IP:**
```bash
ipconfig getifaddr en0
```

**Update `.env.local`:**
```
EXPO_PUBLIC_API_URL=http://<your-mac-ip>:3000
```

Then restart `npm start` (env changes need a full restart).

> Your IP can change when you reconnect to Wi-Fi — re-run the command above if the app stops connecting.
