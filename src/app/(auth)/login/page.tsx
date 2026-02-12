import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { LoginForm } from '@/components/forms/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center pb-8">
          {/* Company Name */}
          <div>
            <h1 className="text-3xl font-bold text-brand-red tracking-tight">
              Mayaa Travels
            </h1>
            <p className="text-sm text-gray-500 mt-1">Fleet Management System</p>
          </div>

          <CardDescription className="text-base">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <LoginForm />

          {/* Footer */}
          <p className="text-xs text-center text-gray-500 mt-8">
            © 2025 Mayaa Travels. All rights reserved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
