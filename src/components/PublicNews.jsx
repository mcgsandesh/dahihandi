import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Megaphone, Clock, Loader2, Search, ArrowLeft, ExternalLink, Calendar } from 'lucide-react';

const toMarathiNumber = (num) => {
  if (num === null || num === undefined) return '';
  const marathiDigits = {
    '1': '१', '2': '२', '3': '३', '4': '४', '5': '५',
    '6': '६', '7': '७', '8': '८', '9': '९', '0': '०'
  };
  return num.toString().split('').map(digit => marathiDigits[digit] || digit).join('');
};

const formatMarathiDate = (firestoreTimestamp) => {
  if (!firestoreTimestamp || !firestoreTimestamp.toDate) return 'आत्ताच';
  const date = firestoreTimestamp.toDate();
  const day = toMarathiNumber(date.getDate().toString().padStart(2, '0'));
  const months = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
  const month = months[date.getMonth()];
  const year = toMarathiNumber(date.getFullYear());
  return `${day} ${month} ${year}`;
};

export default function PublicNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [selectedNews, setSelectedNews] = useState(null); // 🎯 सिंगल बातमी पाहण्यासाठी स्टेट

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

  // 🎯 व्हॅलिडेशन फिल्टर: मुदत संपलेल्या बातम्या गाळणे आणि शोध फिल्टर लावणे
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredNews = news.filter(n => {
    // जर बातमीला expiryDate असेल आणि ती आजच्या तारखेपेक्षा जुनी असेल, तर दाखवू नका
    if (n.expiryDate && n.expiryDate < todayStr) return false;

    const matchesSearch = 
      n.subject_mr?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      n.details_mr?.toLowerCase().includes(searchQuery.toLowerCase().trim());
      
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-bold text-xs bg-transparent min-h-[40vh]">
        <Loader2 className="animate-spin text-orange-500 mr-2" size={16} /> <span>बातम्या लोड होत आहेत...</span>
      </div>
    );
  }

  // 📖 १. सविस्तर बातमी वाचन कक्ष (Main News Page Detail View)
  if (selectedNews) {
    return (
      <div className="w-full space-y-4 text-left animate-in fade-in duration-150 pb-24 text-slate-700">
        <button 
          onClick={() => setSelectedNews(null)} 
          className="flex items-center text-xs font-black text-slate-600 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200"
        >
          <ArrowLeft size={14} className="mr-1.5"/> मागे जा
        </button>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600 border border-orange-100 flex-shrink-0">
              <Megaphone size={16} />
            </div>
            <div className="space-y-1">
              <h1 className="text-sm font-black text-slate-900 leading-snug">{selectedNews.subject_mr}</h1>
              <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-bold">
                <Clock size={11} />
                <span>प्रसिद्धी: {formatMarathiDate(selectedNews.createdAt)}</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* सविस्तर वृत्त डिटेल्स */}
          <div className="text-xs font-medium text-slate-800 leading-relaxed space-y-3 whitespace-pre-wrap">
            {selectedNews.details_mr || 'या बातमीचे सविस्तर वृत्त उपलब्ध नाही भाऊ.'}
          </div>

          {/* संदर्भ लिंक असल्यास */}
          {selectedNews.refLink && (
            <div className="pt-2">
              <a 
                href={selectedNews.refLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-[10px] font-black bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1.5 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm"
              >
                अधिक माहितीसाठी लिंक 🔗 <ExternalLink size={10} className="ml-1" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 📋 २. मुख्य सूची व्ह्यू (फक्त सब्जेक्ट आणि तारीख दिसेल)
  return (
    <div className="w-full space-y-4 text-left animate-in fade-in duration-150 pb-24 text-slate-700">
      
      {/* 🔍 व्हाईट सर्च बार */}
      <div className="relative w-full bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
        <Search className="absolute top-5 left-5 text-slate-400" size={15} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchTerm ? setSearchQuery(e.target.value) : setSearchQuery(e.target.value)}
          placeholder="🔍 बातमीचा विषय शोधा..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-orange-500 text-slate-800 font-semibold shadow-inner"
        />
      </div>

      {/* 📢 बातम्या सूची */}
      {filteredNews.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-dashed border-slate-200 text-xs font-bold">
          📢 सध्या एकही बातमी किंवा सूचना उपलब्ध नाही.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredNews.map((n) => (
            <div 
              key={n.id} 
              onClick={() => setSelectedNews(n)}
              className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-sm flex items-center space-x-3.5 hover:border-orange-500/40 cursor-pointer transition-all group"
            >
              <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600 border border-orange-100 flex-shrink-0 group-hover:bg-[#0b132b] group-hover:text-white transition-all">
                <Megaphone size={15} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                {/* फक्त सब्जेक्ट दाखवणे */}
                <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                  {n.subject_mr || n.text_mr}
                </h4>
                <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-bold pt-0.5">
                  <Clock size={11} className="text-slate-400" />
                  <span>{formatMarathiDate(n.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}