import React from 'react';
import { Shield, Folder, Smartphone, Share2, Lock, Database, Globe, Star, Users, Zap, CheckCircle, Play, ArrowRight, Download, Settings, Eye, Clock, Award, TrendingUp, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import useUserStore from '@/ZustandStore/UserStore';
import axios from 'axios';
import toast from 'react-hot-toast';

interface TestimonialProps {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
}

const TestimonialCard: React.FC<TestimonialProps> = ({ name, role, company, content, rating }) => (
  <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
    <div className="flex mb-4">
      {[...Array(rating)].map((_, i) => (
        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
      ))}
    </div>
    <p className="text-gray-300 mb-6 text-lg leading-relaxed">"{content}"</p>
    <div>
      <h4 className="text-white font-semibold text-lg">{name}</h4>
      <p className="text-gray-400">{role} at {company}</p>
    </div>
  </div>
);

interface PricingPlanProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

const PricingCard: React.FC<PricingPlanProps> = ({ name, price, period, features, popular = false }) => (
  <div className={`bg-gray-900/50 p-8 rounded-2xl border backdrop-blur-sm relative ${popular ? 'border-purple-500 scale-105' : 'border-gray-800'}`}>
    {popular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
          Most Popular
        </span>
      </div>
    )}
    <div className="text-center mb-8">
      <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
      <div className="text-4xl font-black text-white mb-2">${price}</div>
      <p className="text-gray-400">per {period}</p>
    </div>
    <ul className="space-y-4 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center text-gray-300">
          <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
          {feature}
        </li>
      ))}
    </ul>
    <Button className="w-full" variant={popular ? 'primary' : 'secondary'}>
      Choose Plan
    </Button>
  </div>
);

interface StatsProps {
  number: string;
  label: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatsProps> = ({ number, label, icon }) => (
  <div className="text-center">
    <div className="flex justify-center mb-4">
      <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl">
        {icon}
      </div>
    </div>
    <div className="text-4xl font-bold text-white mb-2">{number}</div>
    <div className="text-gray-400 text-lg">{label}</div>
  </div>
);

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm">
    <div className="flex items-center mb-4">
      <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
    </div>
    <p className="text-gray-300 leading-relaxed">{description}</p>
  </div>
);

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '' 
}) => {
  const baseClasses = "px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-base sm:px-8 sm:py-4 sm:text-lg";
  const primaryClasses = "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/25";
  const secondaryClasses = "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 hover:border-gray-600";
  
  return (
    <button 
      className={`${baseClasses} ${variant === 'primary' ? primaryClasses : secondaryClasses} ${className}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
};

// Header Component with Responsive Navbar
const Header: React.FC = () => {
  const { isAuthenticated,resetUserState } = useUserStore(); // Get authentication state and logout function from Zustand
  const logout=async()=>{

     try {
    const res = await axios.get("${import.meta.env.VITE_BASE_URL}/user/logout", {
      withCredentials: true,
    });
    console.log(res.data.message);
    toast.success(res.data.message)// success message
    resetUserState()
  } catch (error:any) {
    if (error.response) {
      console.error("Logout failed:", error.response.data.message);
     toast.error("logout failed") 
    } else {
    toast.error("logout failed") 
      console.error("Logout error:", error.message);
    }
  } 

  }
  return (
    <header className="pt-8 pb-4 md:sticky top-0 z-20 bg-black/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              MemoSaver
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {isAuthenticated ? (
              <>
                <Link to={'/memo'} className="w-full sm:w-auto">
                  <Button variant="primary" className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base sm:px-6 sm:py-3">
                    Memo
                  </Button>
                </Link>
                <Button 
                  variant="secondary" 
                  className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base sm:px-6 sm:py-3 flex items-center space-x-2"
                  onClick={logout}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to={'/login'} className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base sm:px-6 sm:py-3">
                    Sign In
                  </Button>
                </Link>
                <Link to={'/signup'} className="w-full sm:w-auto">
                  <Button variant="primary" className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base sm:px-6 sm:py-3">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Main Content Component
const MainContent: React.FC = () => {
  const features: FeatureCardProps[] = [
    {
      icon: <Shield className="w-6 h-6 text-purple-400" />,
      title: "End-to-End Encryption",
      description: "Your data is encrypted with military-grade security using AES-256 encryption. Generate your own private/public key pairs for ultimate privacy and control."
    },
    {
      icon: <Folder className="w-6 h-6 text-blue-400" />,
      title: "Smart Organization",
      description: "Create unlimited custom folders to organize your links, text notes, detailed summaries, and high-resolution images. Keep everything perfectly structured."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-green-400" />,
      title: "Multi-Device Sync",
      description: "Access your encrypted memos seamlessly across all your devices - desktop, mobile, and tablet. Your data stays synchronized while remaining secure."
    },
    {
      icon: <Share2 className="w-6 h-6 text-pink-400" />,
      title: "Secure Sharing",
      description: "Share your memos securely with trusted contacts using end-to-end encryption. Control who can access your information with granular permissions."
    }
  ];

  const testimonials: TestimonialProps[] = [
    {
      name: "Sarah Johnson",
      role: "Security Engineer",
      company: "TechCorp",
      content: "MemoSaver has revolutionized how I manage sensitive information. The encryption is top-notch and the interface is incredibly intuitive.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Product Manager",
      company: "StartupXYZ",
      content: "Finally, a memo app that takes privacy seriously. I can store everything from API keys to personal notes without worrying about data breaches.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Freelance Consultant",
      company: "Independent",
      content: "The multi-device sync is flawless. I can access my encrypted notes anywhere, and the folder organization keeps everything perfectly sorted.",
      rating: 5
    }
  ];

const downloadApp = async (id:String) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}/user/download/${id}`, {
      method: "GET",
    });

    if (!res.ok) throw new Error("Download failed");

    // Convert response to blob
    const blob = await res.blob();

    // Create temporary link to trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}.exe`; // or .apk / .ipa depending on the platform
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
  toast.error("Comming soon") 
    console.error("Error during Download:", err);
  }
};
  const stats: StatsProps[] = [
    {
      number: "50K+",
      label: "Active Users",
      icon: <Users className="w-8 h-8 text-purple-400" />
    },
    {
      number: "99.9%",
      label: "Uptime",
      icon: <TrendingUp className="w-8 h-8 text-green-400" />
    },
    {
      number: "256-bit",
      label: "AES Encryption",
      icon: <Shield className="w-8 h-8 text-blue-400" />
    },
    {
      number: "24/7",
      label: "Support",
      icon: <Clock className="w-8 h-8 text-pink-400" />
    }
  ];


  const handleLearnMore = (): void => {
    console.log('Navigate to learn more');
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

      <div className="relative z-10">
        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent leading-tight">
                Welcome to MemoSaver
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Your personal memo management app with military-grade encryption, 
                seamless synchronization, and intelligent organization across all devices.
              </p>

              {/* Illustration */}
              <div className="mb-16 flex justify-center">
                <div className="relative">
                  <div className="flex items-center justify-center space-x-4 p-8 bg-gray-900/30 rounded-2xl border border-gray-800 backdrop-blur-sm">
                    <div className="p-4 bg-purple-500/20 rounded-xl animate-bounce" style={{ animationDelay: '0s' }}>
                      <Lock className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="p-4 bg-blue-500/20 rounded-xl animate-bounce" style={{ animationDelay: '0.2s' }}>
                      <Folder className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="p-4 bg-green-500/20 rounded-xl animate-bounce" style={{ animationDelay: '0.4s' }}>
                      <Globe className="w-8 h-8 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              <Link to={'/memo'}>
               <Button  className="text-lg px-10 py-5">
                  Get Started Now
                </Button>

              </Link>
                <Button variant="secondary" onClick={handleLearnMore} className="text-lg px-10 py-5">
                  Learn More
                </Button>
              </div>
            </div>

            {/* Features Section */}
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-4xl font-bold mb-4">Why Choose MemoSaver?</h2>
              <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
                Built with privacy and security at its core, designed for modern productivity.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {features.map((feature, index) => (
                  <div
                    key={feature.title}
                    className="animate-fade-in"
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <FeatureCard {...feature} />
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <h2 className="text-3xl font-bold mb-12 text-center">Trusted by Thousands</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <div key={stat.label} className="animate-fade-in" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
                    <StatCard {...stat} />
                  </div>
                ))}
              </div>
            </div>

            {/* How it Works Section */}
            <div className="mt-20 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Sign Up & Generate Keys</h3>
                  <p className="text-gray-400">Create your account and generate your unique encryption keys for maximum security.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Organize Your Data</h3>
                  <p className="text-gray-400">Create folders and start adding your links, notes, images, and summaries.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Sync Across Devices</h3>
                  <p className="text-gray-400">Access your encrypted data seamlessly on all your devices with real-time sync.</p>
                </div>
              </div>
            </div>

            {/* Product Demo Section */}
            <div className="mt-20 animate-fade-in" style={{ animationDelay: '0.7s' }}>
              <h2 className="text-3xl font-bold mb-12 text-center">See It In Action</h2>
              <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800 backdrop-blur-sm max-w-4xl mx-auto">
                <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl flex items-center justify-center border border-gray-700">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Watch Demo Video</h3>
                    <p className="text-gray-400">See how MemoSaver keeps your data secure and organized</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonials Section */}
            <div className="mt-20 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <h2 className="text-3xl font-bold mb-12 text-center">What Our Users Say</h2>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {testimonials.map((testimonial, index) => (
                  <div key={testimonial.name} className="animate-fade-in" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
                    <TestimonialCard {...testimonial} />
                  </div>
                ))}
              </div>
            </div>


            {/* Security & Trust Section */}
            <div className="mt-20 animate-fade-in" style={{ animationDelay: '1s' }}>
              <h2 className="text-3xl font-bold mb-12 text-center">Security You Can Trust</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 mb-4">
                    <Shield className="w-8 h-8 text-purple-400 mx-auto" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">AES-256 Encryption</h3>
                  <p className="text-gray-400 text-sm">Military-grade encryption standard</p>
                </div>
                <div className="text-center">
                  <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 mb-4">
                    <Eye className="w-8 h-8 text-blue-400 mx-auto" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Zero-Knowledge</h3>
                  <p className="text-gray-400 text-sm">We can't see your data, ever</p>
                </div>
                <div className="text-center">
                  <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 mb-4">
                    <Award className="w-8 h-8 text-green-400 mx-auto" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">SOC 2 Compliant</h3>
                  <p className="text-gray-400 text-sm">Audited security standards</p>
                </div>
                <div className="text-center">
                  <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 mb-4">
                    <Settings className="w-8 h-8 text-pink-400 mx-auto" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Open Source</h3>
                  <p className="text-gray-400 text-sm">Transparent and auditable</p>
                </div>
              </div>
            </div>

            {/* Download Section */}
             <div className="mt-20 animate-fade-in" style={{ animationDelay: "1.1s" }}>
      <h2 className="text-3xl font-bold mb-12 text-center">
        Available Everywhere
      </h2>
      <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
        <Button
          variant="secondary"
          className="flex items-center space-x-2"
          onClick={() => downloadApp("windows")}
        >
          <Download className="w-5 h-5" />
          <span>Download for Windows</span>
        </Button>

        <Button
          variant="secondary"
          className="flex items-center space-x-2"
          onClick={() => downloadApp("ios")}
        >
          <Smartphone className="w-5 h-5" />
          <span>Get iOS App</span>
        </Button>

        <Button
          variant="secondary"
          className="flex items-center space-x-2"
          onClick={() => downloadApp("android")}
        >
          <Smartphone className="w-5 h-5" />
          <span>Get Android App</span>
        </Button>
      </div>
    </div>
            {/* Final CTA */}
            <div className="mt-32 animate-fade-in" style={{ animationDelay: '1.2s' }}>
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-3xl p-20 border-2 border-gray-800">
                <h3 className="text-5xl font-bold mb-8">Ready to secure your digital life?</h3>
                <p className="text-gray-300 text-2xl mb-12 max-w-4xl mx-auto leading-relaxed">
                  Join thousands of security-conscious users who trust MemoSaver to keep their most important information safe, organized, and accessible across all their devices.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link to={'/memo'}>
                  <Button className="text-2xl px-20 py-8 flex items-center space-x-3">
                    <span>Start Your Secure Journey</span>
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </Link>
                                  <Button variant="secondary" className="text-xl px-16 py-8">
                    Contact Sales
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-12 border-t-2 border-gray-800 mt-32">
          <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4 mb-6 md:mb-0">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <span className="text-2xl font-bold">MemoSaver</span>
              </div>
              <p className="text-gray-500 text-lg">
                © {new Date().getFullYear()} MemoSaver. Secure by design, trusted by professionals.
              </p>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Main Landing Component
const Landing: React.FC = () => {
  return (
    <>
      <Header />
      <MainContent />
    </>
  );
};

export default Landing;
