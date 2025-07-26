// src/app/_components/signup-form.tsx
"use client"; // ระบุว่าเป็น Client Component

import { useForm, type SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react"; // Import tRPC client

type SignUpFormInputs = {
  email: string;
  password: string;
};

export function SignUpForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormInputs>();

  // ใช้ tRPC mutation สำหรับการสมัครใช้งาน
  const registerMutation = api.user.registerUser.useMutation({
    onSuccess: () => {
      alert("Registration successful! You can now log in.");
      router.push("/login"); // เมื่อสมัครสำเร็จ ให้ redirect ไปหน้า Login
    },
    onError: (error) => {
      alert(`Registration failed: ${error.message}`);
      console.error("Registration error:", error);
    },
  });

  const onSubmit: SubmitHandler<SignUpFormInputs> = async (data) => {
    registerMutation.mutate(data); // เรียกใช้ tRPC mutation
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } })}
          className="mt-1 w-full rounded-md border border-gray-300 p-2"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register("password", { required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } })}
          className="mt-1 w-full rounded-md border border-gray-300 p-2"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={registerMutation.isPending} // ปิดการใช้งานปุ่มขณะกำลังสมัคร
      >
        {registerMutation.isPending ? "Registering..." : "Sign Up"}
      </button>
      
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Login here
        </a>
      </p>
    </form>
  );
}