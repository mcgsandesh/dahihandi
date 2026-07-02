import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Megaphone, Calendar, Clock, Loader2 } from 'lucide-react';

export default function PublicNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      console.log("🔄 [PublicNews] बातम्या लोड होत आहेत...");
      try {
        const snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")));
        setNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("❌ [News Load Error]:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-bold text-xs">
        <Loader2 className="animate-spin text-orange-500 mr-2" size={16} /> <span>बातम्या लोड होत आहेत...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 text-left animate-in fade-in duration-150">
      {news.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-dashed border-slate-200 text-xs font-bold">
          📢 सध्या कोणतीही नवीन बातमी किंवा सूचना उपलब्ध नाही.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map((n) => (
            <div key={n.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start space-x-3">
              <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600 flex-shrink-0">
                <Megaphone size={16} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-800 leading-relaxed">{n.text_mr}</p>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold">
                  <Clock size={11} />
                  <span>
                    {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString('mr-IN') : 'आत्ताच'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}