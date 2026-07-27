import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import * as authApi from '../../api/auth.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const showToast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authApi.login(form);
      login(data.token);
      showToast({ type: 'success', title: 'Welcome back!', message: 'You have successfully signed in.' });
      navigate('/dashboard');
    } catch (err) {
      showToast({ type: 'error', title: 'Login failed', message: err.response?.data?.message || 'Invalid credentials. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-50 px-4 dark:bg-surface-950">
      <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent dark:from-primary-500/10" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-surface-200 bg-white p-8 shadow-lg dark:border-surface-800 dark:bg-surface-900 sm:p-10">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
                C
              </div>
              <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
                CodePrep
              </span>
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-surface-900 dark:text-surface-100">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              Sign in to continue your journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200 dark:border-surface-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-surface-400 dark:bg-surface-900 dark:text-surface-500">
                New here?
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-surface-500 dark:text-surface-400">
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
