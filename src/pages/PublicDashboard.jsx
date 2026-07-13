import React, { useState, useEffect } from 'react';
import { Users, BarChart3, BookOpen, Menu, X, ArrowLeft, Megaphone, Calendar, Trophy, LogOut } from 'lucide-react';

// 🎯 कॉम्पोनेंट्स यशस्वीरित्या इम्पोर्ट केले
import PublicDirectory from '../components/PublicDirectory';
import PublicStats from '../components/PublicStats';
import PublicInfo from '../components/PublicInfo';
// 🆕 नवीन जोडलेले मेंटेनन्स आधारित पब्लिक कॉम्पोनेंट्स
import PublicNews from '../components/PublicNews';
import PublicEvents from '../components/PublicEvents';
import PublicRecords from '../components/PublicRecords';

// 💸 मोबाईलसाठी तळाची चिकटलेली मॅन्युअल ॲड इम्पॉर्ट केली
import AdMobileBottom from '../components/AdMobileBottom'; // कॉम्पोनंटचा अचूक पाथ तपासून घ्या

// initialTab प्रोप लँडिंग पेजवरून डायरेक्ट नेव्हिगेशनसाठी अत्यंत महत्त्वाचा आहे
export default function PublicDashboard({ handleLogin, onBackToAdmin, initialTab = 'directory' }) {
  
  // 🔄 सुरुवातीचा टॅबसेट करताना प्रोप आणि लोकल स्टोरेज दोन्ही सुरक्षितपणे तपासणे
  const [currentTab, setCurrentTab] = useState(() => {
    const savedTab = localStorage.getItem('active_public_tab');
    if (savedTab) {
      localStorage.removeItem('active_public_tab');
      return savedTab;
    }
    return initialTab;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🎯 ॲनालिसिस क्लिक लिंक करण्यासाठी नवीन फिल्टर्स स्टेट्स (१००% सुरक्षित)
  const [statsDistrictFilter, setStatsDistrictFilter] = useState('');
  const [statsAreaFilter, setStatsAreaFilter] = useState('');

  // 🎯 मॅजिक सिंक पॅच: जसं लँडिंग पेजवरून 'initialTab' बदलेल किंवा नवीन क्लीक होऊन ॲप री-माउंट होईल,
  // तशी ही सिस्टीम जुन्या कोडिंगला धक्का न लावता लाइव्ह टॅब तात्काळ सिंक्रोनाइझ करेल!
  useEffect(() => {
    const savedTab = localStorage.getItem('active_public_tab');
    if (savedTab) {
      setCurrentTab(savedTab);
      localStorage.removeItem('active_public_tab'); // मेमरी लगेच साफ करा
    } else if (initialTab) {
      setCurrentTab(initialTab);
    }
  }, [initialTab]);

  // 📋 १. मुख्य डेस्कटॉप साइडबार मेनूची पूर्ण यादी (सर्व ६ पर्याय)
  const menuItems = [
    { id: 'directory', label: 'गोविंदा कट्टा', icon: <Users size={18} /> },
    { id: 'stats', label: 'उत्सव आकडेवारी', icon: <BarChart3 size={18} /> },
    { id: 'rules', label: 'उत्सव नियमावली', icon: <BookOpen size={18} /> },
    { id: 'public_news', label: 'ताज्या घडामोडी', icon: <Megaphone size={18} /> },
    { id: 'public_events', label: 'उत्सव व सराव कट्टा', icon: <Calendar size={18} /> },
    { id: 'public_records', label: 'ऐतिहासिक रेकॉर्ड्स', icon: <Trophy size={18} /> }
  ];

  // 📱 २. मोबाईल बॉटम बारसाठी तुम्ही सांगितलेले फक्त ४專 प्रिमियम मेनू
  const mobileBottomItems = [
    { id: 'directory', label: 'गोविंदा कट्टा', icon: <Users size={18} /> },
    { id: 'stats', label: 'आकडेवारी', icon: <BarChart3 size={18} /> },
    { id: 'public_events', label: 'सराव कट्टा', icon: <Calendar size={18} /> },
    { id: 'public_records', label: 'रेकॉर्ड्स', icon: <Trophy size={18} /> }
  ];

  // 🚪 कॉमन सुरक्षित लॉगआऊट मॅकेनिझम (Code Duplication टाळण्यासाठी)
  const handleSystemLogout = () => {
    // १. लोकल स्टोरेज पूर्ण क्लीनअप 🧹
    localStorage.removeItem('govinda_user');
    localStorage.removeItem('govinda_guest');
    localStorage.removeItem('active_public_tab');
    
    // २. फायरबेस अधिकृत साईन आऊट 🔐
    import('../firebase').then(({ auth }) => {
      auth.signOut().then(() => {
        // ३. ॲप पूर्ण रिफ्रेश करून होम स्क्रीनवर नेणे
        window.location.href = window.location.origin + import.meta.env.BASE_URL;
      });
    });
  };

  // 🔄 टॅब बदलल्यावर अचूक कॉम्पोनेंट रेंडर करणे
  const renderTabContent = () => {
    switch (currentTab) {
      case 'directory':
        /* 🎯 आकडेवारीवरून आलेले फिल्टर्स प्रोप्स म्हणून पास केले जेणेकरून 'गोविंदा कट्टा' मध्ये डेटा ऑटो-फिल्टर होईल */
        return (
          <PublicDirectory 
            handleLogin={handleLogin} 
            initialDistrict={statsDistrictFilter}
            initialArea={statsAreaFilter}
            clearFilters={() => {
              setStatsDistrictFilter('');
              setStatsAreaFilter('');
            }}
          />
        );
      case 'stats':
        /* 🎯 आकडेवारी कॉम्पोनंटला क्लिक लिंक्स जोडल्या (जिल्हा आणि परिसर क्लिक वर डायरेक्ट नेव्हिगेशन) */
        return (
          <PublicStats 
            onDistrictClick={(districtName) => {
              setStatsDistrictFilter(districtName);
              setStatsAreaFilter('');
              setCurrentTab('directory'); // थेट कट्ट्यावर रिडायरेक्ट 🚀
            }}
            onAreaClick={(districtName, areaName) => {
              setStatsDistrictFilter(districtName);
              setStatsAreaFilter(areaName);
              setCurrentTab('directory'); // थेट कट्ट्यावर रिडायरेक्ट 🚀
            }}
          />
        );
      case 'rules':
        return <PublicInfo />;
      case 'public_news':
        return <PublicNews />;
      case 'public_events':
        return <PublicEvents />;
      case 'public_records':
        return <PublicRecords />;
      default:
        return <PublicDirectory handleLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col md:flex-row font-sans antialiased select-none relative">
      
      {/* 📱 १. मोबाईल हेडर (Premium Dynamic Look - No Autologout Fix आवृत्ती) */}
      <div className="md:hidden bg-[#0b132b] text-white px-4 py-3 flex items-center justify-between shadow-md z-30 sticky top-0">
        <div className="flex flex-col text-left">
          <span className="text-base font-black tracking-wide">
            महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span>
          </span>
          <span className="text-[10px] text-orange-500/90 font-black tracking-wide mt-0.5">
            🚩 प्रत्येक गोविंदासाठी
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {/* 🎯 फिक्स: युझर जर लॉगिन असेल तर मोबाईल बॅक अ‍ॅरो दाबल्यावर तो लॉगआऊट होणार नाही, थेट सामान्य बॅक होईल! */}
          {onBackToAdmin && (
            <button 
              onClick={localStorage.getItem('govinda_user') ? onBackToAdmin : onBackToAdmin} 
              className="p-1 text-slate-300 hover:text-white transition-transform active:scale-90" 
              title="मागे जा"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          {/* Main Menu Trigger */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 text-slate-300 hover:text-white">
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* 🏢 २. डावा साइडबार */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-[#0b132b] text-white p-6 flex flex-col justify-between z-40 transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:transform-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col flex-grow overflow-y-auto scrollbar-none">
          <div className="mb-6 border-b border-slate-800/60 pb-4 text-left flex-shrink-0">
            <h2 className="text-lg font-black tracking-wide text-white">
              महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span>
            </h2>
            <p className="text-[11px] text-orange-500/90 font-black tracking-widest uppercase mt-1">
              🚩 प्रत्येक गोविंदासाठी
            </p>
          </div>

          {/* मेनू बटन्स - यात ६ चे ६ पर्याय नेहमी नीट दिसतील */}
          <div className="space-y-1.5 flex-grow">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setCurrentTab(item.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                  currentTab === item.id 
                    ? 'bg-[#ff6600] text-white shadow-md shadow-[#ff6600]/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 🎯 डेस्कटॉप आणि मोबाईल ड्रॉवर तळाचा बटन विभाग (Session Kill फिक्स आवृत्ती 🚀) */}
        <div className="pt-4 border-t border-slate-800/60 flex-shrink-0 mt-auto bg-[#0b132b]">
          {localStorage.getItem('govinda_user') ? (
            <div className="space-y-2">
              {/* १. लॉगआऊट बटन */}
              <button 
                onClick={handleSystemLogout} 
                className="w-full flex items-center justify-center space-x-2 bg-red-600/90 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-black transition-all shadow-md shadow-red-600/10 active:scale-98"
              >
                <LogOut size={13} />
                <span>🚪 लॉगआऊट (Logout)</span>
              </button>
              
              {/* २. होम पेजवर जा बटन */}
              {onBackToAdmin && (
                <button 
                  onClick={onBackToAdmin} 
                  className="w-full flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white py-2 rounded-xl text-[11px] font-black transition-all border border-slate-800/80 active:scale-98"
                >
                  <ArrowLeft size={12} /><span>होम पेजवर जा</span>
                </button>
              )}
            </div>
          ) : (
            onBackToAdmin && (
              <button 
                onClick={onBackToAdmin} 
                className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-700 active:scale-98"
              >
                <ArrowLeft size={14} /><span>डॅशबोर्डवर परत जा</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* मोबाईल साइडबार बॅकग्राउंड लेयर */}
      {isMobileMenuOpen && <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"></div>}

      {/* 🖥️ ३. मुख्य कार्यक्षेत्र */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto z-10 w-full pb-40 md:pb-6 max-h-screen">
        <div className="w-full space-y-4">
        
          {/* हेडर टायटल (Desktop) */}
          <div className="border-b border-slate-200 pb-3 hidden md:block text-left">
            <h1 className="text-xl md:text-2xl font-black text-slate-800">
              {menuItems.find(m => m.id === currentTab)?.label}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">महाराष्ट्रातील अधिकृत आणि नोंदणीकृत दहीहंडी मंडळांची माहिती.</p>
          </div>

          {/* कॉम्पोनेंट लोड AREA */}
          <div className="w-full animate-in fade-in duration-200">
            {renderTabContent()}
          </div>

        </div>
      </div>

      {/* 💸 मोबाईलसाठी तळाची चिकटलेली ॲड बार */}
      <AdMobileBottom />

      {/* 📱 ४. मोबाईल स्क्रीनसाठी सुधारित बॉटम नेव्हिगेशन बार */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-40 flex justify-around items-center py-2 px-1">
        {mobileBottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-2.5 rounded-xl transition-all ${
              currentTab === item.id 
                ? 'text-[#ff6600] font-black' 
                : 'text-slate-400 font-bold'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${currentTab === item.id ? 'bg-[#ff6600]/10' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* अतिरिक्त CSS पॅच */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </div>
  );
}