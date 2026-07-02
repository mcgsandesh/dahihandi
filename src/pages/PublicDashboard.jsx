import React, { useState } from 'react';
import { Users, BarChart3, BookOpen, Menu, X, ArrowLeft, Megaphone, Calendar, Trophy } from 'lucide-react';

// 🎯 कॉम्पोनेंट्स यशस्वीरित्या इम्पोर्ट केले
import PublicDirectory from '../components/PublicDirectory';
import PublicStats from '../components/PublicStats';
import PublicInfo from '../components/PublicInfo';
// 🆕 नवीन जोडलेले मेंटेनन्स आधारित पब्लिक कॉम्पोनेंट्स
import PublicNews from '../components/PublicNews';
import PublicEvents from '../components/PublicEvents';
import PublicRecords from '../components/PublicRecords';

export default function PublicDashboard({ onBackToAdmin }) {
  const [currentTab, setCurrentTab] = useState('directory');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 📋 १. मुख्य डेस्कटॉप साइडबार मेनूची पूर्ण यादी (सर्व ६ पर्याय)
  const menuItems = [
    { id: 'directory', label: 'गोविंदा कट्टा', icon: <Users size={18} /> },
    { id: 'stats', label: 'उत्सव आकडेवारी', icon: <BarChart3 size={18} /> },
    { id: 'rules', label: 'उत्सव नियमावली', icon: <BookOpen size={18} /> },
    { id: 'public_news', label: '📢 ताज्या घडामोडी', icon: <Megaphone size={18} /> },
    { id: 'public_events', label: '📅 उत्सव व सराव कट्टा', icon: <Calendar size={18} /> },
    { id: 'public_records', label: '🏆 ऐतिहासिक रेकॉर्ड्स', icon: <Trophy size={18} /> }
  ];

  // 📱 २. मोबाईल बॉटम बारसाठी तुम्ही सांगितलेले फक्त ४ स्पेसिफिक प्रिमियम मेनू
  const mobileBottomItems = [
    { id: 'directory', label: 'गोविंदा कट्टा', icon: <Users size={18} /> },
    { id: 'stats', label: 'आकडेवारी', icon: <BarChart3 size={18} /> },
    { id: 'public_events', label: 'सराव कट्टा', icon: <Calendar size={18} /> },
    { id: 'public_records', label: 'रेकॉर्ड्स', icon: <Trophy size={18} /> }
  ];

  // 🔄 टॅब बदलल्यावर अचूक कॉम्पोनेंट रेंडर करणे
  const renderTabContent = () => {
    switch (currentTab) {
      case 'directory':
        return <PublicDirectory />;
      case 'stats':
        return <PublicStats />;
      case 'rules':
        return <PublicInfo />;
      case 'public_news':
        return <PublicNews />;
      case 'public_events':
        return <PublicEvents />;
      case 'public_records':
        return <PublicRecords />;
      default:
        return <PublicDirectory />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col md:flex-row font-sans antialiased select-none">
      
      {/* 📱 १. मोबाईल हेडर (Premium Dynamic Look) */}
      <div className="md:hidden bg-[#0b132b] text-white px-4 py-3 flex items-center justify-between shadow-md z-30">
        <div className="flex flex-col text-left">
          <span className="text-base font-black tracking-wide">
            महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span>
          </span>
          <span className="text-[10px] text-orange-500/90 font-black tracking-wide mt-0.5">
            🚩 प्रत्येक गोविंदासाठी
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {onBackToAdmin && (
            <button onClick={onBackToAdmin} className="p-1 text-slate-300 hover:text-white" title="डॅशबोर्डवर परत जा">
              <ArrowLeft size={20} />
            </button>
          )}
          {/* मेनू उघडण्याचे बटन */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 text-slate-300 hover:text-white">
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* 🏢 २. डावा साइडबार (डेस्कटॉप आणि मोबाईल ड्रॉवरसाठी) */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-[#0b132b] text-white p-6 flex flex-col justify-between z-40 transform transition-transform duration-300 ease-in-out md:relative md:transform-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div>
          <div className="mb-8 border-b border-slate-800/60 pb-4 text-left">
            <h2 className="text-lg font-black tracking-wide text-white">
              महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span>
            </h2>
            <p className="text-[11px] text-orange-500/90 font-black tracking-widest uppercase mt-1">
              🚩 प्रत्येक गोविंदासाठी
            </p>
          </div>

          {/* मेनू बटन्स - यात ६ चे ६ पर्याय नेहमी नीट दिसतील */}
          <div className="space-y-1.5">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setCurrentTab(item.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
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

        {/* डॅशबोर्डवर बॅक जाण्यासाठी बटण */}
        {onBackToAdmin && (
          <button 
            onClick={onBackToAdmin} 
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-700"
          >
            <ArrowLeft size={14} /><span>डॅशबोर्डवर परत जा</span>
          </button>
        )}
      </div>

      {/* मोबाईल साइडबार बॅकग्राउंड लेयर */}
      {isMobileMenuOpen && <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden"></div>}

      {/* 🖥️ ३. मुख्य कार्यक्षेत्र */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto z-10 w-full pb-24 md:pb-6">
        <div className="w-full space-y-4">
          
          {/* हेडर टायटल (Desktop) */}
          <div className="border-b border-slate-200 pb-3 hidden md:block text-left">
            <h1 className="text-xl md:text-2xl font-black text-slate-800">
              {menuItems.find(m => m.id === currentTab)?.label}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">महाराष्ट्रातील अधिकृत आणि नोंदणीकृत दहीहंडी मंडळांची माहिती.</p>
          </div>

          {/* कॉम्पोनेंट लोड एरिया */}
          <div className="w-full animate-in fade-in duration-200">
            {renderTabContent()}
          </div>

        </div>
      </div>

{/* 📱 ४. मोबाईल स्क्रीनसाठी सुधारित बॉटम नेव्हिगेशन बार (Clean 4 Menu Setup) */}
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

    </div>
  );
}