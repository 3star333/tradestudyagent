# Fixing Google OAuth Login Loop

## Problem
You're being redirected back to the login page after attempting to sign in with Google.

## Root Cause
This is almost always caused by **missing or incorrect redirect URIs** in your Google Cloud Console OAuth configuration.

---

## ✅ Solution: Add Redirect URIs to Google Cloud Console

### Step 1: Go to Google Cloud Console

1. Open: **https://console.cloud.google.com/apis/credentials**
2. Find your OAuth 2.0 Client ID: `424968880060-bsgfer130rua0dkq6u8oc4cgr46qu14m.apps.googleusercontent.com`
3. Click on it to edit

### Step 2: Add These Redirect URIs

Under **"Authorized redirect URIs"**, add:

```
http://localhost:3000/api/auth/callback/google
```

**For production (Vercel), also add:**
```
https://tradestudyagent-4p7ajwogk-3star333s-projects.vercel.app/api/auth/callback/google
https://tradestudyagent.vercel.app/api/auth/callback/google
```

### Step 3: Save Changes

Click **"Save"** at the bottom of the page.

**Important:** Changes may take 5-10 minutes to propagate. Clear your browser cache or use incognito mode to test.

---

## 🔧 Additional Troubleshooting

### Check #1: Verify Database Tables Exist

```bash
cd /Users/raiikee/trade-study-agent
npx prisma studio
```

Verify these tables exist:
- ✅ `User`
- ✅ `Account`
- ✅ `Session`
- ✅ `VerificationToken`

### Check #2: Clear Browser Cookies

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Cookies** → `http://localhost:3000`
4. Right-click → **Clear all cookies**
5. Try logging in again

### Check #3: Test Auth Endpoint

Visit: http://localhost:3000/api/auth/providers

You should see:
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    "signinUrl": "http://localhost:3000/api/auth/signin/google",
    "callbackUrl": "http://localhost:3000/api/auth/callback/google"
  }
}
```

### Check #4: Inspect Login Flow

1. Open browser DevTools → **Network** tab
2. Try to log in
3. Look for these requests:
   - ✅ `/api/auth/signin/google` (should redirect to Google)
   - ✅ Google OAuth consent screen
   - ✅ `/api/auth/callback/google` (callback from Google)
   - ✅ `/api/auth/session` (session check)

**If you see an error** at the callback step, that's your redirect URI issue.

---

## 🚨 Common Errors & Solutions

### Error: "redirect_uri_mismatch"
**Cause:** Redirect URI not added to Google Cloud Console  
**Fix:** Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs

### Error: "Invalid state parameter"
**Cause:** Cookie issues or NEXTAUTH_SECRET mismatch  
**Fix:** Clear cookies and ensure NEXTAUTH_SECRET is consistent

### Error: "Database error"
**Cause:** Prisma can't connect to database  
**Fix:** Check DATABASE_URL and run `npx prisma migrate deploy`

### Session doesn't persist (keeps logging out)
**Cause:** Database session table missing or inaccessible  
**Fix:** Run `npx prisma db push` to ensure tables exist

---

## 🔍 Debug Mode

Enable NextAuth debug mode to see detailed logs:

**Update `lib/auth.ts`:**

```typescript
export const authOptions: NextAuthOptions = {
  debug: true, // ADD THIS LINE
  adapter: PrismaAdapter(db),
  // ... rest of config
};
```

Then check your terminal where `npm run dev` is running for detailed auth logs.

---

## ✅ Quick Checklist

- [ ] Add `http://localhost:3000/api/auth/callback/google` to Google OAuth redirect URIs
- [ ] Wait 5-10 minutes for Google changes to propagate
- [ ] Clear browser cookies for localhost:3000
- [ ] Verify database connection: `npx prisma studio`
- [ ] Check environment variables are loaded: `cat .env.local`
- [ ] Try in incognito/private browsing mode
- [ ] Check Network tab in DevTools for errors
- [ ] Enable debug mode in `lib/auth.ts`

---

## 🎯 Expected Flow

**Successful login should look like:**

1. Click "Sign in with Google"
2. Redirect to `http://localhost:3000/api/auth/signin/google`
3. Redirect to Google OAuth consent screen
4. Accept permissions
5. Redirect to `http://localhost:3000/api/auth/callback/google?code=...`
6. Create database records (User, Account, Session)
7. Redirect to homepage
8. **✅ You're logged in!**

---

## 🐛 Still Not Working?

### Check server logs:

```bash
# In your npm run dev terminal, look for errors like:
# [next-auth][error][CALLBACK_OAUTH_ERROR]
# [next-auth][error][OAUTH_CALLBACK_ERROR]
```

### Test database connection:

```bash
npx prisma db push
npx prisma generate
```

### Restart everything:

```bash
# Stop dev server (Ctrl+C)
# Clear Next.js cache
rm -rf .next
# Start fresh
npm run dev
```

---

## 📞 Need More Help?

If you're still stuck, provide these details:

1. Any errors in the browser console (F12 → Console tab)
2. Any errors in the terminal where `npm run dev` is running
3. Screenshot of the Network tab during login attempt
4. Your Google Cloud Console redirect URIs configuration

---

**Most likely fix:** Just add the redirect URI to Google Cloud Console and wait a few minutes! 🎯
