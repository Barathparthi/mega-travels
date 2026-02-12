import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '../../backend/config/database';
import User from '../../backend/models/user.model';
import { UserRole } from '../../backend/types';
import mongoose from 'mongoose';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email/phone and password');
        }

        try {
          // Connect to database with error handling
          await connectDB();

          // Verify connection is active
          if (mongoose.connection.readyState !== 1) {
            console.error('❌ Database connection not ready. State:', mongoose.connection.readyState);
            throw new Error('Database connection failed. Please try again.');
          }
        } catch (dbError) {
          console.error('❌ Database connection error in authorize:', dbError);
          throw new Error('Database connection failed. Please try again later.');
        }

        // Normalize input - remove spaces and special characters from phone
        const normalizedInput = credentials.email.trim().toLowerCase();
        const phoneDigits = normalizedInput.replace(/\D/g, '');
        const isPhoneNumber = /^\d{10}$/.test(phoneDigits);

        console.log(`[AUTH DEBUG] Login attempt for: ${normalizedInput} (Is Phone: ${isPhoneNumber})`);

        let user;
        try {
          if (isPhoneNumber) {
            // Login with phone number - use normalized digits
            console.log(`[AUTH DEBUG] Looking up user by phone: ${phoneDigits}`);
            user = await User.findOne({ phone: phoneDigits }).select('+password');
          } else {
            // Login with email - use normalized lowercase
            console.log(`[AUTH DEBUG] Looking up user by email: ${normalizedInput}`);
            user = await User.findOne({ email: normalizedInput }).select('+password');
          }
        } catch (queryError) {
          console.error('❌ Database query error in authorize:', queryError);
          throw new Error('Database query failed. Please try again.');
        }

        if (!user) {
          console.log(`[AUTH DEBUG] User not found for input: ${isPhoneNumber ? phoneDigits : normalizedInput}`);
          throw new Error(isPhoneNumber ? 'Invalid phone number or password' : 'Invalid email or password');
        } else {
          console.log(`[AUTH DEBUG] User found: ${user.email} (${user._id})`);
        }

        if (!user.isActive) {
          console.log(`[AUTH DEBUG] User inactive: ${user._id}`);
          throw new Error('Your account is inactive. Please contact admin.');
        }

        if (!user.password) {
          console.error('❌ User found but password field is missing:', user._id);
          throw new Error('Account configuration error. Please contact admin.');
        }

        let isPasswordValid;
        try {
          console.log(`[AUTH DEBUG] Verifying password for user: ${user._id}`);
          isPasswordValid = await user.comparePassword(credentials.password);
          console.log(`[AUTH DEBUG] Password valid: ${isPasswordValid}`);
        } catch (passwordError) {
          console.error('❌ Password comparison error:', passwordError);
          throw new Error('Authentication error. Please try again.');
        }

        if (!isPasswordValid) {
          console.log(`[AUTH DEBUG] Invalid password for user: ${user._id}`);
          throw new Error(isPhoneNumber ? 'Invalid phone number or password' : 'Invalid email or password');
        }

        if (!user.email || !user.name) {
          console.error('❌ User missing required fields:', { hasEmail: !!user.email, hasName: !!user.name });
          throw new Error('Account data incomplete. Please contact admin.');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 90 * 24 * 60 * 60, // 90 days - Persistent login for drivers
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 90 * 24 * 60 * 60, // 90 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 90 * 24 * 60 * 60, // 90 days
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
