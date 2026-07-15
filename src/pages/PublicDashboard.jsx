import React, { useState, useEffect } from 'react';
import { Users, BarChart3, Menu, X, Home, Megaphone, Calendar, Trophy, BookOpen } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; 

// 🎯 आपला नवीन कॉमन ग्लोबल साईडबार कॉम्पोनेंट
import Sidebar from '../components/Sidebar';

// कॉम्पोनेंट्स इम्पोर्ट हब
import PublicDirectory from '../components/PublicDirectory';
import PublicStats from '../components/PublicStats';
import PublicInfo from '../components/PublicInfo';
import PublicNews from '../components/PublicNews';
import PublicEvents from '../components/PublicEvents';
import PublicRecords from '../components/PublicRecords';
import PublicArticles from '../components/PublicArticles';

// मोबाईलसाठी तळाची चिकटलेली ॲड बार
import AdMobileBottom from '../components/AdMobileBottom';

export default function PublicDashboard({ 
  handleLogin, 
  onBackToAdmin, 
  initialTab = 'directory',
  isEmbeddedView = false,     // पॅच: सुपर किंवा मंडळ ॲडमीनच्या आत उघडल्यास हे ट्रु होईल
  embeddedTab = 'directory',  // साईडबार कडून येणारा चालू टॅब
  setEmbeddedTab              // साईडबारचा टॅब बदलण्याचे फंक्शन
}) {
  
  // डॅशबोर्डमधील फिल्टर्स स्टेट्स (आता एकाच जागी सुरक्षित लॉक 🔒)
  const [statsCategoryFilter, setStatsCategoryFilter] = useState('All');
  const [statsTharaFilter, setStatsTharaFilter] = useState('All');
  const [statsDistrictFilter, setStatsDistrictFilter] = useState('All');
  const [statsAreaFilter, setStatsAreaFilter] = useState('');

  // मोबाईल मेनू ओपन/क्लोज स्टेट
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState('mr'); 

  // व्ह्यू नुसार टॅबची स्टेट निवडणे
  const [localTab, setLocalTab] = useState(() => {
    const savedTab = localStorage.getItem('active_public_tab');
    if (savedTab) {
      localStorage.removeItem('active_public_tab');
      return savedTab;
    }
    return initialTab;
  });

  const currentTab = isEmbeddedView ? embeddedTab : localTab;

  const setCurrentTab = (tabId) => {
    if (isEmbeddedView && setEmbeddedTab) {
      setEmbeddedTab(tabId);
    } else {
      setLocalTab(tabId);
    }
  };

  // 🔄 ॲटो-कॅश इनव्हॅलिडेशन इंजिन
  useEffect(() => {
    const checkAppVersionAndClearCache = async () => {
      try {
        const configRef = doc(db, "public_site_cache", "system_config");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const serverVersion = configSnap.data().version || 1.0;
          const localVersion = localStorage.getItem('mcg_local_db_version');
          
          if (localVersion && parseFloat(localVersion) < parseFloat(serverVersion)) {
            console.log("🔄 [Cache System]: IndexedDB कॅश साफ होत आहे...");
            if (window.indexedDB) {
              window.indexedDB.deleteDatabase("firestore/[DEFAULT]/maharashtracha-govinda/main"); 
            }
            localStorage.setItem('mcg_local_db_version', serverVersion.toString());
            window.location.reload(); 
          } else if (!localVersion) {
            localStorage.setItem('mcg_local_db_version', serverVersion.toString());
          }
        }
      } catch (err) { console.error("Cache engine check failed:", err); }
    };
    checkAppVersionAndClearCache();
  }, []);

  // टॅब बदलल्यावर अचूक कॉम्पोनेंट रेंडर करणे
  const renderTabContent = () => {
    switch (currentTab) {
      case 'directory':
      case 'govinda_katta':
        return (
          <PublicDirectory 
            handleLogin={handleLogin}
            initialDistrict={statsDistrictFilter}
            initialArea={statsAreaFilter}
            initialThara={statsTharaFilter}
            initialCategory={statsCategoryFilter}
            clearFilters={() => {
              setStatsDistrictFilter('All');
              setStatsAreaFilter('');
              setStatsTharaFilter('All');
              setStatsCategoryFilter('All');
            }}
          />
        );
      case 'stats':
      case 'public_stats':
        return (
          <PublicStats 
            onDistrictClick={(districtName) => {
              setStatsDistrictFilter(districtName); setStatsAreaFilter(''); setStatsTharaFilter('All'); setStatsCategoryFilter('All');
              setCurrentTab(isEmbeddedView ? 'govinda_katta' : 'directory');
            }}
            onAreaClick={(districtName, areaName) => {
              setStatsDistrictFilter(districtName); setStatsAreaFilter(areaName.trim()); setStatsTharaFilter('All'); setStatsCategoryFilter('All');
              setCurrentTab(isEmbeddedView ? 'govinda_katta' : 'directory');
            }}
            onTharaClick={(tharaCount) => {
              setStatsDistrictFilter('All'); setStatsAreaFilter(''); setStatsCategoryFilter('All'); setStatsTharaFilter(tharaCount.toString());
              setCurrentTab(isEmbeddedView ? 'govinda_katta' : 'directory');
            }}
            onCategoryClick={(categoryName) => {
              setStatsDistrictFilter('All'); setStatsAreaFilter(''); setStatsTharaFilter('All'); setStatsCategoryFilter(categoryName);
              setCurrentTab(isEmbeddedView ? 'govinda_katta' : 'directory');
            }}
          />
        );
      case 'rules':
      case 'public_info': 
        return <PublicInfo />;
      case 'public_news': 
        return <PublicNews />;
      case 'public_events': 
        return <PublicEvents />;
      case 'public_records': 
        return <PublicRecords />;
      case 'articles': 
        return <PublicArticles />;
      default: 
        return <PublicDirectory handleLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans antialiased pb-16 md:pb-0 select-none text-slate-700">
      
      {/* 👑 १. इंजेक्टेड ग्लोबल सामायिक साईडबार (फक्त विदाऊट लॉगिन/पब्लिक व्ह्यू असेल तरच दिसेल) */}
      {!isEmbeddedView && (
        <Sidebar 
          userRole="public"
          hasFormAccess={false}
          activeTab={currentTab}
          setActiveTab={setCurrentTab}
          isMenuOpen={isMobileMenuOpen}
          setIsMenuOpen={setIsMobileMenuOpen}
          onLogout={onBackToAdmin}
          lang={lang}
          handleLogin={handleLogin} // 🎯 थेट App.jsx मधून आलेले मूळ फंक्शन इथे पास आहे
          setEmbeddedTab={setEmbeddedTab} // 🎯 फक्त ही १ ओळ इथे पास करून द्या!
        />
      )}

      {/* 🖥️ २. मुख्य कार्यक्षेत्र */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto z-10 w-full max-h-screen">
        <div className="w-full space-y-4">
          
          {/* 🌐 ड्युअल लँग्वेज फ्रंटएंड स्विचर (फक्त पब्लिक विदाऊट लॉगिन मोडमध्ये वरती उजवीकडे क्लीन दिसेल) */}
          {!isEmbeddedView && (
            <div className="flex justify-end mb-2">
              <div className="flex bg-slate-200/60 p-0.5 rounded-lg space-x-0.5 border shadow-sm">
                <button onClick={() => setLang('mr')} className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${lang === 'mr' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:text-slate-900'}`}>मराठी</button>
                <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${lang === 'en' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:text-slate-900'}`}>English</button>
              </div>
            </div>
          )}

          {/* कॉम्पोनेंट लोड AREA */}
          <div className="w-full animate-in fade-in duration-200">
            {renderTabContent()}
          </div>

        </div>
      </div>

      <AdMobileBottom />

      {/* 📱 मोबाईल स्क्रीनसाठी सुधारित बॉटम बार (फक्त पब्लिक विदाऊट लॉगिन मोडमध्येच दिसेल) */}
      {!isEmbeddedView && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-1.5 flex justify-around items-center shadow-lg z-30 h-16">
          {[
            { id: 'directory', label: lang === 'mr' ? 'गोविंदा कट्टा' : 'Govinda Katta', icon: <Users size={18} /> },
            { id: 'stats', label: lang === 'mr' ? 'आकडेवारी' : 'Stats', icon: <BarChart3 size={18} /> },
            { id: 'public_events', label: lang === 'mr' ? 'सराव कट्टा' : 'Practice', icon: <Calendar size={18} /> },
            { id: 'public_records', label: lang === 'mr' ? 'रेकॉर्ड्स' : 'Records', icon: <Trophy size={18} /> }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setCurrentTab(item.id)} 
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${currentTab === item.id ? 'text-orange-500 font-black scale-105' : 'text-slate-400 font-bold'}`}
            >
              {item.icon}
              <span className="text-[9px] mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}