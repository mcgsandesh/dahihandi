import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { BarChart3, Users, Building2, Award, PieChart } from 'lucide-react';

export default function PublicStats() {
  const [stats, setStats] = useState({
    totalTeams: 0,
    menTeams: 0,
    womenTeams: 0,
    totalDistricts: 0,
    topDistricts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatsFromCache = async () => {
      try {
        const CACHE_KEY = 'govinda_public_directory';
        const CACHE_TIME_KEY = 'govinda_directory_time';
        const FOUR_HOURS = 4 * 60 * 60 * 1000; // ४ तास मिलिसेकंदमध्ये

        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        let allTeams = [];

        // 🎯 १. जर 'गोविंदा कट्टा' पेजने आधीच डेटा आणून LocalStorage मध्ये ठेवला असेल आणि तो फ्रेश असेल, तर थेट तिथूनच उचल!
        if (cachedData && cachedTime && (now - cachedTime < FOUR_HOURS)) {
          console.log("⚡ [Stats Cache] डेटा थेट LocalStorage मधून ओढला! फायरबेस रीड = ० 🔥");
          allTeams = JSON.parse(cachedData);
        } 
        // 🎯 २. जर कॅश नसेल किंवा जुनी झाली असेल, तरच सर्व्हेरवरून फक्त १ फ्रेश Read मारणे
        else {
          console.log("🌍 [Stats Server Read] कॅश उपलब्ध नाही. सर्व्हेरवरून फ्रेश आकडेवारी आणत आहे...");
          const cacheDocRef = doc(db, "public_site_cache", "live_directory");
          const docSnap = await getDoc(cacheDocRef);

          if (docSnap.exists()) {
            const cacheData = docSnap.data();
            allTeams = cacheData.teams || [];

            // डेटा लोकल स्टोरेजमध्ये ४ तासांसाठी लॉक करणे
            localStorage.setItem(CACHE_KEY, JSON.stringify(allTeams));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
          }
        }

        // 📊 आकडेवारीचे कडक गणित (जुने लॉजिक जसेच्या तसे सुरक्षित)
        const total = allTeams.length;
        const men = allTeams.filter(t => t.teamCategory === 'Men').length;
        const women = allTeams.filter(t => t.teamCategory === 'Women').length;
        
        // जिल्हे मोजणे
        const districtMap = {};
        allTeams.forEach(t => {
          if (t.district) {
            districtMap[t.district] = (districtMap[t.district] || 0) + 1;
          }
        });

        const uniqueDistricts = Object.keys(districtMap).length;
        
        // टॉप जिल्हे सॉर्ट करणे
        const sortedDistricts = Object.entries(districtMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalTeams: total,
          menTeams: men,
          womenTeams: women,
          totalDistricts: uniqueDistricts,
          topDistricts: sortedDistricts
        });

      } catch (err) {
        console.error("Stats लोड करताना एरर आला, लोकल फॉलबॅक तपासत आहे:", err);
        
        // फॉलबॅक: इंटरनेट नसल्यास लोकल स्टोरेजमधील जुन्या डेटावरून गणित लावणे
        const backupData = localStorage.getItem('govinda_public_directory');
        if (backupData) {
          const backupTeams = JSON.parse(backupData);
          const backupMen = backupTeams.filter(t => t.teamCategory === 'Men').length;
          const backupWomen = backupTeams.filter(t => t.teamCategory === 'Women').length;
          setStats(prev => ({
            ...prev,
            totalTeams: backupTeams.length,
            menTeams: backupMen,
            womenTeams: backupWomen
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStatsFromCache();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-bold tracking-wide">उत्सवाची सांख्यिकी लोड होत आहे...</p>
      </div>
    );
  }

  const menPercentage = stats.totalTeams ? Math.round((stats.menTeams / stats.totalTeams) * 100) : 0;
  const womenPercentage = stats.totalTeams ? Math.round((stats.womenTeams / stats.totalTeams) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* ⚡ भव्य काऊंटर्स ग्रीड */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* एकूण पथके */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-orange-50 text-[#ff6600]"><Building2 size={22} /></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">एकूण पथके</p>
            <h3 className="text-xl font-black text-slate-800 font-sans mt-0.5">{stats.totalTeams}</h3>
          </div>
        </div>

        {/* पुरुष पथके */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Users size={22} /></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">पुरुष पथके</p>
            <h3 className="text-xl font-black text-slate-800 font-sans mt-0.5">{stats.menTeams}</h3>
          </div>
        </div>

        {/* महिला पथके */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-pink-50 text-pink-600"><Users size={22} /></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">महिला पथके</p>
            <h3 className="text-xl font-black text-slate-800 font-sans mt-0.5">{stats.womenTeams}</h3>
          </div>
        </div>

        {/* सक्रिय जिल्हे */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><Award size={22} /></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">सक्रिय जिल्हे</p>
            <h3 className="text-xl font-black text-slate-800 font-sans mt-0.5">{stats.totalDistricts}</h3>
          </div>
        </div>
      </div>

      {/* 📊 चार्ट्स आणि जिल्ह्यानुसार आकडेवारी */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* वर्गीकरण टक्केवारी */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
            <PieChart size={18} className="text-[#ff6600]" />
            <h4 className="text-sm font-black text-slate-800 tracking-wide">पथक वर्गीकरण टक्केवारी</h4>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>👨‍👦 पुरुष गोविंदा पथके</span>
                <span className="font-sans">{menPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${menPercentage}%` }}></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>👩‍👧 महिला गोविंदा पथके</span>
                <span className="font-sans">{womenPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${womenPercentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* टॉप ५ जिल्हे */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
            <BarChart3 size={18} className="text-[#ff6600]" />
            <h4 className="text-sm font-black text-slate-800 tracking-wide">टॉप सक्रिय जिल्हे (पथक संख्या)</h4>
          </div>

          <div className="divide-y divide-slate-50">
            {stats.topDistricts.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-4 text-center">जिल्ह्यांची आकडेवारी उपलब्ध नाही.</p>
            ) : (
              stats.topDistricts.map((dist, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-[10px] font-black text-slate-500 flex items-center justify-center font-sans">{idx + 1}</span>
                    <span className="text-xs font-bold text-slate-700">{dist.name}</span>
                  </div>
                  <span className="bg-slate-50 border border-slate-200/60 text-slate-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md font-sans">{dist.count} पथके</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}