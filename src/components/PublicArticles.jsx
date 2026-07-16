import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, increment, query, where, orderBy } from 'firebase/firestore';
import { User, ArrowLeft, Eye, Search, TrendingUp } from 'lucide-react';

export default function PublicArticles() {
  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveArticles = async () => {
      try {
        const q = query(collection(db, "articles"), where("isVisible", "==", true), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setArticles(list);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchLiveArticles();
  }, []);

const handleOpenArticle = async (art) => {
  try {
    const docRef = doc(db, "articles", art.id);
    const viewedArticles = JSON.parse(localStorage.getItem('viewed_articles') || '{}');

    // जर युझरने हा लेख आधी वाचला नसेल, तरच फायरबेसला अपडेट पाठवा
    if (!viewedArticles[art.id]) {
      await updateDoc(docRef, { views: increment(1) });
      
      // LocalStorage मध्ये नोंद करून ठेवा जेणेकरून पुन्हा Write होणार नाही
      viewedArticles[art.id] = true;
      localStorage.setItem('viewed_articles', JSON.stringify(viewedArticles));
    }

    setSelectedArticle({...art, views: (art.views || 0) + 1});
  } catch (err) {
    console.error(err);
    setSelectedArticle(art);
  } finally {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

  const renderFormattedContent = (text) => {
    if (!text) return '';
    return text.split('\n').map((paragraph, index) => {
      if (!paragraph.trim()) return null;
      if (paragraph.trim().startsWith('-')) {
        return <li key={index} className="list-disc ml-6 text-slate-800 text-sm font-medium my-2 font-sans">{paragraph.replace('-', '').trim()}</li>;
      }
      const parts = paragraph.split(/\*\*([^*]+)\*\*/g);
      return (
        <p key={index} className="mb-5 text-slate-800 text-base font-medium font-sans leading-relaxed">
          {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-black text-slate-950">{part}</strong> : part)}
        </p>
      );
    });
  };

  if (loading) return <div className="p-10 text-center text-sm font-bold text-slate-400">लेख लोड होत आहेत...</div>;

  // 📖 १. लेख वाचन कक्ष (Detailed View)
  if (selectedArticle) {
    return (
      <div className="max-w-6xl mx-auto p-0 md:p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* डावी बाजू - मुख्य लेख */}
        <div className="md:col-span-2 space-y-4">
            <button onClick={() => setSelectedArticle(null)} className="flex items-center text-sm font-black text-slate-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 ml-2 md:ml-0"><ArrowLeft size={16} className="mr-2"/> मागे जा</button>
            <div className="bg-white p-4 md:p-6 md:rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <span className="text-[11px] font-black bg-orange-100 text-orange-700 px-3 py-1 rounded-full uppercase tracking-wider">{selectedArticle.category}</span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-950 leading-tight">{selectedArticle.titleMr}</h1>
                <div className="flex items-center space-x-4 text-xs text-slate-500 font-bold"><User size={14} /><span>{selectedArticle.authorName}</span><Eye size={14} className="ml-2"/><span>{selectedArticle.views} वाचले</span></div>
                
                <div className="relative w-full h-64 md:h-80 overflow-hidden md:rounded-2xl bg-slate-900">
                    <img src={selectedArticle.imageUrl} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-60" />
                    <img src={selectedArticle.imageUrl} className="relative w-full h-full object-contain" />
                </div>
                
                <div className="w-full bg-slate-50 border border-dashed border-slate-200 py-4 rounded-xl text-center text-sm font-bold text-slate-400">[Google AdSense Banner Ad Place - 1]</div>
                <div className="prose max-w-none pt-2">{renderFormattedContent(selectedArticle.contentMr)}</div>
                <div className="w-full bg-slate-50 border border-dashed border-slate-200 py-4 rounded-xl text-center text-sm font-bold text-slate-400">[Google AdSense Recommendation Ad Place - 2]</div>
                
                {/* 📱 मोबाईल व्ह्यूसाठी: तळाशी सजेस्टेड लेख (आता परफेक्ट वर्किंग) */}
                <div className="block md:hidden mt-10 space-y-4 border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-black uppercase text-slate-950">आणखी लेख</h3>
                    <div className="space-y-3">
                      {articles.filter(a => a.id !== selectedArticle.id).slice(0, 3).map(art => (
                          <div key={art.id} onClick={() => handleOpenArticle(art)} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                              <img src={art.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                              <h4 className="text-xs font-black line-clamp-2 text-slate-900">{art.titleMr}</h4>
                          </div>
                      ))}
                    </div>
                    <div className="w-full bg-slate-50 border border-dashed border-slate-200 py-4 rounded-xl text-center text-sm font-bold text-slate-400">[Mobile Footer Ad]</div>
                </div>
            </div>
        </div>
        
        {/* 💻 उजवी बाजू - डेस्कटॉप साईडबार */}
        <div className="hidden md:block md:col-span-1 sticky top-20 h-screen space-y-6">
            <h3 className="text-sm font-black uppercase text-slate-950">इतर लेख</h3>
            <div className="space-y-4">
                {articles.filter(a => a.id !== selectedArticle.id).slice(0, 6).map(art => (
                    <div key={art.id} onClick={() => handleOpenArticle(art)} className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-orange-200">
                        <img src={art.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                        <h4 className="text-xs font-black line-clamp-2 text-slate-900">{art.titleMr}</h4>
                    </div>
                ))}
            </div>
            <div className="w-full bg-slate-100 border border-dashed border-slate-200 p-4 rounded-2xl text-center text-[10px] font-bold text-slate-400">[Sidebar Ad Slot]</div>
        </div>
      </div>
    );
  }

  const groupedArticles = articles.reduce((acc, art) => {
    const cat = art.category || 'इतर';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(art);
    return acc;
  }, {});

  // 📋 २. मुख्य लिस्ट व्ह्यू
  return (
    <div className="space-y-4 p-2 text-left pt-0"> 
      <div className="sticky top-0 z-20 bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex items-center">
        <Search size={16} className="text-slate-400 ml-2" />
        <input type="text" placeholder="शोध..." className="w-full p-1 text-sm font-bold bg-transparent outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="w-full bg-white border border-slate-100 py-2 rounded-lg text-center text-[10px] font-bold text-slate-400 shadow-sm">[AdSense Top Banner]</div>

      {/* ताज्या घडामोडी सेक्शन */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 px-1"><TrendingUp size={16} className="text-orange-500"/><h2 className="text-sm font-black uppercase text-slate-950">ताज्या घडामोडी</h2></div>
        <div className="flex overflow-x-auto pb-2 gap-3 scrollbar-none">
          {articles.slice(0, 6).map(art => (
            <div key={art.id} onClick={() => handleOpenArticle(art)} className="w-40 flex-shrink-0 bg-white rounded-lg border shadow-sm cursor-pointer overflow-hidden">
              <div className="relative w-full h-20 bg-slate-900"><img src={art.imageUrl} className="absolute inset-0 w-full h-full object-cover blur-md opacity-50" /><img src={art.imageUrl} className="relative w-full h-full object-contain" /></div>
              <div className="p-2"><h3 className="text-[10px] font-black line-clamp-2">{art.titleMr}</h3></div>
            </div>
          ))}
        </div>
      </div>

      {/* कॅटेगरी ग्रुप्स */}
      {Object.keys(groupedArticles).map((category) => (
        <div key={category} className="space-y-2">
          <h2 className="text-sm font-black uppercase text-slate-950 border-l-4 border-orange-500 pl-2">{category}</h2>
          <div className="flex overflow-x-auto pb-4 gap-3 scrollbar-none">
            {groupedArticles[category].filter(a => a.titleMr.toLowerCase().includes(searchTerm.toLowerCase())).map((art) => (
              <div key={art.id} onClick={() => handleOpenArticle(art)} className="w-64 flex-shrink-0 flex items-start bg-white rounded-lg border border-slate-100 shadow-sm cursor-pointer hover:border-orange-200 transition-all p-2 gap-2">
                <div className="relative w-28 h-28 flex-shrink-0 bg-slate-900 rounded-lg overflow-hidden">
                    <img src={art.imageUrl} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-60" />
                    <img src={art.imageUrl} className="relative w-full h-full object-contain" />
                </div>
                <div className="flex flex-col justify-between h-20 flex-grow">
                  <h3 className="text-xs font-black text-slate-950 leading-tight line-clamp-2">{art.titleMr}</h3>
                  <p className="text-[10px] text-slate-600 line-clamp-2 font-medium">{art.contentMr?.replace(/\*\*/g, '').substring(0, 60)}...</p>
                  <div className="flex items-center justify-between"><p className="text-[8px] text-slate-400 font-bold">{art.authorName}</p><span className="flex items-center text-[8px] font-bold text-slate-500"><Eye size={8} className="mr-1"/>{art.views || 0}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}