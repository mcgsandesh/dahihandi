import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, increment, query, where, orderBy } from 'firebase/firestore';
import { BookOpen, User, Calendar, ArrowLeft, Globe, ThumbsUp, Eye, Share2 } from 'lucide-react';

export default function PublicArticles() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('mr'); // Dfeault 'mr' (मराठी) किंवा 'en' (English)

  // १. फायरबेसमधून फक्त लाईव्ह (isVisible === true) असलेले लेख आणणे
  useEffect(() => {
    const fetchLiveArticles = async () => {
      try {
        const q = query(
          collection(db, "articles"), 
          where("isVisible", "==", true),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setArticles(list);
      } catch (err) {
        console.error("❌ लेख लोड करताना अडचण:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveArticles();
  }, []);

  // २. लेख उघडणे आणि व्ह्यूज काऊंटर +१ ने वाढवणे (Live View Counter)
  const handleOpenArticle = async (art) => {
    setSelectedArticle(art);
    setLang('mr'); // प्रत्येक लेख आधी मराठीतच उघडणार
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // फायरबेसमध्ये व्ह्यूजचा आकडा ऑटो-इन्क्रिमेंट करणे
      const docRef = doc(db, "articles", art.id);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ✍️ **मॅजिक फंक्शन**: डेटाबेसमधील स्टार टॅग्ज (`**`) ओळखून मजकूर Bold आणि पॅराग्राफमध्ये रेंडर करणे
  const renderFormattedContent = (text) => {
    if (!text) return '';
    return text.split('\n').map((paragraph, index) => {
      if (!paragraph.trim()) return null;

      // बुलेट पॉईंट्स तपासणी (- मुद्दा)
      if (paragraph.trim().startsWith('-')) {
        const cleanText = paragraph.replace('-', '').trim();
        return <li key={index} className="list-disc ml-5 text-slate-700 text-xs font-medium my-1 font-sans">{cleanText}</li>;
      }

      // बोल्ड टॅग्ज तपासणी (**मजकूर**)
      const parts = paragraph.split(/\*\*([^*]+)\*\*/g);
      return (
        <p key={index} className="mb-3 text-slate-700 text-xs font-medium font-sans leading-relaxed">
          {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-black text-slate-950">{part}</strong> : part)}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center space-y-2">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-bold">दहीहंडी विशेष लेख लोड होत आहेत...</p>
      </div>
    );
  }

  // 📖 २. संपूर्ण लेख वाचन कक्ष (Detailed View)
  if (selectedArticle) {
    const isMarathi = lang === 'mr';
    const currentTitle = isMarathi ? selectedArticle.titleMr : selectedArticle.titleEn;
    const currentContent = isMarathi ? selectedArticle.contentMr : selectedArticle.contentEn;

    return (
      <div className="space-y-4 text-left w-full px-2 max-w-4xl mx-auto animate-in fade-in duration-200">
        
        {/* मागे जा आणि भाषा निवडीचा बार */}
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
          <button 
            onClick={() => setSelectedArticle(null)} 
            className="flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 text-xs font-black transition-all"
          >
            <ArrowLeft size={14} /> <span>मागे जा</span>
          </button>

          {/* 🌐 मराठी / English स्विच बटण */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg space-x-0.5">
            <button onClick={() => setLang('mr')} className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${isMarathi ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>मराठी</button>
            <button onClick={() => setLang('en')} className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${!isMarathi ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>English</button>
          </div>
        </div>

        {/* मुख्य लेख कार्ड */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          
          {/* हेडिंग आणि मेटा डेटा */}
          <div className="space-y-2">
            <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md uppercase">{selectedArticle.category}</span>
            <h1 className="text-base md:text-xl font-black text-slate-900 leading-snug">{currentTitle}</h1>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-bold border-b pb-3 border-slate-50">
              <div className="flex items-center space-x-1"><User size={12} /><span className="text-slate-600">{selectedArticle.authorName} ({selectedArticle.authorRole})</span></div>
              <div className="flex items-center space-x-1"><Eye size={12} /><span>{selectedArticle.views + 1} वाचले</span></div>
            </div>
          </div>

          {/* 🖼️ मुख्य भव्य फोटो */}
          <div className="w-full h-48 md:h-80 rounded-2xl overflow-hidden border bg-slate-50">
            <img src={selectedArticle.imageUrl} alt="Banner" className="w-full h-full object-cover" />
          </div>

          {/* 💸 ॲडसेन्स स्कोप १: फोटोच्या तंतोतंत खाली पहिली इन-आर्टिकल जाहिरात */}
          <div className="w-full bg-slate-50 border border-dashed border-slate-200 py-3 rounded-xl text-center text-[10px] font-bold text-slate-400">
            [Google AdSense Banner Ad Place - 1]
            {/* <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-xxx" data-ad-slot="xxx" data-ad-format="auto"></ins> */}
          </div>

          {/* 📝 लेखाचा मुख्य मजकूर (Formatted Markdown) */}
          <div className="prose max-w-none pt-2">
            {renderFormattedContent(currentContent)}
          </div>

          {/* संदर्भ (यदि उपलब्ध असेल) */}
          {selectedArticle.reference && (
            <div className="bg-slate-50 p-2.5 rounded-xl border text-[10px] font-bold text-slate-500 font-sans">
              🔗 संदर्भ: <span className="font-medium">{selectedArticle.reference}</span>
            </div>
          )}

          {/* 💸 ॲडसेन्स स्कोप २: लेख संपल्यावर तळाशी दुसरी चौरस जाहिरात */}
          <div className="w-full bg-slate-50 border border-dashed border-slate-200 py-4 rounded-xl text-center text-[10px] font-bold text-slate-400">
            [Google AdSense Recommendation Ad Place - 2]
          </div>

        </div>
      </div>
    );
  }

  // 📋 ३. मुख्य लेखांची यादी व्ह्यू (Grid List View)
  return (
    <div className="space-y-4 text-left w-full px-2">
      
      {/* हेडर माहिती कप्पा */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3">
        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><BookOpen size={20} /></div>
        <div>
          <h1 className="text-sm font-black text-slate-900 uppercase tracking-wider">दहीहंडी विशेष ज्ञानपीठ</h1>
          <p className="text-[10px] text-slate-400 font-bold">उत्सवाचा सुवर्ण इतिहास, मनोऱ्यांचे शास्त्र आणि गोविंदांचे कडक अनुभव.</p>
        </div>
      </div>

      {/* 💸 ॲडसेन्स स्कोप ३: यादीच्या अगदी वरती मोठी टॉप बॅनर जाहिरात */}
      <div className="w-full bg-white border border-slate-100 py-2.5 rounded-2xl text-center text-[10px] font-bold text-slate-400 shadow-xs">
        [Google AdSense Top Leaderboard Ad Place - 3]
      </div>

      {/* यादी रिकामी असल्यास */}
      {articles.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border">
          <p className="text-slate-400 text-xs font-medium">क्षमस्व, कट्ट्यावर अजून एकही लेख पब्लिश केलेला नाही भाऊ! 🚩</p>
        </div>
      ) : (
        /* लेखांचा भव्य ग्रिड */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
          {articles.map((art) => (
            <div 
              key={art.id} 
              onClick={() => handleOpenArticle(art)}
              className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md cursor-pointer transition-all active:scale-99"
            >
              <div>
                {/* कार्ड इमेत थंबनेल */}
                <div className="w-full h-40 bg-slate-100 relative">
                  <img src={art.imageUrl} alt="Cover" className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 text-[8px] font-black bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md uppercase">
                    {art.category}
                  </span>
                </div>
                
                {/* कार्ड मजकूर */}
                <div className="p-3 space-y-1.5">
                  <h3 className="text-xs font-black text-slate-900 line-clamp-2 leading-tight min-h-[32px]">
                    {art.titleMr}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold font-sans line-clamp-2">
                    {art.contentMr.replace(/\*\*/g, '')} {/* स्टार काढून प्रीव्ह्यू दाखवणे */}
                  </p>
                </div>
              </div>

              {/* तळाचा कप्पा */}
              <div className="p-3 pt-0 border-t border-slate-50 mt-2 flex items-center justify-between text-[9px] text-slate-400 font-bold">
                <span>लेखक: {art.authorName}</span>
                <span className="bg-slate-50 border px-1.5 py-0.2 rounded-md font-sans text-slate-600">
                  👀 {art.views || 0}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}