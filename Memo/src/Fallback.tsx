import { useState, useEffect } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
}

export default function Fallback(): JSX.Element {
  const [glitch, setGlitch] = useState<boolean>(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Create floating particles
    const newParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 2 + 1,
    }));
    setParticles(newParticles);

    // Glitch effect interval
    const glitchInterval: NodeJS.Timeout = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 3000);

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute bg-purple-500 rounded-full opacity-20 animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.id * 0.2}s`,
            animationDuration: `${particle.speed}s`,
          }}
        />
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
      
      {/* Main content */}
      <div className="text-center z-10 px-8">
        {/* 404 Number with glitch effect */}
        <div className="relative">
          <h1 
            className={`text-8xl md:text-9xl font-black mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent transform transition-all duration-300 ${
              glitch ? 'animate-pulse scale-105' : 'scale-100'
            }`}
            style={{
              textShadow: glitch ? '2px 2px 0 #ff00ff, -2px -2px 0 #00ffff' : 'none',
              filter: glitch ? 'blur(1px)' : 'none',
            }}
          >
            404
          </h1>
          {glitch && (
            <h1 className="absolute top-0 left-0 right-0 text-8xl md:text-9xl font-black text-red-500 opacity-30 transform translate-x-1 -translate-y-1">
              404
            </h1>
          )}
        </div>

        {/* Error message */}
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-300 text-lg max-w-md mx-auto mb-8">
            Looks like you've wandered into the digital void. The page you're looking for doesn't exist.
          </p>
        </div>

        {/* Animated button */}
        <button 
          onClick={() => window.history.back()}
          className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:from-purple-700 hover:to-blue-700 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
          type="button"
        >
          <span className="relative z-10">Go Back</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
        </button>

        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 border-2 border-purple-500 rounded-full animate-spin opacity-20" />
        <div className="absolute bottom-1/4 right-1/4 w-12 h-12 border-2 border-blue-500 rounded-lg animate-bounce opacity-20" />
        <div className="absolute top-1/2 left-8 w-8 h-8 bg-pink-500 rounded-full animate-ping opacity-20" />
        <div className="absolute bottom-8 right-8 w-6 h-6 bg-cyan-500 rounded-full animate-pulse opacity-20" />
      </div>

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
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
}