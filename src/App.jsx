import React, { useState, useEffect } from 'react';
import { loginWithGoogle, db, auth } from './firebase'; 
import { doc, getDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import Swal from 'sweetalert2'; 
import Dashboard from './pages/Dashboard';
import TeamDashboard from './pages/TeamDashboard';
import PublicRegister from './pages/PublicRegister.jsx';
import SplashScreen from './pages/SplashScreen'; 
import LandingPage from './pages/LandingPage';

import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import FAQAndManual from './pages/FAQAndManual';

// 🎯 पब्लिक डॅशबोर्ड इम्पॉर्ट
import PublicDashboard from './pages/PublicDashboard';

import logoIcon from '/icon-512.png'; 
import loginBgImg from '/login-bg.png'; 

import Reports from './components/Reports';
import TeamProfile from './components/TeamProfile';

// 💸 मोबाईलसाठी तळाची चिकटलेली मॅन्युअल ॲड इम्पॉर्ट केली
import AdMobileBottom from './components/AdMobileBottom'; // कॉम्पोनंटचा अचूक पाथ तपासून घ्या



export default function App() {
  // 🌐 पब्लिक लिंक डिटेक्शन (सुरक्षित जसेच्या तसे)
  if (window.location.pathname.includes('/register')) {
    return <PublicRegister />;
  }

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [showReports, setShowReports] = useState(false);
  const [showSplash, setShowSplash] = useState(true); 

  // 🎯 विना-लॉगिन युझर ट्रॅक करण्यासाठी स्टेट
  const [isGuest, setIsGuest] = useState(false);

  // 🎯 लँडिंग पेजवरून येणारा नेमका टॅब ट्रॅक करण्यासाठी नवीन स्टेट
  const [publicActiveTab, setPublicActiveTab] = useState('directory');

  // 🎯 कडक बदल १: थेट लिंकवरून आलेल्या विना-लॉगिन युझरचा स्लॅग ट्रॅक करण्यासाठी स्टेट
  const [directViewSlug, setDirectViewSlug] = useState(null);

  // 🎯 लँडिंग पेजवरून ही पेजेस उघडण्यासाठी स्टेट
const [currentPublicPage, setCurrentPublicPage] = useState(null); // 'about', 'privacy', 'terms', 'faq' किंवा null

  // ==========================================
  // 🔍 DEEP ROUTING DIAGNOSTICS & CORE LOGGER
  // ==========================================
  useEffect(() => {
    const rawPath = window.location.pathname;
    const rawSearch = window.location.search;
    const rawHash = window.location.hash;
    
    console.log("🔥 [APP INITIAL LOAD] --------------------------------");
    console.log("📊 Full URL:", window.location.href);
    console.log("📁 Pathname:", rawPath);
    console.log("❓ Search Query:", rawSearch);
    console.log("🔑 Token Detected:", rawSearch.includes('t=') ? "YES (Valid Token)" : "NO");
    
    if (rawSearch.includes('p=')) {
      console.log("🚀 [ROUTING DETECTED] GitHub Pages 404 Redirect Hook Active!");
      const urlParams = new URLSearchParams(rawSearch);
      console.log("📦 Parsed 'p' Parameter Route:", urlParams.get('p'));
    }

    if (rawPath.includes('/register')) {
      console.log("🚩 [ROUTE MATCH] Render Target: <PublicRegister /> Component triggered!");
    } else if (rawPath.includes('/view')) {
      console.log("👀 [ROUTE MATCH] Render Target: Profile View Mode triggered!");
    } else {
      console.log("🏠 [ROUTE MATCH] Render Target: Standard Auth / Admin View Flow.");
    }
    console.log("-----------------------------------------------------");
  }, []);

  // स्प्लॅश स्क्रीन टायमर (३ सेकंद)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // यूआरएल मध्ये '/view' आहे का हे तपासणे
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/view')) {
      const isUserLoggedIn = localStorage.getItem('govinda_user');
      
      if (!isUserLoggedIn) {
        localStorage.removeItem('govinda_guest');
        
        setTimeout(() => {
          Swal.fire({
            icon: 'warning',
            title: 'प्रवेश नाकारला! 🛑',
            text: 'शेअर केलेली प्रोफाइल पाहण्यासाठी कृपया आधी सिस्टीममध्ये लॉगिन करा.',
            confirmButtonColor: '#ff6600',
            customClass: { popup: 'rounded-3xl' }
          });
        }, 3500);

        window.history.pushState({}, '', window.location.origin + import.meta.env.BASE_URL);
      } else {
        const cleanSlug = path.replace('/view', '').replace(/\//g, '');
        if (cleanSlug) {
          setDirectViewSlug(cleanSlug);
          setIsGuest(true);
        }
      }
    }
  }, []);

  // localStorage मधून युजर लोड करणे आणि Real-time ब्लॉक चेक करणे
  useEffect(() => {
    const savedUser = localStorage.getItem('govinda_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      // 🛡️ REAL-TIME SECURITY LOCK (फक्त जे खरे ॲडमीन आहेत त्यांच्यासाठीच)
      if (parsedUser.teamUID && parsedUser.role !== 'guest') {
        let userDocRef = doc(db, "users", parsedUser.teamUID);
        
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const dbData = docSnap.data();
            
            if (dbData.isDeleted === true) {
              Swal.fire({
                title: 'अकाउंट बंद केले आहे!',
                text: 'सुपरॲдमीनने तुमचे account डीॲक्टिव्हेट केले आहे.',
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
    } else {
      const savedGuestStatus = localStorage.getItem('govinda_guest');
      if (savedGuestStatus === 'true') {
        setIsGuest(true);
      }
    }
  }, []);

  // गुगलने लॉगिन झाल्यावर डेटाबेसमधील रोल चेक करणे
  const checkUserStatus = async (googleUser) => {
    try {
      const emailLower = googleUser.email.toLowerCase();
      const usersRef = collection(db, "users");
      
      const q = query(usersRef, where("admins", "array-contains", emailLower));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const dbData = userDoc.data();
        const teamUID = userDoc.id;

        if (dbData.isDeleted === true) {
          Swal.fire({
            title: 'अकाउंट बंद केले आहे!',
            text: 'सुरक्षेच्या कारणास्तव तुमचे Account डीॲक्टिव्हेट करण्यात आले आहे.',
            icon: 'error',
            confirmButtonColor: '#ff6600',
            confirmButtonText: 'ठीक आहे'
          });

          await auth.signOut();
          localStorage.removeItem('govinda_user');
          return null; 
        }

        const isSuper = dbData.role === "superadmin";

        const freshUserObj = {
          ...dbData, 
          teamUID: teamUID, 
          info: {
            displayName: googleUser.displayName,
            email: googleUser.email,
            photoURL: googleUser.photoURL
          },
          role: dbData.role || "admin",
          teamName: dbData.teamName || (isSuper ? "मुख्य सुपरॲडमीन पॅनल" : "नॉन-रजिस्टर संघ"),
          uid: dbData.uid || teamUID,
          currentYear: dbData.currentYear || '2026',
          isProfileComplete: isSuper ? true : (dbData.isProfileComplete || false),
          allowInAppForm: dbData.allowInAppForm !== false, 
          teamCategory: dbData.teamCategory || 'Men',
          address: dbData.address || '',
          establishedYear: dbData.establishedYear || '',
          slogan: dbData.slogan || '',
          logoUrl: dbData.logoUrl || googleUser.photoURL, 
          isDeleted: dbData.isDeleted || false 
        };

        localStorage.setItem('govinda_user', JSON.stringify(freshUserObj));
        return freshUserObj;
      } 
      
      // 🎯 मूळ फिक्स: ईमेल आयडी डेटाबेसमध्ये नसेल, तर एरर न दाखवता त्याला थेट गेस्ट म्हणून आत सोडा!
      else {
        console.log("🚩 [GUEST ROUTE] External email logged in. Routing to Guest session.");
        
        localStorage.setItem('govinda_guest', 'true');
        
        const guestUserObj = {
          role: "guest",
          info: {
            displayName: googleUser.displayName,
            email: googleUser.email,
            photoURL: googleUser.photoURL
          }
        };
        
        localStorage.setItem('govinda_user', JSON.stringify(guestUserObj));
        return guestUserObj;
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
        
        if (fullUserData.role === "guest") {
          setIsGuest(true);
          localStorage.setItem('govinda_guest', 'true');
        } else {
          localStorage.removeItem('govinda_guest');
          setIsGuest(false);
        }

        const path = window.location.pathname;
        if (path.includes('/view')) {
          const cleanSlug = path.replace('/view', '').replace(/\//g, '');
          if (cleanSlug) {
            setDirectViewSlug(cleanSlug);
            setIsGuest(true);
            localStorage.setItem('govinda_guest', 'true');
          }
        }
      }
    } else {
      setError(result.error || 'लॉगिन करताना काहीतरी त्रुटी आली.');
    }
    loading_status_set(false);
  };

const handleExploreAsGuest = (targetTab = 'directory') => {
    console.log("=== 🔍 GOVINDA KATTA EXPLORE LOG START ===");
    console.log(`1. Target Tab received: ${targetTab}`);
    console.log("2. Current isGuest state before reset:", isGuest);

    // 🎯 री-रेंडर फोर्स करण्यासाठी आधी स्टेट तात्पुरती false केली
    setIsGuest(false);
    
    setPublicActiveTab(targetTab);
    localStorage.setItem('govinda_guest', 'true');
    localStorage.setItem('active_public_tab', targetTab);
    console.log("3. LocalStorage values updated safely.");

    // 🎯 मायक्रो-टाईमआऊट देऊन स्टेट पुन्हा true केली जेणेकरून रिॲक्ट रेंडर ट्रिगर करेल
    setTimeout(() => {
      setIsGuest(true);
      console.log("4. isGuest state forced to TRUE for screen re-render.");
      console.log("=== 🔍 GOVINDA KATTA EXPLORE LOG END ===");
    }, 10);
  };

  const handleExitGuestMode = () => {
    console.log("=== 🛠️ GOVINDA APP FINAL FIX EXECUTION ===");
    
    // १. गेस्ट स्टेट आणि तात्पुरते स्टोरेज साफ
    setIsGuest(false);
    setDirectViewSlug(null);
    localStorage.removeItem('govinda_guest');

    const isActualUser = localStorage.getItem('govinda_user');
    
    if (!isActualUser) {
      // जर लॉगिन नसेल तर पूर्ण क्लीनअप
      localStorage.removeItem('govinda_user');
      setUser(null);
    } else {
      console.log("🚩 युझर लॉगिन आहे, रोल अपडेट करून बाहेर काढत आहे...");
      
      try {
        const parsedUser = JSON.parse(isActualUser);
        
        // 🎯 मॅजिक फिक्स १: युझर ऑब्जेक्टमधील 'role' बदलून तो रिकामी किंवा 'viewer' करा!
        // यामुळे App.jsx मधील (user.role === 'guest') ही अट तात्काळ ब्रेक (False) होईल!
        parsedUser.role = 'authenticated_viewer'; 
        
        // लोकल स्टोरेजमध्येही हा बदल अपडेट करा जेणेकरून पुढच्या वेळी अडचण येणार नाही
        localStorage.setItem('govinda_user', JSON.stringify(parsedUser));
        
        // स्टेट अपडेट करा
        setUser(parsedUser);
        console.log("🎯 User role updated to clear PublicDashboard block!");
      } catch (e) {
        console.error("❌ User parse error:", e);
      }
    }
    
    // 🎯 मॅजिक फिक्स २: जर तुमच्या सिस्टीममध्ये 'showReports' किंवा इतर कोणतीही डॅशबोर्ड स्टेट असेल,
    // तर ती इथे फॉल्स (false) करा जेणेकरून युझर थेट मुख्य लँडिंग पेजवर दिसेल!
    if (typeof setShowReports === 'function') setShowReports(false);
    if (typeof setIsExploreMode === 'function') setIsExploreMode(false);

    // युआरएल मूळ जागी सेट करा
    const finalUrl = window.location.origin + import.meta.env.BASE_URL;
    window.history.pushState({}, '', finalUrl);
    
    console.log("=== 🛠️ GOVINDA APP FINAL FIX END ===");
  };

  const loading_status_set = (val) => {
    setLoading(val);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('govinda_user');
    localStorage.removeItem('govinda_guest');
    window.location.reload();
  };

  const handleProfileComplete = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('govinda_user', JSON.stringify(updatedUser));
  };

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  // 🎯 कडक बदल: जर युझरने फुटरमधील पॉलिसी पेजेसवर क्लिक केले, तर ते पेज इथे रेंडर होईल
if (currentPublicPage === 'about') return <AboutUs onBack={() => setCurrentPublicPage(null)} setCurrentPublicPage={setCurrentPublicPage} />;
if (currentPublicPage === 'privacy') return <PrivacyPolicy onBack={() => setCurrentPublicPage(null)} setCurrentPublicPage={setCurrentPublicPage} />;
if (currentPublicPage === 'terms') return <TermsAndConditions onBack={() => setCurrentPublicPage(null)} setCurrentPublicPage={setCurrentPublicPage} />;
if (currentPublicPage === 'faq') return <FAQAndManual onBack={() => setCurrentPublicPage(null)} setCurrentPublicPage={setCurrentPublicPage} />;


// 🎯 सुधारित रेंडर कंडिशन: युझर विना-लॉगिन आला असेल, 'guest' रोलचा असेल, 
  // किंवा तो लॉगिन असताना त्याने लँडिंग पेजवरून 'गोविंदा कट्टा' बटणावर क्लिक केले असेल (isGuest === true),
  // या तिन्ही प्रकारांत त्याला सरळ कट्टा दाखवलाच पाहिजे! 🚀
  if ((!user && isGuest) || (user && user.role === 'guest') || isGuest) {
    return (
      <PublicDashboard 
        onBackToAdmin={handleExitGuestMode} 
        directSlug={directViewSlug} 
        initialTab={publicActiveTab} 
        handleLogin={handleLogin}
      />
    );
  }

  // सुपरॲडमीन राउटिंग
  if (user && user.role === 'superadmin') {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  // सामान्य ॲडमीन राउटिंग
  if (user && user.role === 'admin') {
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
              isEditMode={true} 
              setIsEditMode={() => {}}
              handleProfileComplete={handleProfileComplete} 
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

return (
    <div className="min-h-screen bg-[#03060f] text-white">
      
      {/* १. तुमचे मुख्य लँडिंग पेज */}
      <LandingPage 
        handleLogin={handleLogin} 
        handleExploreAsGuest={handleExploreAsGuest} 
        loading={loading} 
        error={error} 
        setCurrentPublicPage={setCurrentPublicPage} 
      />

      {/* २. 💸 मोबाईलसाठी तळाची चिकटलेली ॲड (फक्त लँडिंग पेजवर असताना दिसेल) */}
      <AdMobileBottom />

    </div>
  );
}