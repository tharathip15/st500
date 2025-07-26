// src/app/signup/page.tsx
import { SignUpForm } from "~/app/_components/signup-form";
import { auth } from "~/server/auth"; // สำหรับตรวจสอบ session
import { redirect } from "next/navigation";

export default async function SignUpPage(): Promise<React.JSX.Element> {
  const session = await auth();

  // ถ้าล็อกอินแล้ว ให้ redirect ไปหน้า /user
  if (session) {
    redirect("/user");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Create New Account
        </h2>
        <SignUpForm />
      </div>
    </div>
  );
}