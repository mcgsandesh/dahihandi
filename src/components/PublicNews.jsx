import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Megaphone, Clock, Loader2, Search, ArrowLeft, ExternalLink, Calendar, ChevronRight } from 'lucide-react';

const toMarathiNumber = (num) => {
  if (num === null || num === undefined) return '';
  const marathiDigits = {
    '1': '१', '2': '२', '3': '३', '4': '४', '5': '५',
    '6': '६', '7': '७', '8': '८', '9': '९', '0': '०'
  };
  return num.toString().split('').map(digit => marathiDigits[digit] || digit).join('');
};

const formatMarathiDate = (firestoreTimestamp, lang = 'mr') => {
  if (!firestoreTimestamp || !firestoreTimestamp.toDate) return lang === 'en' ? 'Just now' : 'आत्ताच';
  const date = firestoreTimestamp.toDate();
  
  if (lang === 'en') {
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  const day = toMarathiNumber(date.getDate().toString().padStart(2, '0'));
  const months = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
  const month = months[date.getMonth()];
  const year = toMarathiNumber(date.getFullYear());
  return `${day} ${month} ${year}`;
};

export default function PublicNews({ lang = 'mr' }) { // 🎯 lang प्रोप गोळा केला
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [selectedNews, setSelectedNews] = useState(null); 

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")));
        setNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredNews = news.filter(n => {
    if (n.expiryDate && n.expiryDate < todayStr) return false;

    const subject = lang === 'en' ? (n.subject_en || n.subject_mr) : n.subject_mr;
    const details = lang === 'en' ? (n.details_en || n.details_mr) : n.details_mr;

    const matchesSearch = 
      subject?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      details?.toLowerCase().includes(searchQuery.toLowerCase().trim());
      
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-bold text-xs bg-transparent min-h-[40vh]">
        <Loader2 className="animate-spin text-[#ff6600] mr-2" size={16} /> 
        <span>{lang === 'en' ? 'Loading updates...' : 'बातम्या लोड होत आहेत...'}</span>
      </div>
    );
  }

  // 📖 १. सविस्तर बातमी वाचन कक्ष (Premium Detail View)
  if (selectedNews) {
    const subject = lang === 'en' ? (selectedNews.subject_en || selectedNews.subject_mr) : selectedNews.subject_mr;
    const details = lang === 'en' ? (selectedNews.details_en || selectedNews.details_mr) : selectedNews.details_mr;

    return (
      <div className="w-full space-y-4 text-left animate-in fade-in slide-in-from-bottom-3 duration-200 pb-24 text-slate-700">
        <button 
          onClick={() => setSelectedNews(null)} 
          className="flex items-center text-xs font-black text-slate-600 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95"
        >
          <ArrowLeft size={14} className="mr-1.5"/> {lang === 'en' ? 'Back to Updates' : 'मागे जा'}
        </button>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-orange-50 rounded-2xl text-[#ff6600] border border-orange-100 flex-shrink-0">
              <Megaphone size={20} />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-base md:text-lg font-black text-slate-900 leading-snug">{subject}</h1>
              <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold">
                <Calendar size={12} className="text-[#ff6600]" />
                <span>{lang === 'en' ? 'Published:' : 'प्रसिद्धी:'} {formatMarathiDate(selectedNews.createdAt, lang)}</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* सविस्तर वृत्त डिटेल्स */}
          <div className="text-xs md:text-sm font-medium text-slate-700 leading-relaxed space-y-3 whitespace-pre-wrap">
            {details || (lang === 'en' ? 'Detailed content not available.' : 'या बातमीचे सविस्तर वृत्त उपलब्ध नाही भाऊ.')}
          </div>

          {/* संदर्भ लिंक असल्यास */}
          {selectedNews.refLink && (
            <div className="pt-4">
              <a 
                href={selectedNews.refLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-xs font-black bg-orange-550/10 hover:bg-[#ff6600] text-[#ff6600] hover:text-white border border-orange-200 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
              >
                {lang === 'en' ? 'More Information Link' : 'अधिक माहितीसाठी लिंक'} 🔗 <ExternalLink size={12} className="ml-1.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 📋 २. मुख्य सूची व्ह्यू (नवीन हेडर आणि प्रगत सर्च बारसह)
  return (
    <div className="w-full space-y-4 text-left animate-in fade-in duration-150 pb-24 text-slate-700">
      
      {/* 👑 [NEW COMPACT HEADER + SEARCH BAR]: एकाच कार्डमध्ये हेडर आणि सर्च बार कडक सेट केले आहेत */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
          {/* डावी बाजू: सुबक ट्रान्सलेटेड हेडर */}
          <div className="flex-shrink-0">
            <h2 className="text-base md:text-xl font-black text-slate-800 uppercase tracking-wide">
              {lang === 'en' ? 'Latest Updates' : 'ताज्या घडामोडी'}
            </h2>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-0.5">
              {lang === 'en' ? 'Official news, notices, and vital announcements' : 'अधिकृत बातम्या, सूचना आणि जाहीर घोषणांचा कप्पा.'}
            </p>
          </div>

          {/* उजवी बाजू: शिफ्ट केलेला सर्च बार */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'en' ? "Search news and updates..." : "बातमीचा विषय शोधा..."} 
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2 text-xs md:text-sm focus:outline-none focus:border-[#ff6600] focus:bg-white font-medium transition-all h-[38px]"
            />
          </div>
        </div>
      </div>

      {/* 📢 बातम्या सूची */}
      {filteredNews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-200 text-xs font-bold shadow-sm">
          📢 {lang === 'en' ? 'No news or announcements available currently.' : 'सध्या एकही बातमी किंवा सूचना उपलब्ध नाही.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNews.map((n) => {
            const subject = lang === 'en' ? (n.subject_en || n.subject_mr || n.text_mr) : (n.subject_mr || n.text_mr);
            return (
              <div 
                key={n.id} 
                onClick={() => setSelectedNews(n)}
                className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-orange-500/45 cursor-pointer transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <div className="p-3 bg-orange-50 rounded-2xl text-[#ff6600] border border-orange-100 flex-shrink-0 group-hover:bg-[#0b132b] group-hover:text-white transition-all shadow-sm">
                    <Megaphone size={16} />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="text-xs md:text-sm font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#ff6600] transition-colors">
                      {subject}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-[9px] md:text-[10px] text-slate-400 font-bold pt-0.5">
                      <Clock size={11} className="text-[#ff6600]" />
                      <span>{formatMarathiDate(n.createdAt, lang)}</span>
                    </div>
                  </div>
                </div>
                
                {/* 🎯 उजवीकडील सुबक ॲरो बटन */}
                <div className="p-1.5 rounded-xl bg-slate-50 group-hover:bg-orange-50 text-slate-300 group-hover:text-[#ff6600] transition-all ml-2 flex-shrink-0">
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}