import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Cpu, ArrowRight, Sparkles, Check, Star, Menu, X } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
}

export default function LandingPage({ onNavigate, isAuthenticated }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Initialize Scene, Camera, and WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Generate 3D Interactive Particles (Neural Net node style)
    const particleCount = 700;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Position particles in a spherical/cloud structure
      const r = 4 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i] = r * Math.sin(phi) * Math.cos(theta);     // x
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta); // y
      positions[i + 2] = r * Math.cos(phi);                   // z

      // Premium color gradient (purple to cyan hues)
      const ratio = i / (particleCount * 3);
      colors[i] = ratio * 0.4 + 0.3; // r (red component)
      colors[i + 1] = 0.2 + ratio * 0.3; // g (green component)
      colors[i + 2] = 0.8 + ratio * 0.2; // b (blue component)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create custom particle texture using HTML Canvas for crisp anti-aliased dots
    const createCircleTexture = () => {
      const size = 32;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      return new THREE.CanvasTexture(c);
    };

    const material = new THREE.PointsMaterial({
      size: 0.12,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      map: createCircleTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // 3. Mouse Interaction listeners
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 1.5;
      targetY = (event.clientY / window.innerHeight - 0.5) * 1.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 4. Resize handling
    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // 5. Animation loop
    let animationFrameId: number;
    
    const tick = () => {
      // Smooth interpolation for mouse drag effects
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Rotate particles based on time + mouse
      particleSystem.rotation.y = Date.now() * 0.00008 + mouseX;
      particleSystem.rotation.x = Date.now() * 0.00005 + mouseY;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // 6. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-500 font-sans antialiased">
      
      {/* 3D Canvas Animated Particle Background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 dark:bg-violet-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[150px] pointer-events-none" />

      {/* NAVIGATION HEADER */}
      <header className="relative z-20 w-full border-b border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Cpu className="h-5.5 w-5.5" />
            </div>
            <span className="font-display font-black text-xl tracking-tight text-slate-900 dark:text-white">
              Smart<span className="text-violet-600 dark:text-violet-400">Flow</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <button onClick={() => scrollToSection('features')} className="hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer">Features</button>
            <button onClick={() => scrollToSection('testimonials')} className="hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer">Testimonials</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer">Pricing</button>
          </nav>

          {/* CTA & Theme Controls */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'login')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold border border-violet-500/20 dark:border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 text-violet-700 dark:text-violet-300 transition-all duration-300 cursor-pointer"
            >
              {isAuthenticated ? 'Enter Workspace' : 'Sign In'}
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="relative z-30 md:hidden w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-6 py-6 space-y-4">
          <button onClick={() => scrollToSection('features')} className="block w-full text-left font-bold text-slate-700 dark:text-slate-200 py-2">Features</button>
          <button onClick={() => scrollToSection('testimonials')} className="block w-full text-left font-bold text-slate-700 dark:text-slate-200 py-2">Testimonials</button>
          <button onClick={() => scrollToSection('pricing')} className="block w-full text-left font-bold text-slate-700 dark:text-slate-200 py-2">Pricing</button>
          <button
            onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'login')}
            className="block w-full text-center py-3 rounded-xl bg-violet-600 text-white font-bold"
          >
            {isAuthenticated ? 'Enter Workspace' : 'Get Started'}
          </button>
        </div>
      )}

      {/* HERO SECTION */}
      <main className="relative z-10 flex-grow">
        
        <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-center max-w-5xl mx-auto">
          {/* AI Banner Badge */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 dark:bg-violet-400/10 text-xs font-bold text-violet-700 dark:text-violet-300 shadow-glass-sm animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Heuristic Core Dynamic Productivity Engine
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-8xl font-black tracking-tight text-slate-950 dark:text-white mb-6 leading-none select-none">
            Work Smarter.
            <span className="block mt-2 bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Adaptive Workflows
            </span>
          </h1>

          <p className="max-w-2xl text-slate-600 dark:text-slate-400 text-lg md:text-xl mb-12 leading-relaxed">
            Move past standard static task boards. SmartFlow analyzes your output velocity, strengths, and schedule preferences to recommend next-level challenges.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'login')}
              className="group px-8 py-4 rounded-xl font-extrabold bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30 hover:brightness-105 active:scale-95 transition-all duration-300 flex items-center gap-2 justify-center cursor-pointer"
            >
              Start Free Workspace
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="px-8 py-4 rounded-xl font-bold border border-slate-300 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 backdrop-blur-md transition-all cursor-pointer"
            >
              Explore Features
            </button>
          </div>
        </section>

        {/* FEATURES SHOWCASE */}
        <section id="features" className="py-24 border-t border-slate-200/50 dark:border-white/5 bg-white/20 dark:bg-slate-950/20 backdrop-blur-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                Designed for Elite Performers
              </h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                No more CRUD databases. Master your sprint boards with responsive UI blocks and automated suggestion models.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 hover:border-violet-500/30 transition-all duration-500 group">
                <div className="h-12 w-12 rounded-xl bg-violet-600/10 dark:bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-6 font-bold">
                  01
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                  Adaptive AI Progression
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Completing beginner coding tasks automatically unlocks intermediate database models and API projects. Never repeat stagnant suggestions.
                </p>
              </div>

              <div className="p-8 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 hover:border-pink-500/30 transition-all duration-500 group">
                <div className="h-12 w-12 rounded-xl bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-6 font-bold">
                  02
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">
                  Comprehensive Analytics
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Unlock radial scores for productivity, consistency, focus, and growth. Monitor your streak count and map completed tasks to a daily contribution heatmap.
                </p>
              </div>

              <div className="p-8 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 hover:border-cyan-500/30 transition-all duration-500 group">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-6 font-bold">
                  03
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                  SaaS Security & Tools
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Utilize JWT-protected profiles, verified recovery OTP codes, onboarding walkthrough guides, shortcut keys, and task list PDF/CSV printing exports.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" className="py-24 border-t border-slate-200/50 dark:border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                Trusted by Top Developers
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                See how creators optimize their sprints and build momentum.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex flex-col justify-between">
                <div className="flex gap-1 mb-4 text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4.5 w-4.5 fill-current" />)}
                </div>
                <p className="text-sm italic text-slate-600 dark:text-slate-350 leading-relaxed mb-6">
                  "SmartFlow completely altered my workflow. The recommendation engine correctly identified that I do coding in the evening, and suggested intermediate API projects right when my productivity peaked."
                </p>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Alexander Cole</h4>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Principal Engineer, Stripe</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex flex-col justify-between">
                <div className="flex gap-1 mb-4 text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4.5 w-4.5 fill-current" />)}
                </div>
                <p className="text-sm italic text-slate-600 dark:text-slate-355 leading-relaxed mb-6">
                  "The interface is gorgeous and extremely quick. It looks and behaves like an investor-ready startup tool. The GitHub-style contribution heatmap keeps me highly motivated."
                </p>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Nadia Bennett</h4>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Product Manager, Linear</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex flex-col justify-between">
                <div className="flex gap-1 mb-4 text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4.5 w-4.5 fill-current" />)}
                </div>
                <p className="text-sm italic text-slate-600 dark:text-slate-355 leading-relaxed mb-6">
                  "The forgot password recovery flow with JWT and dynamic mock-db fallback made this extremely easy to integrate. A truly premium web app application experience."
                </p>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tanmaya Sharma</h4>
                  <span className="text-xs text-slate-400 dark:text-slate-500">CTO, SmartLogic Inc</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-24 border-t border-slate-200/50 dark:border-white/5 bg-white/20 dark:bg-slate-950/20 backdrop-blur-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                Fair, Transparent Pricing
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                Choose the plan that fits your growth pace. Cancel anytime.
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-2.5 p-1 rounded-xl bg-slate-200/50 dark:bg-white/5 border border-slate-200/10">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    billingPeriod === 'monthly' ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    billingPeriod === 'annual' ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Annual
                  <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-[9px] text-violet-600 dark:text-violet-400 font-extrabold uppercase">Save 20%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
              
              {/* Starter */}
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Starter</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold font-display">$0</span>
                    <span className="text-xs text-slate-400">/ forever</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Ideal for getting started with task tracking and basic categories.</p>
                  <ul className="space-y-3.5 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> Basic Task Board</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> Category Counts Recommendation</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> Local database storage</li>
                  </ul>
                </div>
                <button
                  onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'login')}
                  className="w-full mt-8 py-3.5 rounded-xl font-bold border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition text-xs cursor-pointer"
                >
                  Get Started
                </button>
              </div>

              {/* Pro (Highlighted) */}
              <div className="p-8 rounded-2xl border border-violet-500/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col justify-between relative shadow-xl shadow-violet-500/5 scale-105">
                <div className="absolute top-0 right-8 -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-[9px] text-white font-extrabold uppercase tracking-wide">
                  Most Popular
                </div>
                <div>
                  <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">Professional</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold font-display">
                      {billingPeriod === 'annual' ? '$10' : '$12'}
                    </span>
                    <span className="text-xs text-slate-400">/ user / month</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Best for active developers and teams maximizing weekly growth scores.</p>
                  <ul className="space-y-3.5 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> Dynamic Heuristic AI Engine</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> Peak Hours working hours predictions</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> Advanced metrics scoring dials</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> Export tasks directly to PDF/CSV</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> Theme customization saved locally</li>
                  </ul>
                </div>
                <button
                  onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'login')}
                  className="w-full mt-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow hover:brightness-105 transition text-xs cursor-pointer"
                >
                  Start Professional Sprint
                </button>
              </div>

              {/* Enterprise */}
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Enterprise</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold font-display">
                      {billingPeriod === 'annual' ? '$39' : '$49'}
                    </span>
                    <span className="text-xs text-slate-400">/ user / month</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">For large scale production organizations requiring premium analytics.</p>
                  <ul className="space-y-3.5 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> Custom progressive workflows paths</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> Pluggable SMTP email recovery integrations</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> MongoDB Atlas custom clustering</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-500 flex-shrink-0" /> 24/7 dedicated support representative</li>
                  </ul>
                </div>
                <button
                  onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'login')}
                  className="w-full mt-8 py-3.5 rounded-xl font-bold border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition text-xs cursor-pointer"
                >
                  Contact Sales
                </button>
              </div>

            </div>

          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="p-12 md:p-20 rounded-3xl border border-violet-500/20 bg-gradient-to-tr from-violet-600/10 to-cyan-500/10 relative overflow-hidden">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(139,92,246,0.06)_0%,transparent_60%)] pointer-events-none" />
            <h2 className="font-display text-3xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              Ready to Upgrade Your <br />Focus Performance?
            </h2>
            <p className="max-w-xl text-slate-500 dark:text-slate-400 text-sm md:text-base mx-auto mb-10 leading-relaxed">
              Unlock the dynamic heuristic recommendation engine, complete tasks faster, and visualize your streaks using professional dashboards.
            </p>
            <button
              onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'login')}
              className="px-8 py-4 rounded-xl font-extrabold bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-xl hover:brightness-105 transition-all cursor-pointer"
            >
              Get Started Instantly
            </button>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 py-16 bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
          
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow">
                <Cpu className="h-4 w-4" />
              </div>
              <span className="font-display font-black text-lg text-slate-900 dark:text-white">SmartFlow</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs">
              Transforming productivity dashboards into intelligent heuristic planning boards. Optimize your habits and master your metrics.
            </p>
            <span className="text-xs text-slate-400 dark:text-slate-500 block">
              &copy; {new Date().getFullYear()} SmartFlow Inc. All rights reserved.
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <li><button onClick={() => scrollToSection('features')} className="hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer">AI Heuristics</button></li>
              <li><button onClick={() => scrollToSection('features')} className="hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer">Sprint Boards</button></li>
              <li><button onClick={() => scrollToSection('pricing')} className="hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer">Pricing Tiers</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <li><button onClick={() => scrollToSection('testimonials')} className="hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer">Testimonials</button></li>
              <li><a href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Press Kit</a></li>
              <li><a href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Terms of Service</a></li>
              <li><a href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Security Audit</a></li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
}
