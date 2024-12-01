'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaUser, FaLock } from 'react-icons/fa';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    const result = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
    });
    setIsLoading(false);

    if (result?.error) {
      alert('Invalid login credentials');
    } else {
      // Redirect to the dashboard
      router.push('/dashboard/');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl p-8 border rounded-lg bg-white"
      >
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        <div className="mb-4 relative">
          <label htmlFor="email" className="block mb-2 font-medium">
            Email
          </label>
          <div className="flex items-center border rounded-md">
            <span className="p-3 text-gray-500">
              <FaUser />
            </span>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div className="mb-6 relative">
          <label htmlFor="password" className="block mb-2 font-medium">
            Password
          </label>
          <div className="flex items-center border rounded-md">
            <span className="p-3 text-gray-500">
              <FaLock />
            </span>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-md text-white transition duration-300 ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;