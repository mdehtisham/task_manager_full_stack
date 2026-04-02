import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import {
  validateEmail,
  validatePassword,
  validateName,
  extractApiErrors,
  extractApiError,
} from '../utils/validation';

export function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (nameErr) newErrors.name = nameErr;
    if (emailErr) newErrors.email = emailErr;
    if (passErr) newErrors.password = passErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');
    try {
      // Create account
      await authApi.signup({ name: name.trim(), email: email.trim().toLowerCase(), password });
      // Auto-login after successful signup
      await login(email.trim().toLowerCase(), password);
      navigate('/tasks');
    } catch (err) {
      const fieldErrors = extractApiErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setApiError(extractApiError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-400' : 'border-gray-300'
    }`;

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h1>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError('name');
              }}
              className={inputClass('name')}
              autoComplete="name"
              maxLength={100}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError('email');
              }}
              className={inputClass('email')}
              autoComplete="email"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError('password');
              }}
              className={inputClass('password')}
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Min 8 characters, one uppercase letter, one number.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
