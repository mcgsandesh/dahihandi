import React, { useState, useEffect } from 'react';
import { loginWithGoogle, db, auth } from './firebase'; 
import { doc, getDoc, onSnapshot } from 'firebase/firestore'; 
import Swal from 'sweetalert2'; 
import Dashboard from './pages/Dashboard';
import TeamDashboard from './pages/TeamDashboard';
//import TeamProfile from './components/TeamProfile.jsx';
import PublicRegister from './pages/PublicRegister.jsx';
import SplashScreen from './pages/SplashScreen'; 

import logoIcon from '/icon-512.png'; // 👈 हा आपला ब्रँडेड लोगो आयकॉन
import loginBgImg from '/login-bg.png'; // 👈 जर इमेज .jpg असेल तर शेवटी .jpg लिही

import Reports from './components/Reports';
import TeamProfile from './components/TeamProfile';

export default function App() {
  // 🌐 पब्लिक लिंक डिटेक्शन
  if (window.location.pathname.includes('/register')) {
    return <PublicRegister />;
  }

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [showReports, setShowReports] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // 👈 १. स्प्लॅश स्क्रीन दाखवण्यासाठी स्टेट जोडली

  // ⏳ २. ३ सेकंदांनंतर स्प्लॅश स्क्रीन स्वतःहून बंद होईल
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // localStorage मधून युजर लोड करणे आणि Real-time ब्लॉक चेक करणे
  useEffect(() => {
    const savedUser = localStorage.getItem('govinda_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      // 🛡️ REAL-TIME SECURITY LOCK 
      if (parsedUser.info?.email) {
        const emailLower = parsedUser.info.email.toLowerCase();
        
        const unsubscribe = onSnapshot(doc(db, "users", emailLower), (docSnap) => {
          if (docSnap.exists()) {
            const dbData = docSnap.data();
            
            if (dbData.isDeleted === true) {
              Swal.fire({
                title: 'अकाउंट बंद केले आहे!',
                text: 'सुपरॲडमीनने तुमचे अकाउंट डीॲक्टिव्हेट केले आहे. तुम्ही आता सिस्टीम वापरू शकत नाही.',
                icon: 'error',
                confirmButtonColor: '#ff6600',
                confirmButtonText: 'ठीक आहे'
              }).then(() => {
                auth.signOut();
                localStorage.removeItem('govinda_user');
                setUser(null);
                window.location.reload();
              });
            }
          }
        });

        return () => unsubscribe();
      }
    }
  }, []);

  const checkUserStatus = async (googleUser, roleFromAuth, teamNameFromAuth) => {
    try {
      const emailLower = googleUser.email.toLowerCase();
      const userDoc = await getDoc(doc(db, "users", emailLower));
      
      if (userDoc.exists()) {
        const dbData = userDoc.data();

        if (dbData.isDeleted === true) {
          Swal.fire({
            title: 'अकाउंट बंद केले आहे!',
            text: 'सुरक्षेच्या कारणास्तव तुमचे अकाउंट डीॲक्टिव्हेट करण्यात आले आहे. कृपया मुख्य सुपरॲडमीनशी संपर्क साधा.',
            icon: 'error',
            confirmButtonColor: '#ff6600',
            confirmButtonText: 'ठीक आहे'
          });

          await auth.signOut();
          localStorage.removeItem('govinda_user');
          return null; 
        }

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
          logoUrl: dbData.logoUrl || '',
          isDeleted: dbData.isDeleted || false 
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
      if (fullUserData) {
        setUser(fullUserData);
        localStorage.setItem('govinda_user', JSON.stringify(fullUserData));
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('govinda_user');
    window.location.reload();
  };

  const handleProfileComplete = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('govinda_user', JSON.stringify(updatedUser));
  };

  // ⏳ ३. स्प्लॅश स्क्रीन होल्ड लॉजिक (आधी ३ सेकंद हीच स्क्रीन रेंडर होईल)
  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  // राउटिंग लॉजिक
  if (user && user.role === 'superadmin') {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  if (user && user.role === 'admin') {
    if (!user.isProfileComplete) {
      return <TeamProfile user={user} onProfileComplete={handleProfileComplete} />;
    }
    
    if (showReports) {
      return <Reports user={user} onBack={() => setShowReports(false)} />;
    }

    return (
      <TeamDashboard 
        user={user} 
        onLogout={handleLogout} 
        onShowReports={() => setShowReports(true)} 
      />
    );
  }

  // 🛕 ४. लॉगिन स्क्रीन UI (falsh screen demo.png थीम मॅचिंग)
  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col justify-between items-center p-6 text-center relative overflow-hidden font-sans select-none">
      
      {/* कडक बॅकग्राउंड इफेक्ट आणि लाईट ग्लो */}
<div className="absolute inset-0 bg-cover bg-center opacity-[0.25] pointer-events-none mix-blend-color-dodge transition-all duration-700" 
  style={{ backgroundImage: `url(${loginBgImg})` }} // 👈 इथे आपली इमेज लॉक केली
></div>      
<div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-orange-600 opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Top Spacer */}
      <div></div>
      
      {/* मधला ब्रँडिंग विभाग */}
      <div className="flex flex-col items-center space-y-3 z-10">
        {/* 🛕 ब्रँडेड लोगो आयकॉन बॉक्स */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center p-2 shadow-lg shadow-orange-500/20 mb-2 overflow-hidden transform hover:scale-105 transition-all">
          <img 
            src={logoIcon} 
            alt="Logo" 
            className="w-full h-full object-contain rounded-xl select-none"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-wide leading-tight">
          महाराष्ट्राचा <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">गोविंदा</span>
        </h1>
        <p className="text-orange-500/80 text-xs font-bold tracking-[0.2em] uppercase">
          — डिजिटल व्यवस्थापन प्रणाली —
        </p>  <p className="text-white text-[9px] tracking-[0.2em] uppercase">
         Maintain Your Team  <br/>T-shirt and Insuracne Data
        </p>
      </div>

      {/* लॉगिन ॲक्शन बॉक्स */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-6 z-10 mb-4">
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-2.5 px-3 rounded-xl font-medium">
            {error}
          </div>
        )}
        
        <button 
          onClick={handleLogin} 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-3.5 rounded-xl font-black text-sm shadow-lg shadow-orange-600/30 hover:from-orange-500 hover:to-amber-400 transition-all transform active:scale-95 disabled:opacity-50"
        >
          {loading ? 'सुरक्षा तपासत आहे...' : 'लॉगइन करा'}
        </button>

        <div className="pt-2">
          <p className="text-slate-600 text-[9px] tracking-widest uppercase font-bold">An Initiative by</p>
          <p className="text-slate-400 text-xs font-bold tracking-wide mt-0.5">Sandesh Mahadik</p>
        </div>
      </div>
    </div>
  );
}