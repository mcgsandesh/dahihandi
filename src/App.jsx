import React, { useState, useEffect } from 'react';
import { loginWithGoogle, db, auth } from './firebase'; 
import { doc, getDoc, onSnapshot } from 'firebase/firestore'; 
import Swal from 'sweetalert2'; 
import Dashboard from './pages/Dashboard';
import TeamDashboard from './pages/TeamDashboard';
import PublicRegister from './pages/PublicRegister.jsx';
import SplashScreen from './pages/SplashScreen'; 

import logoIcon from '/icon-512.png'; 
import loginBgImg from '/login-bg.png'; 

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
  const [showSplash, setShowSplash] = useState(true); 

  // स्प्लॅश स्क्रीन टायमर (३ सेकंद)
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

  // गुगलने लॉगिन झाल्यावर डेटाबेसमधील रोल आणि सिस्टीम व्हॅल्यूज चेक करणे
  const checkUserStatus = async (googleUser) => {
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

        // सर्व्हर्स आणि डेटाबेस मधील अचूक व्हॅल्यूज मॅप करणे
        return {
          info: {
            displayName: googleUser.displayName,
            email: googleUser.email,
            photoURL: googleUser.photoURL
          },
          role: dbData.role || "admin",
          teamName: dbData.teamName || "नॉन-रजिस्टर संघ",
          uid: dbData.uid || '',
          currentYear: dbData.currentYear || '2026',
          isProfileComplete: dbData.isProfileComplete || false,
          allowInAppForm: dbData.allowInAppForm !== false, // इन-ॲप फॉर्म परमिशन कंट्रोल
          teamCategory: dbData.teamCategory || 'Men',
          address: dbData.address || '',
          establishedYear: dbData.establishedYear || '',
          slogan: dbData.slogan || '',
          logoUrl: dbData.logoUrl || googleUser.photoURL, // जर लोगो नसेल तर गुगलचा फोटो
          isDeleted: dbData.isDeleted || false 
        };
      } else {
        // जर डेटाबेसमध्ये ईमेल आयडी नसेल, तर अनोळखी व्यक्तीला डायरेक्ट प्रवेश नाकारणे ❌
        Swal.fire({
          icon: 'error',
          title: 'प्रवेश नाकारला! 🛑',
          text: 'तुमचा ईमेल आयडी सिस्टीममध्ये नोंदणीकृत नाही. कृपया सुपरॲडमीनकडून तुमचा संघ रजिस्टर करून घ्या!',
          confirmButtonColor: '#ff6600',
          customClass: { popup: 'rounded-3xl' }
        });
        await auth.signOut();
        return null;
      }
    } catch (err) {
      console.error("Status check error:", err);
      return null;
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle();
    
    if (result.success) {
      const fullUserData = await checkUserStatus(result.user);
      if (fullUserData) {
        setUser(fullUserData);
        localStorage.setItem('govinda_user', JSON.stringify(fullUserData));
      }
    } else {
      setError(result.error || 'लॉगिन करताना काहीतरी त्रुटी आली.');
    }
    loading_status_set(false);
  };

  const loading_status_set = (val) => {
    setLoading(val);
  }

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('govinda_user');
    window.location.reload();
  };

  const handleProfileComplete = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('govinda_user', JSON.stringify(updatedUser));
  };

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  // सुपरॲडमीन राउटिंग
  if (user && user.role === 'superadmin') {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  // सामान्य ॲडमीन (गोविंदा पथक प्रमुख) राउटिंग
  if (user && user.role === 'admin') {
    // 🎯 कडक बदल: जर नवीन युझरची प्रोफाईल अपूर्ण असेल, तर त्याला थेट EDIT MODE फॉर्म दाखवा (रिकामी स्क्रीन फिक्स!)
    if (!user.isProfileComplete) {
      return (
        <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 border-b border-slate-100 pb-3 text-center">
              <h3 className="text-base font-black text-slate-800">📋 डिजिटल प्रोफाईल पूर्ण करा</h3>
              <p className="text-[11px] text-orange-500 font-bold mt-0.5">ॲप वापरण्यापूर्वी तुमच्या संघाची आवश्यक माहिती भरा</p>
            </div>
            
            <TeamProfile 
              user={user} 
              teamData={user} 
              setTeamData={() => {}} 
              isEditMode={true} // सक्तीने एडिट फॉर्म उघडला
              setIsEditMode={() => {}}
              handleProfileComplete={handleProfileComplete} // तुझा मूळ फंक्शन प्रॉप नाव न बदलता सुरक्षित पास केला
            />
          </div>
        </div>
      );
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

  // लॉगिन स्क्रीन UI
  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col justify-between items-center p-6 text-center relative overflow-hidden font-sans select-none">
      
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.25] pointer-events-none mix-blend-color-dodge" 
        style={{ backgroundImage: `url(${loginBgImg})` }}
      ></div>      
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-orange-600 opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div></div>
      
      {/* मधला ब्रँडिंग विभाग */}
      <div className="flex flex-col items-center space-y-3 z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center p-2 shadow-lg shadow-orange-500/20 mb-2 overflow-hidden transform hover:scale-105 transition-all">
          <img src={logoIcon} alt="Logo" className="w-full h-full object-contain rounded-xl select-none" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-wide leading-tight">
          महाराष्ट्राचा <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">गोविंदा</span>
        </h1>
        <p className="text-orange-500/80 text-xs font-bold tracking-[0.2em] uppercase">— डिजिटल व्यवस्थापन प्रणाली —</p>
        <p className="text-slate-400 text-[10px] tracking-wide uppercase">Maintain Your Team T-shirt and Insurance Data</p>
      </div>

      {/* लॉगिन ॲक्शन बॉक्स */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-6 z-10 mb-4">
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-2.5 px-3 rounded-xl font-medium">
            {error}
          </div>
        )}
        
        {/* प्रिमियम "Sign in with Google" डिझाईन बटण */}
        <button 
          onClick={handleLogin} 
          disabled={loading} 
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm py-3 px-4 rounded-xl border border-slate-200/80 transition-all transform active:scale-[0.98] flex items-center justify-center space-x-3 shadow-md disabled:opacity-50"
        >
          {loading ? (
            <span className="text-xs text-slate-500 font-bold animate-pulse">सुरक्षा तपासत आहे...</span>
          ) : (
            <>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.416 1.421 15.586 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.83 11.57-11.79 0-.79-.085-1.4-.195-1.925H12.24z"/>
              </svg>
              <span className="tracking-wide">Sign in with Google</span>
            </>
          )}
        </button>

        <div className="pt-2">
          <p className="text-slate-600 text-[9px] tracking-widest uppercase font-bold">An Initiative by</p>
          <p className="text-slate-400 text-xs font-bold tracking-wide mt-0.5">Sandesh Mahadik</p>
        </div>
      </div>
    </div>
  );
}