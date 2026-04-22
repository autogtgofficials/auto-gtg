import React, { useState, useEffect, useRef } from 'react';
import { Send, Check, Phone, Settings, MapPin, Wrench, Clock, ArrowRight, Star, AlertTriangle, Users, TrendingUp, CheckCircle2, ChevronRight, Menu, X, ShieldCheck, Search, Package, FileText, Upload, UserPlus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { auth, db, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { SERVICES, INITIAL_JOBS, PARTNERS, PRODUCTS, Job, Service, ServiceType, Partner, MarketplaceProduct, UserRole, UserProfile } from './types';

// --- COMPONENTS ---

const Navbar = ({ activeTab, setActiveTab, userRole, onLogout }: { activeTab: string, setActiveTab: (t: string) => void, userRole: UserRole | null, onLogout: () => void }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = {
    admin: [
      { id: 'admin', label: 'Admin Monitor' },
      { id: 'customer', label: 'Customer View' },
      { id: 'mechanic', label: 'Partner Portal' }
    ],
    customer: [
      { id: 'customer', label: 'Auto Service Terminal' }
    ],
    partner: [
      { id: 'mechanic', label: 'Terminal Dashboard' }
    ],
    none: [
      { id: 'customer', label: 'Service Booking' },
      { id: 'onboarding', label: 'Partner Onboarding' }
    ]
  };

  const currentItems = userRole === 'admin' ? navItems.admin : 
                       userRole === 'customer' ? navItems.customer : 
                       userRole === 'partner' ? navItems.partner : navItems.none;

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-surface-3 bg-white fixed top-0 left-0 right-0 z-50 shadow-sleek">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-indigo cursor-pointer" onClick={() => setActiveTab('home')}>
            <Wrench className="text-white w-5 h-5" />
          </div>
          <div className="cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="font-display font-bold text-lg leading-tight text-slate-800">Auto GTG</div>
            <div className="text-[10px] text-text-light uppercase tracking-widest font-semibold">Ubaumya Automobiles · Srinagar</div>
          </div>
        </div>
        
        <div className="hidden md:flex gap-1 bg-surface-2 p-1 rounded-2xl border border-surface-3">
          {currentItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "px-6 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 capitalize",
                activeTab === item.id 
                  ? "bg-primary text-white shadow-sleek ring-1 ring-primary/10" 
                  : "text-text-muted hover:text-text-main hover:bg-surface-3"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-text-muted">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
             <div className="w-2 h-2 bg-green-whatsapp rounded-full animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Network</span>
          </div>
          {userRole ? (
            <button onClick={onLogout} className="px-4 py-2 bg-slate-100 font-bold uppercase rounded-xl hover:bg-slate-200 transition-all tracking-widest text-[9px]">Logout</button>
          ) : (
            <button onClick={() => setActiveTab('login')} className="px-4 py-2 bg-primary text-white font-bold uppercase rounded-xl hover:translate-y-[-1px] transition-all tracking-widest shadow-sleek text-[9px]">Sign In</button>
          )}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-surface-2 rounded-lg transition-colors border border-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-text-main" /> : <Menu className="w-5 h-5 text-text-main" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <div className="text-[10px] font-black text-text-light uppercase tracking-[0.2em] mb-2 px-2">Navigation Node</div>
              {currentItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={cn(
                    "w-full text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all border",
                    activeTab === item.id 
                      ? "bg-primary/5 text-primary border-primary/20" 
                      : "text-slate-600 border-slate-100 hover:bg-slate-50"
                  )}
                >
                  {item.label}
                </button>
              ))}
              <div className="mt-8 pt-8 border-t border-slate-100">
                 {userRole ? (
                   <button 
                    onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                    className="w-full py-4 text-red-500 font-bold text-xs uppercase tracking-widest bg-red-50 rounded-2xl"
                   >
                     Disconnect Terminal
                   </button>
                 ) : (
                   <button 
                    onClick={() => { setActiveTab('login'); setMobileMenuOpen(false); }}
                    className="w-full py-4 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-indigo"
                   >
                     Access Core Terminal
                   </button>
                 )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface ChatBubbleProps {
  key?: React.Key;
  from: 'bot' | 'user' | 'system';
  text: string;
  choices?: string[];
  onChoice?: (c: string) => void;
}

const ChatBubble = ({ from, text, choices, onChoice }: ChatBubbleProps) => {
  if (from === 'system') {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-slate-100 border border-slate-200 px-4 py-1 rounded-full text-[11px] text-slate-500 font-bold uppercase tracking-wider">
          {text}
        </div>
      </div>
    );
  }

  const isBot = from === 'bot';
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed mb-3 relative shadow-sm",
        isBot 
          ? "bg-white border border-slate-200 self-start rounded-tl-none text-slate-700 shadow-sm" 
          : "bg-primary self-end rounded-tr-none text-white shadow-indigo"
      )}
    >
      <div className="whitespace-pre-wrap font-medium">{text}</div>
      <div className={cn(
        "text-[10px] mt-2 flex justify-end items-center gap-1",
        isBot ? "text-slate-400" : "text-white/60"
      )}>
        {timestamp}
        {!isBot && <Check className="w-3 h-3" />}
      </div>

      {isBot && choices && choices.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {choices.map((choice) => (
            <button
              key={choice}
              onClick={() => onChoice?.(choice)}
              className="w-full text-left px-4 py-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-200 transition-all text-primary text-xs font-bold shadow-sm"
            >
              {choice}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const LoginScreen = ({ onAuthSuccess, initialMode = 'login' }: { onAuthSuccess: (role: UserRole) => void, initialMode?: 'login' | 'register' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (mode === 'admin') {
        if (adminKey === 'ubai@123') {
          onAuthSuccess('admin');
        } else {
          setError('Invalid Admin Protocol Key');
        }
      } else if (mode === 'login') {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const docSnap = await getDoc(doc(db, 'users', cred.user.uid));
        if (docSnap.exists()) {
          onAuthSuccess(docSnap.data().role as UserRole);
        } else {
          onAuthSuccess('customer');
        }
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const userData = {
          uid: cred.user.uid,
          email,
          displayName: name,
          role,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', cred.user.uid), userData);
        
        if (role === 'partner') {
          onAuthSuccess('partner');
          // The App component will handle navigation to 'onboarding'
        } else {
          onAuthSuccess(role);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sleek"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {mode === 'login' ? 'Welcome Back' : mode === 'admin' ? 'Admin Protocol' : 'Create Identity'}
          </h2>
          <p className="text-xs text-text-muted mt-2 font-medium">Auto GTG Secure Identification Node</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'admin' ? (
            <div>
              <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1 mb-1.5 block">Master Admin Key</label>
              <input 
                type="password" 
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all font-mono"
                placeholder="••••••••"
                required
              />
            </div>
          ) : (
            <>
              {mode === 'register' && (
                <div>
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1 mb-1.5 block">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-primary transition-all font-medium"
                    placeholder="Ex: Tariq Ahmed"
                    required
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1 mb-1.5 block">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-primary transition-all font-medium"
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1 mb-1.5 block">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-primary transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1 mb-1.5 block">Access Level</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setRole('customer')}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase border transition-all",
                        role === 'customer' ? "bg-primary text-white border-primary shadow-indigo" : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                      )}
                    >Customer</button>
                    <button 
                      type="button"
                      onClick={() => setRole('partner')}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase border transition-all",
                        role === 'partner' ? "bg-primary text-white border-primary shadow-indigo" : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                      )}
                    >Partner</button>
                  </div>
                </div>
              )}
            </>
          )}

          {error && <div className="text-[10px] font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 uppercase tracking-widest">{error}</div>}

          <button 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold text-xs py-4 rounded-2xl shadow-sleek uppercase tracking-[0.2em] mt-6 hover:translate-y-[-2px] transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In Terminal' : mode === 'admin' ? 'Bypass to Infrastructure' : 'Initialize Profile'}
          </button>
        </form>

        <div className="text-center mt-8 pt-8 border-t border-slate-100 flex flex-col gap-4">
          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-[10px] font-bold text-text-muted hover:text-primary uppercase tracking-widest transition-all"
          >
            {mode === 'login' ? "New identity? Create account" : mode === 'admin' ? "Back to Login" : "Existing terminal? Login here"}
          </button>
          
          {mode !== 'admin' && (
            <button 
              onClick={() => setMode('admin')}
              className="text-[9px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-[0.3em] transition-all"
            >
              Master Protocol Access
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const WhatsAppPanel = ({ mode, setMode, customerData }: { mode: ServiceType, setMode: (m: ServiceType) => void, customerData?: any }) => {
  const [messages, setMessages] = useState<{from: 'bot' | 'user' | 'system', text: string, choices?: string[]}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const flows = {
    scheduled: [
      { from: 'bot', text: `Assalamu alaikum, ${customerData?.name || 'Partner'}! Welcome to Auto GTG 🟢\n\nHow can I help you with your ${customerData?.vehicle || 'asset'} today?`, choices: ['Book a service', 'Track my booking', 'Contact support'] },
      { trigger: 'Book a service', from: 'bot', text: 'Which service do you need?', choices: ['Periodic service (oil, filters, brakes)', 'Battery check', 'Tyre inspection'] },
      { trigger: 'Periodic service (oil, filters, brakes)', from: 'bot', text: 'Please share your area in Srinagar so we can find the nearest verified partner.', choices: ['Lal Chowk', 'Rajbagh', 'Hyderpora', 'Other area'] },
      { trigger: 'Rajbagh', from: 'bot', text: 'When do you want the service done?', choices: ['Today', 'Tomorrow', 'This week'] },
      { trigger: 'Tomorrow', from: 'bot', text: 'Your booking summary:\n\nService: Car periodic service\nLocation: Rajbagh, Srinagar\nDate: Tomorrow\nPartner: Hassan Motors\nCost: ₹1,200\n\nConfirm?', choices: ['Yes, confirm', 'Change details'] },
      { trigger: 'Yes, confirm', from: 'bot', text: 'Booking confirmed! Reference: #GTG-2248\n\nHassan Motors will arrive by 10:00 AM tomorrow. You should receive a WhatsApp notification shortly.', choices: ['Open WhatsApp 🟢', 'Done'] },
      { trigger: 'Open WhatsApp 🟢', from: 'bot', text: 'Connecting to WhatsApp terminal...' },
      { trigger: 'Done', from: 'bot', text: 'Thank you for choosing Auto GTG. Your infrastructure is secure.', choices: ['Book another'] },
    ],
    rsa: [
      { from: 'bot', text: 'Auto GTG Emergency Line 🚨\n\nDescribe your issue:', choices: ['Tyre puncture', 'Battery dead / jump-start', 'Car overheating', 'Towing needed'] },
      { trigger: 'Tyre puncture', from: 'bot', text: 'Understood. Where are you right now?\n\nShare your location or type your area:', choices: ['Lal Chowk', 'Sonwar', 'Dal Gate', 'Other'] },
      { trigger: 'Sonwar', from: 'bot', text: 'Vehicle type and contact number?', choices: ['Car', 'Bike'] },
      { trigger: 'Car', from: 'bot', text: 'Confirming emergency dispatch request. This will match you with the nearest active node.', choices: ['Yes, confirm', 'Cancel'] },
      { trigger: 'Yes, confirm', from: 'system', text: 'Matching nearest RSA partner...' },
      { from: 'bot', text: 'Partner found!\n\nAhmad\'s Garage · 1.2 km away\nETA: 12 minutes\n\nPlease finalize via WhatsApp for live tracking.' },
      { from: 'bot', text: 'Ahmad is on the way.\n\nJob ID: #RSA-0045\nETA: 10 minutes now\n\nAre you safe?', choices: ['Open WhatsApp 🟢', 'Yes, I\'m fine'] },
    ]
  };

  const [flowIndex, setFlowIndex] = useState(0);

  useEffect(() => {
    setMessages([{ from: 'bot', text: flows[mode][0].text, choices: flows[mode][0].choices }]);
    setFlowIndex(1);
  }, [mode]);

  const [availablePartners, setAvailablePartners] = useState<Partner[]>([]);

  useEffect(() => {
    // Listen for online partners
    const q = query(collection(db, 'partners'), where('status', '==', 'online'));
    const unsub = onSnapshot(q, (snap) => {
      setAvailablePartners(snap.docs.map(d => ({ ...d.data(), id: d.id } as Partner)));
    });
    return () => unsub();
  }, []);

  const createFirestoreJob = async (selectedPartnerName?: string, selectedPartnerUid?: string) => {
    try {
      const jobId = "J" + Math.random().toString(36).substr(2, 5).toUpperCase();
      const jobData = {
        id: jobId,
        customerName: customerData?.name || 'Anonymous User',
        customerUid: auth.currentUser?.uid || 'anonymous',
        phone: customerData?.phone || 'N/A',
        vehicle: customerData?.vehicle || 'Car',
        serviceName: mode === 'rsa' ? 'RSA Emergency Assist' : 'Periodic Service',
        type: mode,
        status: 'pending',
        fee: mode === 'rsa' ? 499 : 1200,
        createdAt: serverTimestamp(),
        partner: selectedPartnerName || (mode === 'rsa' ? "Searching..." : "Hassan Motors"),
        partnerUid: selectedPartnerUid || '',
        location: 'Srinagar'
      };
      await setDoc(doc(db, 'jobs', jobId), jobData);
      return jobId;
    } catch (err) {
      console.error("Job Creation Failed", err);
      handleFirestoreError(err, 'create', 'jobs');
      return null;
    }
  };

  const getWhatsAppLink = (text: string) => {
    const phone = "917006830504"; // Platform admin or partner phone
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const advanceFlow = async (userInput?: string) => {
    const currentFlow = flows[mode];
    if (userInput) {
      setMessages(prev => [...prev, { from: 'user', text: userInput }]);
      
      if (userInput === 'Yes, confirm') {
        const matchingPartner = availablePartners.find(p => p.location.includes('Srinagar')) || availablePartners[0];
        const jobId = await createFirestoreJob(matchingPartner?.name, matchingPartner?.id);
        
        if (jobId) {
          const waMsg = `Assalamu Alaikum Auto GTG! I have confirmed my booking.\nJob ID: ${jobId}\nService: ${mode === 'rsa' ? 'Emergency RSA' : 'Periodic Service'}\nVehicle: ${customerData?.vehicle || 'Vehicle'}\nLocation: Srinagar`;
          
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              from: 'bot', 
              text: `Protocol Confirmed! REFERENCE: #${jobId}\n\nTo ensure priority dispatch, please initiate the WhatsApp Handshake.`,
              choices: ['Open WhatsApp 🟢']
            }]);
          }, 800);
          return;
        }
      }

      if (userInput === 'Open WhatsApp 🟢') {
        const waMsg = `Assalamu Alaikum Auto GTG! I have a confirmed booking.\nService: ${mode === 'rsa' ? 'Emergency RSA' : 'Periodic Service'}\nVehicle: ${customerData?.vehicle || 'Vehicle'}`;
        window.open(getWhatsAppLink(waMsg), '_blank');
        return;
      }
    }

    setTimeout(() => {
      let nextIdx = flowIndex;
      while (nextIdx < currentFlow.length) {
        const next = currentFlow[nextIdx];
        setMessages(prev => [...prev, { from: next.from as 'bot' | 'system', text: next.text, choices: next.choices }]);
        setFlowIndex(nextIdx + 1);
        
        if (next.from === 'system') {
          nextIdx++;
          continue;
        }
        break;
      }
    }, 600);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    advanceFlow(inputValue);
    setInputValue('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden flex flex-col h-[650px] shadow-sleek-lg ring-1 ring-slate-100">
      <div className={cn(
        "px-6 py-5 flex items-center justify-between transition-colors duration-500",
        mode === 'rsa' ? "bg-slate-900" : "bg-primary"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white text-sm shadow-sm">
            AG
          </div>
          <div>
            <div className="font-bold text-white tracking-tight">Auto GTG</div>
            <div className="text-[10px] text-white/70 font-semibold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-whatsapp rounded-full" />
              Verified Partner
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-white/80">
          <Phone className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          <Settings className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>

      <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col wa-body">
        {messages.map((m, i) => {
          return (
            <ChatBubble 
              key={`msg-${i}`} 
              from={m.from} 
              text={m.text} 
              choices={m.choices} 
              onChoice={(choice) => advanceFlow(choice)} 
            />
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-white p-4 border-t border-slate-100 flex gap-3 items-center">
        <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-3 border border-transparent focus-within:border-indigo-200 focus-within:bg-white transition-all shadow-inner">
          <input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 font-medium"
            placeholder="Search your workflow..."
          />
        </div>
        <button 
          onClick={handleSend}
          className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-indigo hover:bg-primary-dark transition-all active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const CustomerPanel = ({ userProfile }: { userProfile: UserProfile | null }) => {
  const [activeMode, setActiveMode] = useState<'service' | 'marketplace' | 'my-bookings'>('service');
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<ServiceType>('scheduled');
  
  const [showCheckIn, setShowCheckIn] = useState(true);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', vehicle: '' });

  useEffect(() => {
    if (userProfile) {
      setCustomerInfo(prev => ({ ...prev, name: userProfile.displayName || '', phone: userProfile.email || '' }));
      // If they are logged in, we still might want vehicle details, but let's see.
    }
  }, [userProfile]);

  const [firestoreJobs, setFirestoreJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Sync bookings for current customer identity
    if (!userProfile?.uid && !customerInfo.name) return;

    const q = userProfile?.uid 
      ? query(collection(db, 'jobs'), where('customerUid', '==', userProfile.uid))
      : query(collection(db, 'jobs'), where('customerName', '==', customerInfo.name));

    const unsub = onSnapshot(q, (snap) => {
      setFirestoreJobs(snap.docs.map(d => ({ ...d.data(), id: d.id } as Job)));
    }, (err) => {
      console.warn("Customer jobs listener error:", err.message);
    });
    return () => unsub();
  }, [customerInfo.name, userProfile]);

  const filteredServices = SERVICES.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myBookings = [...INITIAL_JOBS.filter(j => j.customerName === (customerInfo.name || 'Tariq Mir')), ...firestoreJobs];

  if (showCheckIn && !userProfile) {
    return (
      <div className="pt-32 max-w-xl mx-auto px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sleek space-y-8">
          <div className="text-center">
             <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus className="text-primary w-8 h-8" />
             </div>
             <h2 className="text-2xl font-bold text-slate-800">Identity Protocol</h2>
             <p className="text-xs text-text-muted mt-2 font-medium">Capture details for mission logistics.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block mb-2 px-1">Full Name</label>
              <input 
                value={customerInfo.name}
                onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                type="text" placeholder="Your Name" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:ring-1 focus:ring-primary outline-none transition-all font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block mb-2 px-1">Phone</label>
                <input 
                  value={customerInfo.phone}
                  onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  type="tel" placeholder="+91" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:ring-1 focus:ring-primary outline-none transition-all font-medium" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block mb-2 px-1">Vehicle</label>
                <input 
                  value={customerInfo.vehicle}
                  onChange={e => setCustomerInfo({...customerInfo, vehicle: e.target.value})}
                  type="text" placeholder="Model" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:ring-1 focus:ring-primary outline-none transition-all font-medium" />
              </div>
            </div>
          </div>
          <button 
            disabled={!customerInfo.name || !customerInfo.phone}
            onClick={() => setShowCheckIn(false)}
            className="w-full bg-slate-900 text-white font-bold text-xs py-4 rounded-2xl shadow-sleek uppercase tracking-widest disabled:opacity-30 hover:shadow-indigo transition-all"
          >
            Initiate Deployment
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 max-w-7xl mx-auto px-6 pb-20 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold font-display tracking-tight text-slate-800">
            {activeMode === 'service' ? 'Maintenance Nodes' : 
             activeMode === 'marketplace' ? 'Parts Marketplace' :
             'My Service History'}
          </h2>
          <p className="text-[10px] font-bold text-text-light uppercase tracking-[0.2em]">
            Srinagar Network • Verified Infrastructure
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start">
          {(['service', 'marketplace', 'my-bookings'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-bold uppercase transition-all tracking-widest",
                activeMode === m 
                  ? "bg-white text-primary shadow-sm ring-1 ring-slate-200" 
                  : "text-text-muted hover:text-text-main"
              )}
            >
              {m.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {activeMode === 'service' && (
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5 lg:col-span-4 space-y-8">
            <div className="flex gap-2 p-1 bg-surface-2 rounded-2xl border border-surface-3">
              <button 
                onClick={() => setMode('scheduled')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all tracking-widest",
                  mode === 'scheduled' 
                    ? "bg-primary text-white shadow-indigo" 
                    : "text-text-muted hover:text-text-main"
                )}
              >
                Scheduled
              </button>
              <button 
                onClick={() => setMode('rsa')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all tracking-widest",
                  mode === 'rsa' 
                    ? "bg-slate-900 text-white shadow-sleek" 
                    : "text-text-muted hover:text-text-main"
                )}
              >
                RSA Assist
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sleek overflow-hidden">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Quick Search</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Find help fast</div>
                  </div>
               </div>
               <input 
                type="text" 
                placeholder="Diagnostic, Oil, Tyre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-primary/20"
               />
               <WhatsAppPanel mode={mode} setMode={setMode} customerData={customerInfo} />
            </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8 space-y-10">
            <div className="grid sm:grid-cols-2 gap-6">
              {filteredServices.map((s) => (
                <div key={s.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sleek relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-6 h-6 text-primary" />
                  </div>
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-50 transition-colors">
                    {s.type === 'rsa' ? <AlertTriangle className="w-6 h-6 text-red-500" /> : <Wrench className="w-6 h-6 text-primary" />}
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">{s.name}</h4>
                  <p className="text-xs text-text-muted font-medium leading-relaxed mb-8">
                    {s.description}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <span className="text-2xl font-bold text-slate-800 font-display">₹{s.price}</span>
                    <span className="text-[10px] font-bold text-text-light uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-lg">Verified Node</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
              <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-[0.2em] mb-8">System Architecture</h3>
              <div className="grid sm:grid-cols-2 gap-8">
                {[
                   { step: 1, title: 'Smart Node Match', desc: 'Spatially aware dispatcher matches your request to the local node.' },
                   { step: 2, title: 'Infrastructure Sync', desc: 'Secure verification of logistics and partner capability.' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="text-lg font-bold">{item.title}</div>
                    <p className="text-xs text-indigo-100/70 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMode === 'marketplace' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PRODUCTS.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sleek group">
              <div className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden mb-6 bg-slate-50 border border-slate-100">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary border border-slate-100">
                  {p.category}
                </div>
              </div>
              <div className="px-2">
                <div className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">{p.brand}</div>
                <h4 className="text-lg font-bold text-slate-800 mb-6">{p.name}</h4>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold font-display text-slate-800">₹{p.price}</div>
                  <button className="p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm">
                    <Package className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeMode === 'my-bookings' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {myBookings.map(j => (
            <div key={j.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sleek flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center border",
                  j.status === 'completed' ? "bg-green-50 border-green-100 text-green-whatsapp" : "bg-indigo-50 border-indigo-100 text-primary"
                )}>
                   {j.status === 'completed' ? <CheckCircle2 className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{j.serviceName}</h4>
                  <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mt-1">{j.vehicle} • {j.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">State</div>
                  <div className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    j.status === 'completed' ? "text-green-whatsapp" : "text-primary"
                  )}>
                    {j.status}
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-100 hidden md:block" />
                <button className="flex items-center gap-2 text-[10px] font-bold text-primary group uppercase tracking-widest">
                  Live View <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OnboardingPanel = ({ user }: { user: any }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    owner: '',
    phone: '',
    email: '',
    location: 'Lal Chowk, Srinagar',
    timing: '9 AM - 6 PM',
    types: [] as string[],
    typeDesc: ''
  });

  const submitOnboarding = async () => {
    if (!user) {
      setStep(4); // Trigger login/register
      return;
    }
    setLoading(true);
    try {
      const partnerData: any = {
        ...formData,
        uid: user.uid,
        id: user.uid, // Ensure id matches doc name
        status: 'pending_verification',
        initials: formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'partners', user.uid), partnerData);
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      types: prev.types.includes(type) 
        ? prev.types.filter(t => t !== type) 
        : [...prev.types, type]
    }));
  };

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-20">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-sleek relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <UserPlus className="w-12 h-12 text-primary opacity-20" />
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold font-display text-slate-800 mb-2">Partner Onboarding</h2>
          <p className="text-[10px] font-bold text-text-light uppercase tracking-[0.2em]">Join the Auto GTG Infrastructure</p>
        </div>

        <div className="flex gap-4 mb-12">
          {[1, 2, 3].map(s => (
            <div key={s} className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              step >= s ? "bg-primary" : "bg-slate-100"
            )} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block mb-3">Garage / Business Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Valley Auto Experts" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block mb-3">Owner Name</label>
                  <input 
                    type="text" 
                    value={formData.owner}
                    onChange={(e) => setFormData({...formData, owner: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block mb-3">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block mb-3">Primary Node Location</label>
                  <select 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none font-medium"
                  >
                    <option>Lal Chowk, Srinagar</option>
                    <option>Hyderpora</option>
                    <option>Sonwar</option>
                    <option>Bemina</option>
                    <option>Nowgam Bypass</option>
                    <option>Sanatnagar</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block mb-3">Operating Timing</label>
                  <input 
                    type="text" 
                    value={formData.timing}
                    onChange={(e) => setFormData({...formData, timing: e.target.value})}
                    placeholder="9 AM - 6 PM"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                  />
                </div>
              </div>
              <button 
                onClick={() => setStep(2)}
                className="w-full bg-slate-900 text-white font-bold text-xs py-4 rounded-2xl shadow-sleek active:scale-95 transition-all uppercase tracking-widest"
              >
                Continue Integration
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div>
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block mb-6 text-center">Protocol Capabilities</label>
                <div className="grid grid-cols-2 gap-4">
                  {['Car Service', 'RSA Assistance', 'Towing Node', 'Bike Protocol', 'Inspection Sync', 'Diagnostics', 'Washing', 'Alignment'].map(type => (
                    <button 
                      key={type} 
                      onClick={() => toggleType(type)}
                      className={cn(
                        "p-4 border rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        formData.types.includes(type) ? "bg-primary text-white border-primary shadow-indigo" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block mb-3">Detailed Expertise</label>
                <textarea 
                  value={formData.typeDesc}
                  onChange={(e) => setFormData({...formData, typeDesc: e.target.value})}
                  placeholder="Tell us about your specialization (e.g. Multi-service garage, Brand-focused...)"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 border border-slate-200 text-text-muted font-bold text-[10px] py-4 rounded-2xl uppercase tracking-widest">Back</button>
                <button 
                  onClick={submitOnboarding} 
                  disabled={loading}
                  className="flex-[2] bg-slate-900 text-white font-bold text-[10px] py-4 rounded-2xl shadow-sleek uppercase tracking-widest disabled:opacity-50"
                >
                  {loading ? 'Transmitting Records...' : 'Submit Records'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-10">
              <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Application Received</h3>
                <p className="text-xs text-text-muted font-medium max-w-xs mx-auto">Our logistics admin will verify your garage nodes and activate your terminal within 24 hours.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 inline-block">
                <div className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">Assigned Node ID</div>
                <div className="text-lg font-mono font-bold text-slate-800 tracking-tighter">NODEX-{Math.floor(1000 + Math.random() * 9000)}-SRN</div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="text-center">
                <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Identify Required</h3>
                <p className="text-xs text-text-muted mt-2">Please create an account to secure your partner application.</p>
              </div>
              <LoginScreen onAuthSuccess={() => setStep(2)} initialMode="register" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
const MechanicPortal = ({ user }: { user: any }) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'manage' | 'earnings'>('queue');
  const [isAvailable, setIsAvailable] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [localServices, setLocalServices] = useState<{serviceId: string, price: number}[]>([]);

  useEffect(() => {
    if (!user) return;

    // Listen to current partner profile
    const unsubPartner = onSnapshot(doc(db, 'partners', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partner;
        setPartner(data);
        setLocalServices(data.services || []);
        setIsAvailable(data.status === 'online');
      }
    }, (err) => {
       console.warn("Partner profile listener error:", err.message);
    });

    // Listen to jobs for this partner
    const unsubJobs = onSnapshot(query(collection(db, 'jobs'), where('partnerUid', '==', user.uid)), (snap) => {
      const jData = snap.docs.map(d => ({ ...d.data(), id: d.id } as Job));
      setJobs(jData);
    }, (err) => {
       console.warn("Partner jobs listener error:", err.message);
    });

    return () => {
      unsubPartner();
      unsubJobs();
    };
  }, [user]);

  const toggleAvailability = async () => {
    if (!user) return;
    const newStatus = isAvailable ? 'offline' : 'online';
    await updateDoc(doc(db, 'partners', user.uid), {
      status: newStatus
    });
  };

  const handleAction = async (id: string, newStatus: Job['status']) => {
    try {
      await updateDoc(doc(db, 'jobs', id), { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, 'update', 'jobs/' + id);
    }
  };

  const addService = async (serviceId: string) => {
    if (!user) return;
    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) return;
    
    const updated = [...localServices, { serviceId, price: service.price }];
    await updateDoc(doc(db, 'partners', user.uid), { services: updated });
    setShowAddModal(false);
  };

  const removeService = async (serviceId: string) => {
    if (!user) return;
    const updated = localServices.filter(s => s.serviceId !== serviceId);
    await updateDoc(doc(db, 'partners', user.uid), { services: updated });
  };

  const updatePrice = async (serviceId: string, newPrice: number) => {
    if (!user) return;
    const updated = localServices.map(s => s.serviceId === serviceId ? { ...s, price: newPrice } : s);
    await updateDoc(doc(db, 'partners', user.uid), { services: updated });
  };

  if (partner?.status === 'pending_verification') {
    return (
      <div className="pt-32 max-w-2xl mx-auto px-6 text-center space-y-8">
        <div className="w-24 h-24 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-sm">
          <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
        </div>
        <div>
          <h2 className="text-3xl font-bold font-display text-slate-800 mb-4">Verification in Progress</h2>
          <p className="text-slate-600 font-medium leading-relaxed">
            Your terminal identity ({partner.name}) is currently undergoing infrastructure audit. 
            Once verified by the Auto GTG admin, you will receive full mission access.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sleek inline-block">
          <div className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">Queue Status</div>
          <div className="text-xs font-bold text-slate-700">STANDBY PROTOCOL ACTIVE</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 max-w-7xl mx-auto px-6 pb-20 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary text-2xl font-bold shadow-sleek">
            {partner?.initials || 'P'}
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-slate-800">{partner?.name || 'Partner Terminal'}</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] font-bold text-text-light uppercase tracking-widest">{partner?.location || 'Srinagar Node'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                isAvailable ? "text-green-whatsapp" : "text-slate-400"
              )}>
                {isAvailable ? 'Active Pulse' : 'Terminal Offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
           {(['queue', 'manage', 'earnings'] as const).map(t => (
             <button
               key={t}
               onClick={() => setActiveTab(t)}
               className={cn(
                 "px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                 activeTab === t ? "bg-white text-primary shadow-sm ring-1 ring-slate-200" : "text-text-muted hover:text-text-main"
               )}
             >
               {t.replace('-', ' ')}
             </button>
           ))}
           <div className="w-px h-6 bg-slate-200 mx-2" />
           <button 
            onClick={toggleAvailability}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              isAvailable ? "bg-green-whatsapp text-white shadow-sleek" : "bg-slate-300 text-slate-500"
            )}
           >
             {isAvailable ? 'ONLINE' : 'OFFLINE'}
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'manage' && (
          <motion.div key="manage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localServices.map(ls => {
                  const s = SERVICES.find(master => master.id === ls.serviceId);
                  if (!s) return null;
                  return (
                    <div key={ls.serviceId} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sleek space-y-6">
                       <div>
                          <div className="text-lg font-bold text-slate-800">{s.name}</div>
                          <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                             {s.type === 'rsa' ? 'Roadside Proto' : `${s.vehicleType} Maintenance`}
                          </div>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[9px] font-bold text-text-light uppercase tracking-widest block">Local Node Price (₹)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                            <input 
                              type="number" 
                              value={ls.price} 
                              onChange={(e) => updatePrice(ls.serviceId, Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-8 pr-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                            />
                          </div>
                       </div>
                       <div className="flex gap-3 pt-2">
                          <div className="flex-1 text-[10px] font-bold text-green-whatsapp uppercase tracking-widest flex items-center gap-2">
                             <CheckCircle2 className="w-4 h-4" /> Active on Map
                          </div>
                          <button 
                            onClick={() => removeService(ls.serviceId)}
                            className="p-3 border border-slate-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  );
                })}
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 text-text-muted hover:bg-slate-100 transition-all group"
                >
                   <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-all">
                      <Upload className="w-5 h-5" />
                   </div>
                   <div className="text-[10px] font-bold uppercase tracking-widest">Enroll New Service</div>
                </button>
             </div>
          </motion.div>
        )}

        {/* --- ADD SERVICE MODAL --- */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Master Service List</h3>
                  <p className="text-xs text-text-muted mt-1 font-medium">Select a protocol to your garage node</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {SERVICES.filter(s => !localServices.find(ls => ls.serviceId === s.id)).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/30 transition-all group">
                    <div className="flex gap-5 items-center">
                       <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                          {s.type === 'rsa' ? <AlertTriangle className="w-6 h-6 text-red-500" /> : <Wrench className="w-6 h-6" />}
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{s.vehicleType || 'Any'} · {s.category}</div>
                          <div className="font-bold text-slate-800">{s.name}</div>
                          <div className="text-xs text-text-muted mt-0.5">{s.description}</div>
                       </div>
                    </div>
                    <button 
                      onClick={() => addService(s.id)}
                      className="bg-primary text-white p-3 rounded-2xl shadow-indigo opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'queue' && (
          <motion.div key="queue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {jobs.filter(j => j.status !== 'completed').map((job) => (
                <div key={job.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sleek relative group">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center shrink-0">
                      {job.type === 'rsa' ? <AlertTriangle className="w-10 h-10 text-red-500" /> : <Wrench className="w-10 h-10 text-primary" />}
                    </div>
                    
                    <div className="flex-1 w-full space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1.5">Request Channel</div>
                          <div className="text-xl font-bold text-slate-800">{job.serviceName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1.5">Asset</div>
                          <div className="text-xs font-bold text-slate-700">{job.vehicle}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-y border-slate-50">
                        <div>
                          <div className="text-[9px] font-bold text-text-light uppercase tracking-widest mb-1">Subject</div>
                          <div className="text-xs font-bold text-slate-600">{job.customerName}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-text-light uppercase tracking-widest mb-1">Arrival</div>
                          <div className="text-xs font-bold text-indigo-500">{job.eta}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-text-light uppercase tracking-widest mb-1">Endpoint</div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-bold text-slate-700 truncate">{job.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex items-center gap-4">
                        <button 
                          onClick={() => handleAction(job.id, job.status === 'pending' ? 'accepted' : 'completed')} 
                          className="flex-1 bg-primary text-white font-bold text-[10px] py-4 rounded-2xl hover:bg-primary-dark shadow-indigo active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                          {job.status === 'pending' ? 'ACCEPT MISSION' : 'MARK AS COMPLETED'}
                        </button>
                        {job.status === 'pending' && (
                          <button onClick={() => handleAction(job.id, 'declined')} className="px-8 border border-slate-200 text-text-muted font-bold text-[10px] py-4 rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest">
                            DECLINE
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full" />
                <h3 className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] mb-10">Historical Earnings</h3>
                <div className="text-4xl font-bold font-display tracking-tight text-white mb-2">₹14,210</div>
                <div className="text-[10px] font-bold text-green-whatsapp uppercase tracking-widest px-3 py-1 bg-green-whatsapp/10 rounded-full w-fit">
                  +12.5% Flux
                </div>
                <div className="mt-12 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-indigo-100/40 uppercase tracking-widest">
                    <span>Node Capacity</span>
                    <span>70%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} transition={{ duration: 1.5 }} className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};




const LandingPage = ({ onEnter, setActiveTab }: { onEnter: () => void, setActiveTab?: (t: string) => void }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20" 
            alt="Garage backdrop"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-slate-50" />
        </div>

        <div className="relative z-10 max-w-4xl px-6 text-center space-y-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-indigo rotate-3 hover:rotate-0 transition-transform duration-500"
          >
            <Wrench className="text-white w-10 h-10" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight text-slate-800">
              Auto GTG <span className="text-primary truncate">Network</span>
            </h1>
            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto font-medium leading-relaxed">
              Kashmir's premium logistics backbone for emergency roadside assistance and scheduled vehicle maintenance.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={onEnter}
              className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-sleek hover:translate-y-[-2px] hover:shadow-2xl active:scale-95 transition-all text-xs"
            >
              Access Terminal
            </button>
            <button 
              onClick={() => { onEnter(); setActiveTab?.('login'); }}
              className="w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 text-slate-800 rounded-2xl font-bold uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all text-xs"
            >
              Partner Login
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 items-center opacity-40 grayscale"
          >
            <div className="flex items-center justify-center gap-2 font-bold text-xs">
              <ShieldCheck className="w-5 h-5" /> VERIFIED
            </div>
            <div className="flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest">
              SRINAGAR NODE
            </div>
            <div className="flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest">
              RSA READY
            </div>
            <div className="flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest">
              PILOT 2026
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const AdminMonitor = () => {
  const [adminTab, setAdminTab] = useState<'ops' | 'partners' | 'bookings' | 'analytics' | 'platform'>('ops');
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', owner: '', location: 'Lal Chowk, Srinagar', phone: '', email: '', typeDesc: '' });

  const [filter, setFilter] = useState<'all' | 'rsa' | 'scheduled' | 'done'>('all');
  
  const [masterServices, setMasterServices] = useState(SERVICES);
  const [marketProducts, setMarketProducts] = useState(PRODUCTS);
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Only attach global listeners if actually an admin and logged in
    if (!auth.currentUser) {
      console.warn("AdminMonitor: No authenticated user. Listeners aborted.");
      return;
    }

    // Listen to partners
    const unsubPartners = onSnapshot(collection(db, 'partners'), (snap) => {
      const pData = snap.docs.map(d => ({ ...d.data(), id: d.id } as Partner));
      setAllPartners(pData);
    }, (err) => {
      console.warn("Admin partners listener error:", err.message);
    });

    // Listen to jobs
    const unsubJobs = onSnapshot(collection(db, 'jobs'), (snap) => {
      const jData = snap.docs.map(d => ({ ...d.data(), id: d.id } as Job));
      setAllJobs(jData);
    }, (err) => {
      console.warn("Admin jobs listener error:", err.message);
    });

    return () => {
      unsubPartners();
      unsubJobs();
    };
  }, []);

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = "P" + Math.random().toString(36).substr(2, 5).toUpperCase();
      await setDoc(doc(db, 'partners', id), {
        ...newPartner,
        id,
        status: 'pending_verification',
        initials: newPartner.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        types: ['General'],
        createdAt: serverTimestamp()
      });
      setShowAddPartner(false);
      setNewPartner({ name: '', owner: '', location: 'Lal Chowk, Srinagar', phone: '', email: '', typeDesc: '' });
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, 'create', 'partners');
    }
  };

  const activatePartner = async (partnerId: string) => {
    try {
      await updateDoc(doc(db, 'partners', partnerId), {
        status: 'online'
      });
      // Also update role in user profile if applicable
      const p = allPartners.find(x => x.id === partnerId);
      if (p && p.uid) {
        await updateDoc(doc(db, 'users', p.uid), {
          role: 'partner'
        });
      }
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, 'update', 'partners/' + partnerId);
    }
  };

  const seedRequestedMechanics = async () => {
    const list = [
      { name: 'Car Choice', owner: 'Noor Mohd.', location: 'Sanatnagar', phone: '7006427220', email: 'owaisnoor45@gmail.com', timing: '9 AM – 6 PM', typeDesc: 'Multi-service garage' },
      { name: 'Elite Car Care', owner: 'Murawat Hussain Khan', location: 'Batamaloo', phone: '9186028969', email: 'elitecarecaresgr@gmail.com', timing: '9 AM – 7 PM', typeDesc: 'LMV mechanic + wash' },
      { name: 'Habib Automobile', owner: 'Mohd. Shahid Bhat', location: 'Nowgam Bypass', phone: '6005822389', email: 'habibautomobiles18@gmail.com', timing: '9 AM – 6 PM', typeDesc: 'Brand-focused: Ford, Hyundai, Toyota' },
      { name: 'Maheen Motors', owner: 'Ayaz Ahmad Dar', location: 'Nowgam Bypass', phone: '7006961065', email: 'maheenmotors@gmail.com', timing: '9 AM – 6 PM', typeDesc: 'Multi-brand mechanic' }
    ];

    for (const m of list) {
       const id = "P" + Math.random().toString(36).substr(2, 5).toUpperCase();
       try {
         await setDoc(doc(db, 'partners', id), {
           ...m,
           id,
           status: 'pending_verification',
           initials: m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
           types: ['General'],
           createdAt: serverTimestamp()
         });
       } catch (err) {
         handleFirestoreError(err, 'create', 'partners');
       }
    }
  };

  const filteredJobs = allJobs.filter(j => {
    if (filter === 'all') return true;
    if (filter === 'rsa') return j.type === 'rsa' && j.status !== 'completed';
    if (filter === 'scheduled') return j.type === 'scheduled' && j.status !== 'completed';
    if (filter === 'done') return j.status === 'completed';
    return true;
  });

  const stats = [
    { label: 'Active Jobs', val: allJobs.filter(j => j.status !== 'completed').length.toString(), sub: 'Live Network', trend: '+12%', color: 'text-primary' },
    { label: 'Partners Online', val: allPartners.filter(p => p.status === 'online').length.toString(), sub: 'Engagement', trend: '+2', color: 'text-slate-800' },
    { label: 'Pending Apps', val: allPartners.filter(p => p.status === 'pending_verification').length.toString(), sub: 'Protocol Check', trend: 'Audit', color: 'text-amber-500' },
    { label: 'Total Revenue', val: '₹' + allJobs.filter(j => j.status === 'completed').reduce((acc, j) => acc + (j.fee || 0), 0).toLocaleString(), sub: 'Lifecycle', trend: 'Live', color: 'text-green-whatsapp' },
  ];

  return (
    <div className="mt-24 max-w-7xl mx-auto px-6 space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded uppercase tracking-widest animate-pulse">Admin Secure</div>
              <div className="text-[10px] font-bold text-text-light uppercase tracking-widest">• Command Center Node</div>
           </div>
           <h2 className="text-4xl font-bold font-display tracking-tight text-slate-800">Platform Control</h2>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
           {(['ops', 'partners', 'bookings', 'analytics', 'platform'] as const).map(t => (
             <button
               key={t}
               onClick={() => setAdminTab(t)}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                 adminTab === t ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-main"
               )}
             >
               {t === 'ops' ? 'Live Jobs' : t === 'partners' ? 'Partner Management' : t === 'bookings' ? 'Customer Bookings' : t === 'analytics' ? 'Analytics' : 'Inventory'}
             </button>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {adminTab === 'partners' && (
          <motion.div key="admin-partners" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Verified Mechanics</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setShowAddPartner(!showAddPartner)}
                  className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 shadow-indigo"
                >
                  <Plus className="w-4 h-4" /> Add Partner Entry
                </button>
                <button 
                  onClick={seedRequestedMechanics}
                  className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  Seed Core Network
                </button>
              </div>
            </div>

            {showAddPartner && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                onSubmit={handleAddPartner}
                className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sleek grid md:grid-cols-3 gap-6"
              >
                <div className="md:col-span-1">
                  <label className="text-[9px] font-bold text-text-light uppercase tracking-widest mb-2 block">Garage Name</label>
                  <input required value={newPartner.name} onChange={e => setNewPartner({...newPartner, name: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-text-light uppercase tracking-widest mb-2 block">Owner</label>
                  <input required value={newPartner.owner} onChange={e => setNewPartner({...newPartner, owner: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-text-light uppercase tracking-widest mb-2 block">Location</label>
                  <select value={newPartner.location} onChange={e => setNewPartner({...newPartner, location: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm outline-none focus:ring-1 focus:ring-primary h-11">
                    <option>Lal Chowk, Srinagar</option>
                    <option>Hyderpora</option>
                    <option>Sonwar</option>
                    <option>Sanatnagar</option>
                    <option>Nowgam Bypass</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-text-light uppercase tracking-widest mb-2 block">Phone</label>
                  <input required value={newPartner.phone} onChange={e => setNewPartner({...newPartner, phone: e.target.value})} type="tel" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-text-light uppercase tracking-widest mb-2 block">Email</label>
                  <input required value={newPartner.email} onChange={e => setNewPartner({...newPartner, email: e.target.value})} type="email" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button type="submit" className="w-full bg-slate-900 text-white font-bold text-[10px] py-3.5 rounded-xl uppercase tracking-widest hover:translate-y-[-1px] transition-all">Direct Onboard</button>
                </div>
              </motion.form>
            )}

            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sleek">
               <div className="divide-y divide-slate-100">
                  {allPartners.map(p => (
                    <div key={p.id} className="p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-8 hover:bg-slate-50 transition-all group">
                       <div className="flex flex-col md:flex-row gap-8 flex-1">
                          <div className={cn(
                            "w-16 h-16 rounded-3xl flex items-center justify-center font-bold text-xl shadow-sm shrink-0 border transition-colors",
                            p.status === 'online' ? "bg-green-50 border-green-100 text-green-whatsapp" : "bg-indigo-50 border-indigo-100 text-primary"
                          )}>
                             {p.initials || '??'}
                          </div>
                          <div className="space-y-4 flex-1">
                             <div className="flex items-center gap-3">
                               <div className="text-xl font-bold text-slate-800">{p.name}</div>
                               <span className={cn(
                                 "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] border",
                                 p.status === 'online' ? "bg-green-100 border-green-200 text-green-700" : "bg-slate-100 border-slate-200 text-slate-500"
                               )}>
                                 {p.status}
                               </span>
                             </div>
                             
                             <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                   <div className="text-[8px] font-black text-text-light uppercase tracking-widest">Admin Contact</div>
                                   <div className="text-xs font-bold text-slate-700">{p.owner || 'N/A'}</div>
                                   <div className="text-[10px] text-text-muted">{p.phone}</div>
                                </div>
                                <div className="space-y-1">
                                   <div className="text-[8px] font-black text-text-light uppercase tracking-widest">Operational Zone</div>
                                   <div className="text-xs font-bold text-slate-700">{p.location}</div>
                                </div>
                                <div className="space-y-1">
                                   <div className="text-[8px] font-black text-text-light uppercase tracking-widest">Specialization</div>
                                   <div className="text-xs font-bold text-primary uppercase tracking-wider truncate">{p.typeDesc || p.types?.[0]}</div>
                                </div>
                             </div>
                          </div>
                       </div>
                       <div className="flex gap-3 shrink-0">
                          {p.status === 'pending_verification' ? (
                            <button 
                             onClick={() => activatePartner(p.id)}
                             className="px-6 py-3 bg-green-whatsapp text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:translate-y-[-2px] shadow-sleek transition-all"
                            >
                              Verify & Activate
                            </button>
                          ) : (
                            <button className="px-6 py-3 border border-slate-200 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-not-allowed">Active Node</button>
                          )}
                          <button className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:text-red-500 transition-colors"><Settings className="w-4 h-4" /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}

        {adminTab === 'bookings' && (
          <motion.div key="admin-bookings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <h3 className="text-xl font-bold text-slate-800 px-4">Global Job Ledger</h3>
            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sleek">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-[0.2em] text-text-light">
                     <tr>
                        <th className="px-8 py-5">Timestamp</th>
                        <th className="px-8 py-5">Customer Node</th>
                        <th className="px-8 py-5">Terminal assigned</th>
                        <th className="px-8 py-5">Service Protocol</th>
                        <th className="px-8 py-5 text-right">Settlement</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                     {allJobs.map(job => (
                       <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4 font-mono text-[10px]">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Draft'}</td>
                          <td className="px-8 py-4">
                            <div className="font-bold">{job.customerName}</div>
                            <div className="text-[10px] text-text-muted">{job.vehicle}</div>
                          </td>
                          <td className="px-8 py-4 truncate max-w-[150px]">{job.partner || 'Searching...'}</td>
                          <td className="px-8 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded uppercase font-bold text-[9px]",
                              job.type === 'rsa' ? "bg-red-50 text-red-500 border border-red-100" : "bg-indigo-50 text-primary border border-indigo-100"
                            )}>{job.serviceName}</span>
                          </td>
                          <td className="px-8 py-4 text-right font-bold font-display">₹{job.fee}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </motion.div>
        )}

        {adminTab === 'analytics' && (
          <motion.div key="admin-analytics" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sleek col-span-2">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-light mb-8">Service Flux (7 Days)</h4>
                <div className="h-48 flex items-end gap-3 px-4">
                  {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ height: 0 }} 
                      animate={{ height: `${h}%` }} 
                      transition={{ delay: i * 0.1 }}
                      className="flex-1 bg-indigo-500 rounded-t-xl hover:bg-slate-900 transition-colors relative group"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded">
                        {h}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex justify-between mt-6 px-4 text-[9px] font-bold text-text-muted opacity-50 uppercase tracking-widest">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
              <div className="bg-slate-900 text-white rounded-[2rem] p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/30 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-10">Network Efficiency</h4>
                  <div className="text-6xl font-bold font-display">98.2<span className="text-indigo-400">%</span></div>
                  <p className="text-xs text-white/50 mt-4 leading-relaxed font-medium">Uptime verification maintained across 4 Srinagar service blocks.</p>
                </div>
                <div className="pt-10 border-t border-white/10 mt-10">
                   <div className="flex justify-between items-end">
                      <div className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Deployment Tier</div>
                      <div className="text-xs font-bold text-white">ENTERPRISE V4</div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {adminTab === 'ops' && (
          <motion.div key="ops" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-custom shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <div className="text-xs text-red-600 font-bold uppercase tracking-wider">
                <span className="bg-red-500 text-white px-2 py-0.5 rounded mr-2">Live Alert</span>
                Node Infrastructure operational. {allJobs.filter(j => j.status === 'live').length} Active sessions currently tracked.
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((s, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sleek relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="w-12 h-12 text-primary" />
                  </div>
                  <div className={cn("text-4xl font-bold font-display tracking-tight", s.color)}>{s.val}</div>
                  <div className="text-xs font-bold text-text-light uppercase tracking-[0.2em] mt-2">{s.label}</div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-text-muted uppercase">{s.sub}</span>
                    <span className="text-[10px] font-bold text-green-whatsapp bg-green-50 px-2 py-0.5 rounded-full">{s.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2rem] overflow-hidden flex flex-col shadow-sleek">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text-light uppercase tracking-[0.2em]">Srinagar Node Activity</h3>
                </div>
                
                <div className="px-8 py-4 border-b border-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
                  {(['all', 'rsa', 'scheduled', 'done'] as const).map(f => (
                    <button 
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all tracking-widest shrink-0",
                        filter === f ? "bg-slate-900 text-white shadow-sleek" : "text-text-muted hover:text-text-main hover:bg-slate-100"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] text-text-light uppercase tracking-[0.2em] font-bold">
                      <tr>
                        <th className="px-8 py-5">Workflow</th>
                        <th className="px-8 py-5">Service Nodes</th>
                        <th className="px-8 py-5 text-right">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="text-sm font-bold text-slate-800">{job.customerName}</div>
                            <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">{job.vehicle}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-xs font-bold text-slate-700">{job.serviceName}</div>
                            <div className={cn(
                              "text-[9px] font-bold uppercase mt-1.5 px-2 py-0.5 rounded inline-block",
                              job.type === 'rsa' ? "bg-red-50 text-red-500" : "bg-indigo-50 text-indigo-500"
                            )}>
                              {job.type}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className={cn(
                              "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                              job.status === 'completed' ? "bg-green-50 border-green-100 text-green-whatsapp" : 
                              job.status === 'live' ? "bg-red-50 border-red-100 text-red-500" :
                              "bg-indigo-50 border-indigo-100 text-indigo-500"
                            )}>
                              {job.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sleek">
                  <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xs font-bold text-text-light uppercase tracking-[0.2em]">Verified Partners</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {(allPartners.length > 0 ? allPartners.slice(0, 6) : PARTNERS).map((p) => (
                      <div key={p.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs border shrink-0 shadow-sm",
                            p.status === 'online' ? "bg-indigo-50 border-indigo-100 text-primary" :
                            p.status === 'busy' ? "bg-amber-50 border-amber-100 text-amber-500" :
                            "bg-slate-100 border-slate-200 text-slate-400"
                          )}>
                            {p.initials}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{p.name}</div>
                            <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{p.location}</div>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className={cn(
                            "w-2 h-2 rounded-full",
                            p.status === 'online' ? "bg-green-whatsapp" :
                            p.status === 'busy' ? "bg-amber-500" : "bg-slate-300"
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {adminTab === 'platform' && (
          <motion.div key="platform" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-2 gap-10">
             <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sleek">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                   <h3 className="text-xs font-bold text-text-light uppercase tracking-[0.2em]">Master Service Protocol</h3>
                   <button 
                    onClick={() => {
                      const name = prompt("Service Name?");
                      if(name) setMasterServices(prev => [...prev, { id: Date.now().toString(), name, description: "System verified service node", price: 1200, type: 'scheduled', category: 'General' }]);
                    }}
                    className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-indigo hover:translate-y-[-1px] transition-all"
                   >
                     <Plus className="w-5 h-5" />
                   </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                   {masterServices.map(s => (
                     <div key={s.id} className="p-6 hover:bg-slate-50 flex items-center justify-between group">
                        <div className="flex gap-4 items-center">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-primary transition-colors border border-slate-100">
                             {s.type === 'rsa' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Wrench className="w-5 h-5" />}
                           </div>
                           <div>
                              <div className="text-sm font-bold text-slate-800">{s.name}</div>
                              <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{s.vehicleType || 'Any'} · {s.category || 'Maintenance'}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-sm font-bold text-slate-800">₹{s.price}</div>
                           <button className="text-[9px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest mt-1">Decommission</button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sleek">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                   <h3 className="text-xs font-bold text-text-light uppercase tracking-[0.2em]">Logistics Inventory</h3>
                   <button 
                    onClick={() => {
                      const name = prompt("Product Name?");
                      if(name) setMarketProducts(prev => [...prev, { id: Date.now().toString(), name, brand: "Auto GTG", price: 500, category: 'Parts', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=400' }]);
                    }}
                    className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg hover:translate-y-[-1px] transition-all"
                   >
                     <Plus className="w-5 h-5" />
                   </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                   {marketProducts.map(p => (
                     <div key={p.id} className="p-6 hover:bg-slate-50 flex items-center justify-between group">
                        <div className="flex gap-4 items-center">
                           <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                              <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                           </div>
                           <div>
                              <div className="text-sm font-bold text-slate-800">{p.name}</div>
                              <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{p.brand} · {p.category}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-sm font-bold text-indigo-500">₹{p.price}</div>
                           <div className="text-[9px] font-bold text-green- whatsapp uppercase tracking-widest mt-1">In Stock</div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}

        
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Direct admin identifiers
        const admins = ['autogtgofficials@gmail.com', 'ubaitaltafdar1@gmail.com'];
        if (admins.includes(u.email!)) {
          setProfile({ 
            uid: u.uid, 
            email: u.email!, 
            role: 'admin', 
            displayName: u.email === 'ubaitaltafdar1@gmail.com' ? 'Ubaid (Admin)' : 'Infrastructure Admin' 
          });
          setActiveTab('admin');
          setLoading(false);
          return;
        }

        // Auto-granting role based on partner collection for seeded mechanics
        const partnersRef = collection(db, 'partners');
        const q = query(partnersRef, where('email', '==', u.email));
        const pSnap = await getDocs(q);
        
        if (!pSnap.empty) {
           const pDoc = pSnap.docs[0];
           const pData = pDoc.data();
           if (pData.status === 'online') {
              setProfile({ uid: u.uid, email: u.email!, role: 'partner', displayName: pData.name });
              setActiveTab('mechanic');
              setLoading(false);
              return;
           }
        }

        const docSnap = await getDoc(doc(db, 'users', u.uid));
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserProfile;
          setProfile(userData);
          // Redirect to relevant panel
          if (userData.role === 'partner') {
            const pSnap = await getDoc(doc(db, 'partners', u.uid));
            if (!pSnap.exists()) {
              setActiveTab('onboarding');
            } else {
              setActiveTab('mechanic');
            }
          } else if (userData.role === 'admin') {
            setActiveTab('admin');
          } else {
            if (activeTab === 'login') setActiveTab('customer');
          }
        } else {
          // New user, possibly from login success
          setProfile({ uid: u.uid, email: u.email || '', role: 'customer', displayName: 'Anonymous Node' });
          if (activeTab === 'login') setActiveTab('customer');
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [activeTab]); // Added activeTab to dependency to handle redirects correctly

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-indigo-100 border-t-primary rounded-full shadow-sleek"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {activeTab !== 'home' && (
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          userRole={profile?.role || null} 
          onLogout={handleLogout}
        />
      )}
      
      <main>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingPage onEnter={() => setActiveTab('customer')} setActiveTab={setActiveTab} />
            </motion.div>
          )}

          {activeTab === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoginScreen onAuthSuccess={(role) => {
                if (role === 'admin') {
                  setProfile({ uid: 'bypass', email: 'admin@protocol', role: 'admin', displayName: 'Master Protocol Admin' });
                  setActiveTab('admin');
                } else if (role === 'partner') {
                  setActiveTab('mechanic');
                } else {
                  setActiveTab('customer');
                }
              }} />
            </motion.div>
          )}

          {activeTab === 'customer' && (
            <motion.div 
              key="customer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CustomerPanel userProfile={profile} />
            </motion.div>
          )}

          {(activeTab === 'mechanic' && profile?.role === 'partner') && (
            <motion.div 
              key="mechanic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MechanicPortal user={user} />
            </motion.div>
          )}

          {(activeTab === 'admin' && profile?.role === 'admin') && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminMonitor />
            </motion.div>
          )}

          {activeTab === 'onboarding' && (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <OnboardingPanel user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 py-4 bg-white/80 backdrop-blur-md border-t border-slate-100 px-8 flex justify-between items-center z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3 text-[10px] text-text-muted font-bold uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Kashmir Node • Verified Infrastructure 
        </div>
        <div className="flex items-center gap-6 text-[10px] text-text-light uppercase tracking-[0.2em] font-bold">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-whatsapp rounded-full animate-pulse" />
            System Live
          </div>
          <span className="opacity-20 text-slate-800">|</span>
          <span>Pilot Phase 2026</span>
        </div>
      </footer>
    </div>
  );
}
