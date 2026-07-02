import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Trophy, Search, X, ExternalLink, Loader2 } from 'lucide-react';

export default function PublicRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔍 सर्च आणि फिल्टर्सच्या स्टेट्स
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  
  // 🖼️ पॉपअप मोडल (Zoom View) स्टेट
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      console.log("🔄 [PublicRecords] प्रिमियम कॉम्पॅक्ट रेकॉर्ड्स लोड होत आहेत...");
      try {
        const snap = await getDocs(query(collection(db, "records"), orderBy("year", "desc")));
        setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("❌ [Records Load Error]:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  // 🎯 युझरच्या इनपुटनुसार लाइव्ह डेटा फिल्टर करणे
  const filteredRecords = records.filter(r => {
    const matchesSearch = r.team_mr?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.title_mr?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = selectedYear === 'all' || r.year === selectedYear;
    const matchesType = selectedType === 'all' || r.type === selectedType;
    return matchesSearch && matchesYear && matchesType;
  });

  // युनिक वर्षांची यादी ऑटोमॅटिक काढणे (ड्रॉपडाऊनसाठी)
  const years = ['all', ...new Set(records.map(r => r.year))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-bold text-xs">
        <Loader2 className="animate-spin text-orange-500 mr-2" size={16} /> <span>विश्वविक्रम दालन सजवले जात आहे...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 text-left animate-in fade-in duration-200 pb-12">
      
      {/* 🔍 १. सर्च बार आणि ड्रॉपडाऊन फिल्टर्स (Future Ready Controls) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* सर्च इनपुट */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="पथकाचे नाव किंवा रेkॉर्ड शोधा..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
          />
        </div>

        {/* फिल्टर्स ड्रॉपडाऊन */}
        <div className="flex w-full md:w-auto items-center gap-2">
          {/* वर्ष फिल्टर */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">🗓️ सर्व वर्षे</option>
            {years.filter(y => y !== 'all').map(y => <option key={y} value={y}>{y} च्या नोंदी</option>)}
          </select>

          {/* प्रकार फिल्टर */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">👑 सर्व पथके</option>
            <option value="men">🟠 पुरुष गोविंदा</option>
            <option value="women">🔴 महिला गोविंदा</option>
          </select>
        </div>
      </div>

      {/* 📱 २. मोबाईल हॉरिझॉन्टल स्क्रोल कॅटेगरी टॅब्स (Quick Click Filters) */}
      <div className="md:hidden flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <button onClick={() => { setSelectedType('all'); setSelectedYear('all'); }} className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border ${selectedType === 'all' && selectedYear === 'all' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-200'}`}>🚩 सर्व रेकॉर्ड्स</button>
        <button onClick={() => setSelectedType('men')} className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border ${selectedType === 'men' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-200'}`}>🟠 पुरुष गोविंदा</button>
        <button onClick={() => setSelectedType('women')} className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border ${selectedType === 'women' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-200'}`}>🔴 महिला पथक</button>
        {years.includes('2026') && (
          <button onClick={() => setSelectedYear('2026')} className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border ${selectedYear === '2026' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'}`}>🏆 वर्ष २०२६</button>
        )}
      </div>

      {/* 🗂️ ३. मुख्य कॉम्पॅक्ट ग्रिड व्ह्यू (खूप रेकॉर्ड्स सहज डोळ्याखालून जातील) */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-dashed border-slate-200 text-xs font-bold">
          🔍 शोधलेले किंवा फिल्टर केलेले विश्वविक्रम सापडले नाहीत.
        </div>
      ) : (
        /* डेस्कटॉपवर ६ आणि मोबाईलवर एका ओळीत २ परफेक्ट कार्ड्स बसतील */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredRecords.map((r) => (
            <div 
              key={r.id} 
              onClick={() => setSelectedRecord(r)}
              className="bg-white border border-slate-100 rounded-2xl p-2 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all group flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <div>
                {/* 📐 कॉम्पॅक्ट व्हर्टिकल फोटो रेशो */}
                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-950 border border-slate-50 relative flex items-center justify-center">
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt={r.team_mr} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <Trophy size={20} className="text-amber-500/20" />
                  )}
                  {/* मिनी वर्ष बॅज */}
                  <span className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur text-amber-400 font-mono text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-500/10">
                    {r.year}
                  </span>
                </div>

                {/* रेकॉर्ड मिनी डिटेल्स */}
                <div className="mt-2 space-y-0.5 px-0.5 text-left">
                  <span className={`text-[8px] font-black uppercase px-1 py-px rounded ${r.type === 'women' ? 'bg-pink-50 text-pink-600' : 'bg-orange-50 text-orange-600'}`}>
                    {r.type === 'women' ? 'महिला' : 'पुरुष'}
                  </span>
                  {/* टायटल क्लिपिंग (Max 2 Lines) */}
                  <h4 className="text-[11px] font-black text-slate-800 leading-snug tracking-tight line-clamp-2 group-hover:text-orange-600 transition-colors pt-1">{r.title_mr}</h4>
                </div>
              </div>

              {/* मिनी पथक बेल्ट */}
              <div className="mt-2 pt-1.5 border-t border-slate-50 px-0.5">
                <p className="text-[10px] font-bold text-slate-500 truncate">🚩 {r.team_mr}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🖼️ ४. प्रिमियम झूम मोडल (Popup View on Click) */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full border border-slate-100 flex flex-col justify-between max-h-[90vh] relative animate-in zoom-in-95 duration-150">
            
            {/* क्लोज बटन */}
            <button 
              onClick={() => setSelectedRecord(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all shadow-md"
            >
              <X size={16} />
            </button>

            {/* मोडल फोटो (HD View) */}
            <div className="w-full aspect-[3/4] bg-slate-950 border-b border-slate-100 relative">
              {selectedRecord.photoUrl ? (
                <img src={selectedRecord.photoUrl} alt={selectedRecord.team_mr} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                  <Trophy size={48} className="text-amber-500/20 mb-2" /> 
                  <span className="text-xs font-bold">छायाचित्र उपलब्ध नाही</span>
                </div>
              )}
              {/* फ्लोटिंग वर्ष */}
              <span className="absolute bottom-4 left-4 bg-orange-600 text-white font-mono text-xs font-black px-3 py-1 rounded-xl border border-orange-500/20 shadow-lg">
                🏆 उत्सव वर्ष {selectedRecord.year}
              </span>
            </div>

            {/* मोडल डिटेल्स आणि माहिती */}
            <div className="p-5 text-left space-y-3 bg-gradient-to-b from-white to-slate-50 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${selectedRecord.type === 'women' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                  {selectedRecord.type === 'women' ? '🔴 अधिकृत महिला पथक' : '🟠 अधिकृत पुरुष गोविंदा'}
                </span>
                {selectedRecord.teamUID && <span className="text-[10px] font-mono font-bold text-slate-400">UID: {selectedRecord.teamUID}</span>}
              </div>

              <h3 className="text-sm md:text-base font-black text-slate-900 leading-snug">{selectedRecord.title_mr}</h3>
              <p className="text-xs font-bold text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200/60">🏆 गोविंदा पथक: <span className="text-slate-900">{selectedRecord.team_mr}</span></p>

              {/* व्हिडिओ लिंक असेल तरच लाल प्रिमियम बटन दिसेल */}
              {selectedRecord.videoUrl && (
                <a 
                  href={selectedRecord.videoUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-black py-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-red-600/10"
                >
                  <ExternalLink size={14} />
                  <span>थरारक रेकॉर्ड व्हिडिओ पहा</span>
                </a>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}