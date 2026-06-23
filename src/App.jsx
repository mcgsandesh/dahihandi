import React, { useState, useEffect } from 'react';
import { loginWithGoogle, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import Dashboard from './pages/Dashboard';
import TeamDashboard from './pages/TeamDashboard';
import TeamProfile from './pages/TeamProfile';
import PublicRegister from './pages/PublicRegister.jsx';
import Reports from './components/Reports'; // नवीन पाथ (components फोल्डरमध्ये हलवल्यामुळे)

export default function App() {
  // 🌐 पब्लिक लिंक डिटेक्शन
  if (window.location.pathname.includes('/register')) {
    return <PublicRegister />;
  }

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  
  // रिपोर्ट पेजसाठी स्टेट
  const [showReports, setShowReports] = useState(false);

  // 1. localStorage मधून युजर लोड करणे (लॉगिन टिकवून ठेवण्यासाठी)
  useEffect(() => {
    const savedUser = localStorage.getItem('govinda_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const checkUserStatus = async (googleUser, roleFromAuth, teamNameFromAuth) => {
    try {
      const emailLower = googleUser.email.toLowerCase();
      const userDoc = await getDoc(doc(db, "users", emailLower));
      
      if (userDoc.exists()) {
        const dbData = userDoc.data();
        return {
          info: googleUser,
          role: dbData.role || roleFromAuth,
          teamName: dbData.teamName || teamNameFromAuth,
          uid: dbData.uid || '',
          currentYear: dbData.currentYear || '2026',
          isProfileComplete: dbData.isProfileComplete || false,
          teamCategory: dbData.teamCategory || 'Men',
          address: dbData.address || '',
          establishedYear: dbData.establishedYear || '',
          slogan: dbData.slogan || '',
          logoUrl: dbData.logoUrl || ''
        };
      }
      return { info: googleUser, role: roleFromAuth, teamName: teamNameFromAuth, isProfileComplete: false };
    } catch (err) {
      console.error("Status check error:", err);
      return { info: googleUser, role: roleFromAuth, teamName: teamNameFromAuth, isProfileComplete: false };
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle();
    
    if (result.success) {
      const fullUserData = await checkUserStatus(result.user, result.role, result.teamName);
      setUser(fullUserData);
      localStorage.setItem('govinda_user', JSON.stringify(fullUserData)); // लॉगिन सेव्ह करा
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('govinda_user'); // लॉगआउटवर डेटा डिलीट करा
    window.location.reload();
  };

  const handleProfileComplete = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('govinda_user', JSON.stringify(updatedUser));
  };

  // 2. राउटिंग लॉजिक
  if (user && user.role === 'superadmin') {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  if (user && user.role === 'admin') {
    if (!user.isProfileComplete) {
      return <TeamProfile user={user} onProfileComplete={handleProfileComplete} />;
    }
    
    // रिपोर्ट पेज आणि डॅशबोर्डचे टोगल
    if (showReports) {
      return <Reports user={user} onBack={() => setShowReports(false)} />;
    }

    return (
      <TeamDashboard 
        user={user} 
        onLogout={handleLogout} 
        onShowReports={() => setShowReports(true)} // हे फंक्शन डॅशबोर्डला पास करा
      />
    );
  }

  // 3. लॉगिन स्क्रीन
  return (
    <div className="min-h-screen bg-[#0b132b] flex flex-col justify-between items-center p-6 text-center relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=600')` }}></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#ff6600] opacity-20 blur-[100px] rounded-full pointer-events-none"></div>
      <div></div>
      <div className="flex flex-col items-center space-y-3 z-10">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-wide leading-tight">महाराष्ट्राचा <br /><span className="text-[#ff6600]">गोविंदा</span></h1>
        <p className="text-[#ff6600] text-xs font-bold tracking-[0.2em] uppercase">— प्रत्येक गोविंदासाठी —</p>
      </div>
      <div className="w-full max-w-xs flex flex-col items-center space-y-6 z-10">
        {error && <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-2 px-3 rounded-lg font-medium">{error}</div>}
        <button onClick={handleLogin} disabled={loading} className="w-full bg-[#ff6600] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#e65c00] transition-all disabled:opacity-50">
          {loading ? 'तपासत आहे...' : 'लॉगइन करा'}
        </button>
        <div className="pt-2">
          <p className="text-slate-500 text-[10px] tracking-widest uppercase">An Initiative by</p>
          <p className="text-slate-300 text-xs font-bold tracking-wide mt-0.5">Sandesh Mahadik</p>
        </div>
      </div>
    </div>
  );
}