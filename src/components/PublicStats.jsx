import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { BarChart3, Users, Building2, Award, PieChart, Map } from 'lucide-react';

const CACHE_KEY = 'govinda_public_directory';
const CACHE_TIME_KEY = 'govinda_directory_time';
const FOUR_HOURS = 4 * 60 * 60 * 1000;

// मराठी नंबर कन्व्हर्टर
const toMarathiNumber = (num) => {
  if (num === null || num === undefined) return '०';
  const marathiDigits = {
    '1': '१', '2': '२', '3': '३', '4': '४', '5': '५',
    '6': '६', '7': '७', '8': '८', '9': '९', '0': '०'
  };
  return num.toString().split('').map(digit => marathiDigits[digit] || digit).join('');
};

// 🎯 बदल: प्रॉप्समध्ये 'onTharaClick' सुरक्षितपणे स्वीकारला आहे
  export default function PublicStats({ onDistrictClick, onTharaClick, onCategoryClick,onAreaClick,lang }) {
  const [allTeamsData, setAllTeamsData] = useState([]); 
  const [stats, setStats] = useState({
    totalTeams: 0,
    menTeams: 0,
    womenTeams: 0,
    totalDistricts: 0,
    topDistricts: [],
    layerBreakdown: { ten: 0, nine: 0, eight: 0, seven: 0, others: 0 }
  });
  
  const [districtCountsMap, setDistrictCountsMap] = useState({}); 
  const [selectedAreaDistrict, setSelectedAreaDistrict] = useState(''); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatsFromCache = async () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        let allTeams = [];

        if (cachedData && cachedTime && (now - cachedTime < FOUR_HOURS)) {
          allTeams = JSON.parse(cachedData);
        } else {
          const cacheDocRef = doc(db, "public_site_cache", "live_directory");
          const docSnap = await getDoc(cacheDocRef);
          if (docSnap.exists()) {
            allTeams = docSnap.data().teams || [];
            localStorage.setItem(CACHE_KEY, JSON.stringify(allTeams));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
          }
        }

        setAllTeamsData(allTeams);

        // 📊 मुख्य आकडेवारी विश्लेषण
        const total = allTeams.length;
        const men = allTeams.filter(t => t.teamCategory === 'Men' || t.teamCategory === 'men').length;
        const women = allTeams.filter(t => t.teamCategory === 'Women' || t.teamCategory === 'women').length;
        
        const districtMap = {};
        let ten = 0, nine = 0, eight = 0, seven = 0, others = 0;

        allTeams.forEach((t) => {
          if (t.district) {
            const distName = t.district.trim();
            districtMap[distName] = (districtMap[distName] || 0) + 1;
          }

          let highestLayer = 0;

          if (t.milestone10 && t.milestone10.toString().trim() !== "") {
            highestLayer = 10;
          } else if (t.milestone9 && t.milestone9.toString().trim() !== "") {
            highestLayer = 9;
          } else if (t.milestone8 && t.milestone8.toString().trim() !== "") {
            highestLayer = 8;
          } else if (t.milestone7 && t.milestone7.toString().trim() !== "") {
            highestLayer = 7;
          }

          if (highestLayer === 0) {
            highestLayer = parseInt(t.maxLayers || t.layers || 0, 10);
          }

          if (highestLayer === 10) ten++;
          else if (highestLayer === 9) nine++;
          else if (highestLayer === 8) eight++;
          else if (highestLayer === 7) seven++;
          else if (highestLayer > 0) others++;
        });

        setDistrictCountsMap(districtMap); 

        const distKeys = Object.keys(districtMap);
        if (distKeys.length > 0) {
          const defaultTarget = distKeys.find(k => 
            k.toLowerCase().includes('mumbai city') || 
            k.toLowerCase().includes('मुंबई शहर')
          );
          setSelectedAreaDistrict(defaultTarget || distKeys[0]);
        } else {
          setSelectedAreaDistrict('मुंबई शहर');
        }

        const sortedDistricts = Object.entries(districtMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalTeams: total,
          menTeams: men,
          womenTeams: women,
          totalDistricts: distKeys.length,
          topDistricts: sortedDistricts,
          layerBreakdown: { ten, nine, eight, seven, others }
        });

      } catch (err) {
        console.error("❌ Stats Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatsFromCache();
  }, []);

  const getFilteredAreaPincodes = () => {
    if (!selectedAreaDistrict) return [];
    const areaPinMap = {};
    allTeamsData.forEach(t => {
      if (t.district && t.district.trim() === selectedAreaDistrict.trim()) {
        const pin = t.pincode ? t.pincode.toString().trim() : '';
        const areaName = t.areaName ? t.areaName.trim() : ''; 

        if (pin && areaName) {
          const key = `${areaName}_${pin}`;
          if (!areaPinMap[key]) {
            areaPinMap[key] = { pin, area: areaName, count: 0 };
          }
          areaPinMap[key].count += 1;
        }
      }
    });
    return Object.values(areaPinMap).sort((a, b) => b.count - a.count);
  };

  const filteredAreaPincodes = getFilteredAreaPincodes();

  const menPercentage = stats.totalTeams ? Math.round((stats.menTeams / stats.totalTeams) * 100) : 0;
  const womenPercentage = stats.totalTeams ? Math.round((stats.womenTeams / stats.totalTeams) * 100) : 0;

return (
    <div className="space-y-5 text-slate-700">
      
      {/* 🔝 [STATS PAGE HEADER] - सुबक आणि कॉम्पॅक्ट आकडेवारी हेडर 📊 */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 -mt-1 w-full text-left">
    <div className="flex flex-col">
      <h2 className="text-base md:text-xl font-black text-slate-800 uppercase tracking-wide">
        {lang === 'en' ? 'Festival Statistics' : 'उत्सव आकडेवारी'}
      </h2>
      <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-0.5 leading-none">
        {lang === 'en' 
          ? 'Live insights, registered teams overview, and layer-wise records' 
          : 'नोंदणीकृत सक्रिय पथके, थरांचे रेकॉर्ड आणि लाइव्ह आकडेवारीचा तपशील.'}
      </p>
    </div>
  </div>

      {/* ⚡ भव्य काऊंटर्स ग्रीड */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-550/10 text-[#ff6600]"><Building2 size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">एकूण पथके</p>
            <h3 className="text-lg font-black text-slate-800 font-sans leading-none mt-1">{toMarathiNumber(stats.totalTeams)}</h3>
          </div>
        </div>

        {/* 🎯 बदल: पुरुष पथक कार्डवर क्लिक केल्यावर थेट कॅटेगरी फिल्टर पास होणार */}
        <div 
          onClick={() => {
            console.log("📊 [Stats Click]: 'पुरुष पथके' कार्डवर क्लिक झाले. व्हॅल्यू रवाना: Men");
            onCategoryClick && onCategoryClick('Men');
          }}
          className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 cursor-pointer hover:shadow-md transition-all active:scale-95"
        >
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Users size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">पुरुष पथके</p>
            <h3 className="text-lg font-black text-slate-800 font-sans leading-none mt-1">{toMarathiNumber(stats.menTeams)}</h3>
          </div>
        </div>

        {/* 🎯 बदल: महिला पथक कार्डवर क्लिक केल्यावर थेट कॅटेगरी फिल्टर पास होणार */}
        <div 
          onClick={() => {
            console.log("📊 [Stats Click]: 'महिला पथके' कार्डवर क्लिक झाले. व्हॅल्यू रवाना: Women");
            onCategoryClick && onCategoryClick('Women');
          }}
          className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 cursor-pointer hover:shadow-md transition-all active:scale-95"
        >
          <div className="p-2.5 rounded-xl bg-pink-50 text-pink-600"><Users size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">महिला पथके</p>
            <h3 className="text-lg font-black text-slate-800 font-sans leading-none mt-1">{toMarathiNumber(stats.womenTeams)}</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><Award size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">सक्रिय जिल्हे</p>
            <h3 className="text-lg font-black text-slate-800 font-sans leading-none mt-1">{toMarathiNumber(stats.totalDistricts)}</h3>
          </div>
        </div>
      </div>

      {/* 📊 चार्ट्स आणि मानवी मनोरा ब्रेकडाउन */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* १. मानवी मनोरा थर क्षमता ब्रेकडाउन */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-2">
            <PieChart size={16} className="text-[#ff6600]" />
            <h4 className="text-xs font-black text-slate-800 tracking-wide">🏆 मानवी मनोरा थर क्षमता ब्रेकडाउन</h4>
          </div>

          <div className="space-y-2 pt-0.5">
            <div 
              onClick={() => {
                console.log("🏰 [Stats Click]: '१० थर' क्षमतेवर क्लिक झाले. व्हॅल्यू रवाना: 10");
                onTharaClick && onTharaClick('10');
              }} 
              className="flex justify-between items-center text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-500/20 border border-transparent transition-all active:scale-98"
            >
              <span>🏰 १० थरांचे जागतिक सलामीवीर</span>
              <span className="bg-orange-600 text-white px-2 py-0.5 rounded font-sans text-[10px] font-black">{toMarathiNumber(stats.layerBreakdown.ten)}</span>
            </div>
            <div 
              onClick={() => {
                console.log("🏰 [Stats Click]: '९ थर' क्षमतेवर क्लिक झाले. व्हॅल्यू रवाना: 9");
                onTharaClick && onTharaClick('9');
              }} 
              className="flex justify-between items-center text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-500/20 border border-transparent transition-all active:scale-98"
            >
              <span>⚡ ९ थरांचा थरारक थर लावणारे</span>
              <span className="bg-[#0b132b] text-white px-2 py-0.5 rounded font-sans text-[10px] font-black">{toMarathiNumber(stats.layerBreakdown.nine)}</span>
            </div>
            <div 
              onClick={() => {
                console.log("🏰 [Stats Click]: '८ थर' क्षमतेवर क्लिक झाले. व्हॅल्यू रवाना: 8");
                onTharaClick && onTharaClick('8');
              }} 
              className="flex justify-between items-center text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-500/20 border border-transparent transition-all active:scale-98"
            >
              <span>🚩 ८ थरांची कडक क्षमता असणारे</span>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-sans text-[10px] font-black">{toMarathiNumber(stats.layerBreakdown.eight)}</span>
            </div>
            <div 
              onClick={() => {
                console.log("🏰 [Stats Click]: '७ थर' क्षमतेवर क्लिक झाले. व्हॅल्यू रवाना: 7");
                onTharaClick && onTharaClick('7');
              }} 
              className="flex justify-between items-center text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-500/20 border border-transparent transition-all active:scale-98"
            >
              <span>🎯 ७ थरांची सर्वाधिक क्षमता असणारे</span>
              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-sans text-[10px] font-black">{toMarathiNumber(stats.layerBreakdown.seven)}</span>
            </div>
          </div>
        </div>

        {/* २. पथक प्रकार टक्केवारी विश्लेषण */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-2">
            <Users size={16} className="text-[#ff6600]" />
            <h4 className="text-xs font-black text-slate-800 tracking-wide">पथक प्रकार टक्केवारी विश्लेषण</h4>
          </div>

          <div className="space-y-3.5 pt-0.5">
            {/* 🎯 बदल: पुरुष गोविंदा टक्केवारीवर क्लिक करून सुद्धा थेट नेव्हिगेशन होणार */}
            <div 
              onClick={() => {
                console.log("📊 [Stats Click]: पुरुष टक्केवारी बारवर क्लिक झाले. व्हॅल्यू रवाना: Men");
                onCategoryClick && onCategoryClick('Men');
              }}
              className="space-y-1 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-all"
            >
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span>👨‍👦 पुरुष गोविंदा पथके</span>
                <span className="font-sans">{toMarathiNumber(menPercentage)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${menPercentage}%` }}></div>
              </div>
            </div>

            {/* 🎯 बदल: महिला गोविंदा टक्केवारीवर क्लिक करून सुद्धा थेट नेव्हिगेशन होणार */}
            <div 
              onClick={() => {
                console.log("📊 [Stats Click]: महिला टक्केवारी बारवर क्लिक झाले. व्हॅल्यू रवाना: Women");
                onCategoryClick && onCategoryClick('Women');
              }}
              className="space-y-1 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-all"
            >
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span>👩‍👧  महिला गोविंदा पथके</span>
                <span className="font-sans">{toMarathiNumber(womenPercentage)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-pink-500 h-full rounded-full" style={{ width: `${womenPercentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 ३. टॉप सक्रिय जिल्हे पॅनल */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-50 pb-2">
          <BarChart3 size={16} className="text-[#ff6600]" />
          <h4 className="text-xs font-black text-slate-800 tracking-wide">🏆 टॉप सक्रिय जिल्हे आणि एकूण नोंदणी संख्या</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {stats.topDistricts.map((dist, idx) => (
            <div 
              key={idx} 
              onClick={() => {
                console.log(`📍 [Stats Click]: जिल्हा रँक बॉक्सवर क्लिक झाले. जिल्हा रवाना: ${dist.name}`);
                onDistrictClick && onDistrictClick(dist.name);
              }}
              className="bg-slate-50/60 border border-slate-100 p-2.5 rounded-xl flex flex-col items-center justify-center text-center hover:shadow-md cursor-pointer transition-all active:scale-95"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase">रँक {toMarathiNumber(idx + 1)}</span>
              <span className="text-xs font-black text-slate-700 truncate max-w-full mt-0.5">{dist.name}</span>
              <span className="text-[10px] font-black text-orange-600 bg-white border border-slate-200/60 px-2 py-0.5 rounded-md mt-1.5 shadow-xs">
                {toMarathiNumber(dist.count)} पथके
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 🏙️ ४. परिसर आणि पिनकोड वर्गीकरण */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-2">
          <div className="flex items-center space-x-2">
            <Map size={16} className="text-[#ff6600]" />
            <h4 className="text-xs font-black text-slate-800 tracking-wide">🏙️ परिसर आणि पिनकोड निहाय पथक वर्गीकरण</h4>
          </div>
          
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 self-end">
            <span className="text-[9px] text-slate-400 font-bold uppercase">जिल्हा:</span>
            <select 
              value={selectedAreaDistrict} 
              onChange={(e) => setSelectedAreaDistrict(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-700 focus:outline-none cursor-pointer"
            >
              {Object.keys(districtCountsMap).length > 0 ? (
                Object.entries(districtCountsMap).map(([name, count]) => (
                  <option key={name} value={name}>{name} ({toMarathiNumber(count)})</option>
                ))
              ) : (
                <option value="मुंबई शहर">मुंबई शहर</option>
              )}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 pt-0.5">
          {filteredAreaPincodes.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium col-span-full text-center py-4 bg-slate-50 rounded-xl border border-dashed">
              डेटा उपलब्ध नाही.
            </p>
          ) : (
            filteredAreaPincodes.map((item, index) => (
              <div 
                key={index}
  onClick={() => {
                    console.log(`🏙️ [Stats Click]: परिसर वर्गीकरणावर क्लिक झाले. जिल्हा: ${selectedAreaDistrict}, एरिया/पिनकोड रवाना: ${item.area}`);
                    // 🎯 फिक्स: जर AREA वर क्लिक झाले असेल, तर डॅशबोर्डच्या onAreaClick ला कॉल गेला पाहिजे!
                    if (onAreaClick) {
                      onAreaClick(selectedAreaDistrict, item.area);
                    } else if (onDistrictClick) {
                      // जर पॅरेंटमध्ये फक्त onDistrictClick असेल, तर सुरक्षित फॉलबॅक
                      onDistrictClick(selectedAreaDistrict, item.area);
                    }
                  }}
                className="bg-slate-50/60 border border-slate-100 p-1.5 rounded-xl flex flex-col items-center justify-between min-h-[72px] hover:border-orange-500/30 transition-all shadow-xs text-center relative cursor-pointer active:scale-95"
              >
                <span className="text-[10px] font-black text-slate-800 line-clamp-1 w-full px-0.5 leading-tight">{item.area}</span>
                <span className="text-[8px] text-slate-400 font-mono font-bold block mt-0.5">{toMarathiNumber(item.pin)}</span>
                <span className="bg-white border border-orange-500/10 text-orange-600 text-[9px] font-black px-1.5 py-0.2 rounded-md shadow-xs w-max mt-1">
                  {toMarathiNumber(item.count)} 🚩
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}