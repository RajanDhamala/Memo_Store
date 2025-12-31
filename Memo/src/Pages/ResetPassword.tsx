import React, { useState, useEffect } from 'react';
import { Database, Lock, Eye, EyeOff, CheckCircle, Shield, ArrowLeft, AlertCircle } from 'lucide-react';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '',
  disabled = false
}) => {
  const baseClasses = "px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";
  const primaryClasses = "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/25";
  const secondaryClasses = "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 hover:border-gray-600";
  
  return (
    <button 
      className={`${baseClasses} ${variant === 'primary' ? primaryClasses : secondaryClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const ResetPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: ''
  });

  // Extract token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (!tokenParam) {
      setTokenValid(false);
      setMessage({ 
        type: 'error', 
        text: 'Invalid reset link. Please request a new password reset.' 
      });
    } else {
      setToken(tokenParam);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validation
    if (!token) {
      setMessage({ type: 'error', text: 'Invalid reset token.' });
      setIsLoading(false);
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setIsLoading(false);
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setMessage({ type: 'error', text: passwordError });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage({ 
          type: 'success', 
          text: 'Password reset successful! You can now login with your new password.' 
        });
        // Clear form
        setFormData({ password: '', confirmPassword: '' });
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Failed to reset password. Please try again or request a new reset link.' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please check your connection and try again.' 
      });
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) strength++;

    if (strength <= 1) return { strength: 1, label: 'Very Weak', color: 'bg-red-500' };
    if (strength === 2) return { strength: 2, label: 'Weak', color: 'bg-orange-500' };
    if (strength === 3) return { strength: 3, label: 'Fair', color: 'bg-yellow-500' };
    if (strength === 4) return { strength: 4, label: 'Good', color: 'bg-blue-500' };
    return { strength: 5, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Invalid Reset Link</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            This password reset link is invalid or has expired. Please request a new password reset.
          </p>
          <Button onClick={() => window.location.href = '/forgot-password'}>
            Request New Reset Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Header */}
          <div className="text-center animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
                <Database className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
              MemoSaver
            </h1>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isSuccess ? 'Password Reset Complete' : 'Set New Password'}
            </h2>
            <p className="text-gray-400">
              {isSuccess 
                ? 'Your password has been successfully updated'
                : 'Please enter your new password below'
              }
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg border flex items-center space-x-3 animate-fade-in ${
              message.type === 'success' 
                ? 'bg-green-900/20 border-green-700 text-green-300' 
                : 'bg-red-900/20 border-red-700 text-red-300'
            }`}>
              {message.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
              {message.type === 'error' && <Shield className="w-5 h-5 flex-shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {!isSuccess ? (
              <div className="space-y-6">
                {/* New Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-white" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Password Strength</span>
                        <span className={`font-medium ${
                          passwordStrength.strength <= 2 ? 'text-red-400' :
                          passwordStrength.strength <= 3 ? 'text-yellow-400' :
                          passwordStrength.strength === 4 ? 'text-blue-400' :
                          'text-green-400'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-white" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Password Requirements:</h4>
                  <ul className="space-y-1 text-sm text-gray-400">
                    <li className={`flex items-center space-x-2 ${formData.password.length >= 8 ? 'text-green-400' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <span>At least 8 characters</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/(?=.*[a-z])/.test(formData.password) ? 'text-green-400' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${/(?=.*[a-z])/.test(formData.password) ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <span>One lowercase letter</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/(?=.*[A-Z])/.test(formData.password) ? 'text-green-400' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${/(?=.*[A-Z])/.test(formData.password) ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <span>One uppercase letter</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/(?=.*\d)/.test(formData.password) ? 'text-green-400' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${/(?=.*\d)/.test(formData.password) ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <span>One number</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password) ? 'text-green-400' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password) ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <span>One special character</span>
                    </li>
                  </ul>
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={() => handleSubmit({} as React.MouseEvent)}
                  className="w-full flex items-center justify-center space-x-2"
                  disabled={isLoading || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Reset Password</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                {/* Success Message */}
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white">Password Reset Complete!</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Your password has been successfully updated. You can now login to your account with your new password.
                  </p>
                </div>

                {/* Login Button */}
                <Button onClick={() => window.location.href = '/login'} className="w-full">
                  Go to Login
                </Button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          {!isSuccess && (
            <div className="flex items-center justify-center text-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <a href="/login" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </a>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;
