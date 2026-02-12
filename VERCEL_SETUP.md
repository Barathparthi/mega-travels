# Required Vercel Environment Variables

Your production deployment is likely missing critical environment variables. This is the **#1 cause** of login redirection loops.

Follow these steps to fix the issue:

### 1. Generate a Secret
Run this command in your terminal (or use any random string generator):
```bash
openssl rand -base64 32
```
Or just type a long random string like: `my-super-secret-production-key-12345`

### 2. Add Variables to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your project (`mega-ryan` or similar).
3. Go to **Settings** > **Environment Variables**.
4. Add the following keys:

| Key | Value Description |
|-----|-------------------|
| `NEXTAUTH_SECRET` | The random string you generated above. **CRITICAL**. |
| `NEXTAUTH_URL` | Your production URL, e.g., `https://mega-ryan.vercel.app`. |
| `MONGODB_URI` | Your full MongoDB connection string (including username/password). Ensure database access is allowed from `0.0.0.0/0` (Network Access in Atlas). |

### 3. Redeploy
After adding the variables, you must **Redeploy** for them to take effect.
1. Go to **Deployments**.
2. Click the three dots on the latest deployment.
3. Select **Redeploy**.

### Why this happens?
The `middleware.ts` running on Vercel's Edge Network needs `NEXTAUTH_SECRET` to verify the session token (JWT) created by your login API. 
- If this variable is missing, `next-auth` might generate a random one for the API, and the Middleware might generate a *different* random one, causing verification to fail.
- This results in `token` being `null`, and the middleware redirects you back to `/login`.

### Additional Check: Database Access
If login says "Invalid credentials" despite being correct, ensure your MongoDB Atlas **Network Access** whitelist includes `0.0.0.0/0` (Allow Access from Anywhere). Vercel's IP addresses change dynamically and are not static.
