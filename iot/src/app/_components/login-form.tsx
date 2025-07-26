"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaGoogle } from "react-icons/fa";
import { useState } from "react";
import { motion } from "framer-motion";

type LoginFormInputs = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "discord" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const getFriendlyError = (error: string) => {
    const errorMap: Record<string, string> = {
      "CredentialsSignin": "Invalid email or password",
      "Default": "Login failed. Please try again later."
    };
    return errorMap[error] ?? error;
  };

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setLoginError(null);
    setIsLoading(true);
    
    try {
      const sanitizedData = {
        email: data.email.trim().toLowerCase(),
        password: data.password.trim()
      };

      const result = await signIn("credentials", {
        redirect: false,
        ...sanitizedData,
        callbackUrl: '/user',
      });

      if (result?.error) {
        setLoginError(getFriendlyError(result.error));
      } else {
        router.push("/user");
      }
    } catch {
      setLoginError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {loginError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-md bg-red-100 p-3 text-sm text-red-700" 
            role="alert"
          >
            {loginError}
          </motion.div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email", { 
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })}
            className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
            autoComplete="email"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password", { 
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters"
                }
              })}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          
          <div className="text-sm">
            <a
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <button
          type="submit"
          className={`w-full rounded-full bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging in...
            </span>
          ) : 'Login'}
        </button>
      </motion.form>

      <div className="flex items-center justify-center space-x-4">
        <hr className="w-full border-gray-300" />
        <span className="text-sm text-gray-500">OR</span>
        <hr className="w-full border-gray-300" />
      </div>

      <div className="space-y-4">
        {/* <button
          onClick={() => {
            setSocialLoading("discord");
            void signIn("discord");
          }}
          className={`flex w-full items-center justify-center space-x-2 rounded-full bg-[#5865F2] px-4 py-2 font-bold text-white hover:bg-[#4752C4] transition-colors ${socialLoading === 'discord' ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={socialLoading === 'discord'}
        >
          <FaDiscord />
          <span>
            {socialLoading === 'discord' ? 'Redirecting...' : 'Login with Discord'}
          </span>
        </button> */}

        <button
          onClick={() => {
            setSocialLoading("google");
            void signIn("google");
          }}
          className={`flex w-full items-center justify-center space-x-2 rounded-full bg-white px-4 py-2 font-bold text-black hover:bg-gray-100 transition-colors ${socialLoading === 'google' ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={socialLoading === 'google'}
        >
          <FaGoogle />
          <span>
            {socialLoading === 'google' ? 'Redirecting...' : 'Login with Google'}
          </span>
        </button>
      </div>

      <div className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
          Sign up
        </a>
      </div>
    </div>
  );
}