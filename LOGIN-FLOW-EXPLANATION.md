# Login Flow Explanation

## What Happens When You Click "Sign In"

### Step-by-Step Process:

1. **User Submits Form** (`login-form.tsx`)
   - User enters email/phone and password
   - Form validation runs (email format or 10-digit phone)
   - `onSubmit` function is called

2. **Authentication Request** (`useAuth.ts`)
   - Calls `signIn('credentials', { email, password, redirect: false })`
   - This sends a POST request to `/api/auth/callback/credentials`

3. **Server-Side Authentication** (`auth.ts`)
   - NextAuth calls the `authorize` function
   - Connects to MongoDB database
   - Normalizes input (removes spaces, converts phone to digits)
   - Finds user by email or phone number
   - Validates password using bcrypt
   - Checks if user is active
   - Returns user object: `{ id, email, name, role }`

4. **Session Creation** (`auth.ts` callbacks)
   - `jwt` callback: Creates JWT token with user info (id, role)
   - `session` callback: Adds user data to session object
   - NextAuth sets HTTP-only cookie: `next-auth.session-token`

5. **Client-Side Response** (`login-form.tsx`)
   - `signIn` returns `{ ok: true }` if successful
   - Shows success toast: "Login successful! Redirecting..."
   - Calls `update()` to refresh session data
   - Waits for session to be available

6. **Session Detection** (`login-form.tsx` useEffect)
   - Monitors `useSession()` hook
   - When `status === 'authenticated'` and session has role:
     - **Admin role** → Redirects to `/admin/dashboard`
     - **Driver role** → Redirects to `/driver/dashboard`

7. **Root Page Redirect** (`page.tsx` - fallback)
   - If user lands on `/` (root), server checks session
   - If no session → Redirects to `/login`
   - If session exists:
     - Admin → `/admin/dashboard`
     - Driver → `/driver/dashboard`

8. **Route Protection** (`middleware.ts`)
   - Middleware runs on every request
   - Checks if route requires authentication
   - `/admin/*` routes: Requires `role === 'admin'`
   - `/driver/*` routes: Requires `role === 'driver'`
   - Public routes (manifest.json, sw.js, icons) bypass auth

## Why Driver Portal Gets Logged In

The system redirects based on the **user's role** stored in the database:

- If user's `role` field in database = `'driver'` → Goes to `/driver/dashboard`
- If user's `role` field in database = `'admin'` → Goes to `/admin/dashboard`

The role is determined during login when the user is fetched from the database in the `authorize` function.

## Session Cookie Details

- **Cookie Name**: `next-auth.session-token`
- **Type**: HTTP-only (not accessible via JavaScript for security)
- **Max Age**: 90 days (for persistent login)
- **SameSite**: `lax` (works in PWA mode)
- **Secure**: `true` in production (HTTPS only)

## Improvements Made

1. **Session-Aware Redirect**: Now waits for session to be available before redirecting
2. **Role-Based Redirect**: Directly redirects to correct dashboard based on role
3. **Fallback Protection**: Root page also checks session and redirects appropriately
4. **Better Error Handling**: Database connection errors are caught and reported

## Troubleshooting

If login redirects to wrong portal:
- Check user's `role` field in MongoDB database
- Verify the role is exactly `'admin'` or `'driver'` (case-sensitive)
- Check browser console for any errors
- Verify database connection is working

If login shows "Login successful" but stays on login page:
- Session cookie might not be setting (check browser DevTools → Application → Cookies)
- Check if `NEXTAUTH_SECRET` environment variable is set
- Verify `NEXTAUTH_URL` matches your deployment URL
