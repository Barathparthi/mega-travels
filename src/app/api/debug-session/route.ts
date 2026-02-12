
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    const session = await getServerSession(authOptions);

    const cookieStore = cookies();
    const allCookies = cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' }));

    return NextResponse.json({
        session,
        cookies: allCookies,
        env: {
            NEXTAUTH_URL: process.env.NEXTAUTH_URL,
            VERCEL_URL: process.env.VERCEL_URL,
            NODE_ENV: process.env.NODE_ENV,
            NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
        }
    });
}
