// src/app/login/page.tsx
import { auth } from '~/server/auth';
import { redirect } from 'next/navigation';
import { SignUpForm } from '../_components/signup-form';

export default async function LoginPage(): Promise<React.JSX.Element> {
  const session = await auth();

  // ถ้าล็อกอินแล้ว ให้ redirect ไปหน้า /user
  if (session) {
    redirect('/user');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Create New Account</h2>
        <SignUpForm />
      </div>
    </div>
  );
}