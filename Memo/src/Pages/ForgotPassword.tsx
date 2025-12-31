import React, { useState } from 'react';
import { Database, Mail, ArrowRight, CheckCircle, Shield, ArrowLeft } from 'lucide-react';

interface ForgotPasswordFormData {
  email: string;
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

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Basic email validation
    if (!formData.email || !formData.email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/user/forgot_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEmailSent(true);
        setMessage({ 
          type: 'success', 
          text: 'Password reset link has been sent to your email address.' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Failed to send reset email. Please try again.' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please check your connection and try again.' 
      });
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    if (formData.email) {
      setIsEmailSent(false);
      setMessage(null);
      handleSubmit({} as React.MouseEvent);
    }
  };

  const handleTryDifferentEmail = () => {
    setIsEmailSent(false);
    setMessage(null);
    setFormData({ email: '' });
  };

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
              {isEmailSent ? 'Check Your Email' : 'Forgot Password?'}
            </h2>
            <p className="text-gray-400">
              {isEmailSent 
                ? 'We\'ve sent a password reset link to your email'
                : 'No worries! Enter your email and we\'ll send you a reset link'
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
            {!isEmailSent ? (
              <div className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email address"
                      autoComplete="email"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    We'll send a password reset link to this email address.
                  </p>
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={() => handleSubmit({} as React.MouseEvent)}
                  className="w-full flex items-center justify-center space-x-2"
                  disabled={isLoading || !formData.email.trim()}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-5 h-5" />
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
                  <h3 className="text-xl font-semibold text-white">Email Sent Successfully!</h3>
                  <p className="text-gray-400 leading-relaxed">
                    We've sent a password reset link to <strong className="text-white">{formData.email}</strong>. 
                    Please check your inbox and click the link to reset your password.
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-gray-800/50 rounded-lg p-4 text-left">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">What to do next:</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-400 font-bold mt-0.5">1.</span>
                      <span>Check your email inbox (and spam folder)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-400 font-bold mt-0.5">2.</span>
                      <span>Click the password reset link in the email</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-400 font-bold mt-0.5">3.</span>
                      <span>Follow the instructions to create a new password</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400">
                    Didn't receive the email?
                  </p>
                  <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                    <Button 
                      onClick={handleResendEmail}
                      variant="secondary"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Resend Email'}
                    </Button>
                    <Button 
                      onClick={handleTryDifferentEmail}
                      variant="secondary"
                      className="flex-1"
                    >
                      Try Different Email
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex items-center justify-between text-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <a href="/login" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </a>
            
            <button 
              type="button"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Need help?
            </button>
          </div>

          {/* Additional Help */}
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-800">
              <p className="text-sm text-gray-400 mb-2">
                Having trouble? Contact our support team
              </p>
              <button className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium">
                support@memosaver.com
              </button>
            </div>
          </div>
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

export default ForgotPasswordPage;
