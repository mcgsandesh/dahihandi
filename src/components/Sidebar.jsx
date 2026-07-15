import React, { useEffect } from 'react';
import { 
  Users, BarChart3, BookOpen, Menu, X, Home,
  Megaphone, Calendar, Trophy, LogOut, LayoutDashboard, 
  Package, FileText, Settings, Layers, User, Lock 
} from 'lucide-react';

export default function Sidebar({ 
  userRole,         
  hasFormAccess,    
  activeTab,        
  setActiveTab,     
  isMenuOpen,       
  setIsMenuOpen,    
  onLogout,         
  teamName,         
  uid,              
  lang = 'mr',      
  handleLogin,
  setEmbeddedTab 
}) {

  const translations = {
    mr: {
      brand: "महाराष्ट्राचा", subBrand: "गोविंदा",
      superadmin: "Superadmin Dashboard", defaultSub: "प्रत्येक गोविंदासाठी",
      logout: "लॉगआऊट करा", goHome: "मुख्य पानावर जा",
      login: "लॉगिन करा", 
      teams: "टीम्स मॅनेजमेंट", dashboard: "डॅशबोर्ड", players: "खेळाडू यादी",
      inventory: "इन्व्हेंटरी", reports: "रिपोर्ट पॅनेल", profile: "संघ प्रोफाईल",
      settings: "सेटिंग्ज", katta: "गोविंदा कट्टा", stats: "उत्सव आकडेवारी",
      rules: "उत्सव नियमावली", news: "ताज्या घडामोडी", events: "उत्सव व सराव कट्टा",
      records: "ऐतिहासिक रेकॉर्ड्स", articles: "दहीहंडी ज्ञानपीठ",
      manage_articles: "लेख व्यवस्थापन", manage_maintenance: "सिस्टीम मेंटेनन्स"
    },
    en: {
      brand: "Maharashtracha", subBrand: "Govinda",
      superadmin: "Superadmin Dashboard", defaultSub: "For Every Govinda",
      logout: "Logout", goHome: "Go to Home Page",
      login: "Login", 
      teams: "Teams Management", dashboard: "Dashboard", players: "Players List",
      inventory: "Inventory", reports: "Report Panel", profile: "Team Profile",
      settings: "Settings", katta: "Govinda Katta", stats: "Festival Stats",
      rules: "Festival Rules", news: "Latest Updates", events: "Events & Practice",
      records: "Historical Records", articles: "Govinda Knowledge Base",
      manage_articles: "Manage Articles", manage_maintenance: "System Maintenance"
    }
  };

  const t = translations[lang] || translations['mr'];

  const masterMenu = [
    { id: 'teams', label: t.teams, icon: <Layers size={16} />, show: userRole === 'superadmin' },
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard size={16} />, show: userRole === 'admin' && hasFormAccess },
    { id: 'players', label: t.players, icon: <Users size={16} />, show: userRole === 'admin' && hasFormAccess },
    { id: 'inventory', label: t.inventory, icon: <Package size={16} />, show: userRole === 'admin' && hasFormAccess },
    { id: 'reports', label: t.reports, icon: <FileText size={16} />, show: userRole === 'admin' && hasFormAccess },
    { id: 'profile', label: t.profile, icon: <User size={16} />, show: userRole === 'admin' },
    { id: 'settings', label: t.settings, icon: <Settings size={16} />, show: userRole === 'admin' && hasFormAccess },

    { id: userRole === 'public' ? 'directory' : 'govinda_katta', label: t.katta, icon: <Users size={16} />, show: true },
    { id: userRole === 'public' ? 'stats' : 'public_stats', label: t.stats, icon: <BarChart3 size={16} />, show: true },
    { id: userRole === 'public' ? 'rules' : 'public_info', label: t.rules, icon: <BookOpen size={16} />, show: true },
    { id: userRole === 'public' ? 'public_news' : 'public_news', label: t.news, icon: <Megaphone size={16} />, show: true },
    { id: userRole === 'public' ? 'public_events' : 'public_events', label: t.events, icon: <Calendar size={16} />, show: true },
    { id: userRole === 'public' ? 'public_records' : 'public_records', label: t.records, icon: <Trophy size={16} />, show: true },
    { id: 'articles', label: t.articles, icon: <BookOpen size={16} />, show: true },

    { id: 'manage_articles', label: t.manage_articles, icon: <FileText size={16} />, show: userRole === 'superadmin' },
    { id: 'manage_maintenance', label: t.manage_maintenance, icon: <Settings size={16} />, show: userRole === 'superadmin' }
  ];

  const visibleMenu = masterMenu.filter(item => item.show);

  const isTabActive = (itemId) => {
    if (activeTab === itemId) return true;
    if (itemId === 'directory' && activeTab === 'govinda_katta') return true;
    if (itemId === 'govinda_katta' && activeTab === 'directory') return true;
    if (itemId === 'stats' && activeTab === 'public_stats') return true;
    if (itemId === 'public_stats' && activeTab === 'stats') return true;
    if (itemId === 'rules' && activeTab === 'public_info') return true;
    if (itemId === 'public_info' && activeTab === 'rules') return true;
    return false;
  };

  return (
    <>
      {/* 📱 मोबाईल टॉप हेडर */}
      <div className="md:hidden bg-[#0f172a] text-white px-4 py-3 flex items-center justify-between shadow-md z-30 sticky top-0 w-full">
        <div className="flex items-center space-x-2.5 min-w-0">
          <button onClick={() => setIsMenuOpen && setIsMenuOpen(!isMenuOpen)} className="p-1.5 hover:bg-white/10 rounded-xl text-white transition-all active:scale-95">
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[10px] font-black tracking-wide text-slate-400">
              {t.brand} <span className="text-orange-500">{t.subBrand}</span>
            </span>
            {teamName && <span className="text-xs font-bold uppercase truncate tracking-tight text-white max-w-[150px]">{teamName}</span>}
          </div>
        </div>
        {uid && <div className="bg-orange-500/10 border border-orange-500/30 text-orange-500 px-2.5 py-1 rounded-xl text-[10px] font-black font-mono shadow-sm">{uid}</div>}
      </div>

      {/* 🏢 मुख्य डेस्कटॉप व मोबाईल साइडबार */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-[#0f172a] text-slate-200 p-5 z-40 transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:transform-none flex flex-col justify-between overflow-hidden border-r border-slate-800/40 ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="mb-4 text-left flex-shrink-0">
            <h2 className="text-base font-black tracking-wide text-white">
              {t.brand} <span className="text-orange-500">{t.subBrand}</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-0.5">
              {userRole === 'superadmin' ? t.superadmin : teamName || t.defaultSub}
            </p>
          </div>

          {/* 🏠 होम बटण: Deep Logging System 🕵️‍♂️ */}
          <div className="mb-4 border-b border-slate-800 pb-3 flex-shrink-0">
          <button 
  type="button"
  onClick={(e) => { 
    e.preventDefault();
    console.warn("🔍 [DEEP LOG]: होम बटण क्लिक झाले!");
    setIsMenuOpen(false); 
    
    if (userRole === 'public') {
      if (onLogout) onLogout(); 
    } else {
      const targetTab = userRole === 'superadmin' ? 'teams' : (hasFormAccess ? 'dashboard' : 'profile');
      
      console.log(`⚡ [Executing]: पॅरेंट टॅब ${targetTab} वर स्विच करत आहे...`);
      
      // दोन्ही फंक्शन्सना एकाच वेळी फायर करूया
      if (setActiveTab) setActiveTab(targetTab);
      if (setEmbeddedTab) setEmbeddedTab(targetTab);
      
      console.log("✅ [Success]: टॅब स्टेट अपडेट कमांड पाठवली!");
    }
  }}
  className="w-full flex items-center space-x-3 px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 text-orange-400 hover:text-orange-500 rounded-xl font-black text-xs transition-all border border-slate-700/50 shadow-sm active:scale-98"
>
  <Home size={16} />
  <span>{t.goHome}</span>
</button>
          </div>

          {/* मेनू यादी */}
          <div className="space-y-1 flex-grow overflow-y-auto scrollbar-none pr-1">
            {visibleMenu.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { 
                  if (setActiveTab) setActiveTab(item.id); 
                  if (setIsMenuOpen) setIsMenuOpen(false); 
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${isTabActive(item.id) ? 'bg-orange-500 text-white shadow-md shadow-orange-500/15' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* तळाचा कप्पा */}
        <div className="pt-4 border-t border-slate-800 flex-shrink-0 bg-[#0f172a] pb-16 md:pb-0">
          {userRole === 'public' ? (
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault(); 
                if (setIsMenuOpen) setIsMenuOpen(false);
                if (handleLogin) handleLogin(); 
              }}
              className="w-full flex items-center justify-center space-x-2 bg-orange-500 text-white py-2.5 rounded-xl text-xs font-black hover:bg-orange-600 transition-all active:scale-98 shadow-md border border-orange-600"
            >
              <Lock size={14} />
              <span>{t.login}</span>
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => {
                if (setIsMenuOpen) setIsMenuOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full flex items-center justify-center space-x-2 bg-red-500/10 text-red-400 py-2.5 rounded-xl text-xs font-bold border border-red-500/10 hover:bg-red-600 hover:text-white transition-all active:scale-98 shadow-sm"
            >
              <LogOut size={14} />
              <span>{t.logout}</span>
            </button>
          )}
        </div>
      </div>

      {isMenuOpen && <div onClick={() => setIsMenuOpen && setIsMenuOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"></div>}
    </>
  );
}