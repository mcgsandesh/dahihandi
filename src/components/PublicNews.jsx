import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Megaphone, Clock, Loader2, Search } from 'lucide-react';

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

  const filteredNews = news.filter(n => 
    n.text_mr?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-bold text-xs bg-transparent min-h-[40vh]">
        <Loader2 className="animate-spin text-orange-500 mr-2" size={16} /> <span>बातम्या लोड होत आहेत...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 text-left animate-in fade-in duration-150 pb-24 text-slate-700">
      
      {/* 🔍 व्हाईट सर्च बार */}
      <div className="relative w-full bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
        <Search className="absolute top-5 left-5 text-slate-400" size={15} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 कोणतीही महत्त्वाची बातमी किंवा सूचना शोधा..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-orange-500 text-slate-800 font-semibold shadow-inner"
        />
      </div>

      {/* 📢 बातम्या सूची (व्हाईट थीम कार्ड्स) */}
      {filteredNews.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-dashed border-slate-200 text-xs font-bold">
          📢 सध्या एकही नवीन बातमी किंवा सूचना उपलब्ध नाही.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredNews.map((n) => (
            <div 
              key={n.id} 
              className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-start space-x-3.5 hover:border-orange-500/40 transition-all group"
            >
              <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600 border border-orange-100 flex-shrink-0 group-hover:bg-[#0b132b] group-hover:text-white transition-all">
                <Megaphone size={15} />
              </div>
              <div className="space-y-2 min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 leading-relaxed break-words">
                  {n.text_mr}
                </p>
                <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-bold border-t border-slate-100 pt-1.5">
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