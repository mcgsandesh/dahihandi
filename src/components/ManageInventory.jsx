import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Edit2, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ManageInventory({ user, teamData, setTeamData, playersList, onBack }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 🎯 कडक सुरक्षा: प्लेयर्स लिस्ट उपलब्ध नसेल तर रिकामी अरे सिंक करणे (एरर नाहीसा झाला)
  const safePlayersList = playersList || [];
  
  // फॉर्मसाठी इनपुट स्टेट्स
  const [invData, setInvData] = useState({
    tshirt_S: 0, tshirt_M: 0, tshirt_L: 0, tshirt_XL: 0, tshirt_2XL: 0, tshirt_3XL: 0, tshirt_4XL: 0, tshirt_Custom: 0,
    shorts_S: 0, shorts_M: 0, shorts_L: 0, shorts_XL: 0, shorts_2XL: 0, shorts_3XL: 0, shorts_4XL: 0, shorts_Custom: 0,
    belt: 0, towel: 0
  });

  useEffect(() => {
    if (teamData?.inventory) {
      setInvData(prev => ({ ...prev, ...teamData.inventory }));
    }
  }, [teamData]);

  const tshirtSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'Custom'];
  const shortsSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'Custom'];
  const currentInv = teamData?.inventory || {};

  // साठा फायरबेसमध्ये जतन करणे
  const handleSaveInventory = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const adminEmail = user.email || user.info?.email;
      const userRef = doc(db, "users", adminEmail);

      const cleanInventory = {};
      tshirtSizes.forEach(sz => { cleanInventory[`tshirt_${sz}`] = Number(invData[`tshirt_${sz}`] || 0); });
      shortsSizes.forEach(sz => { cleanInventory[`shorts_${sz}`] = Number(invData[`shorts_${sz}`] || 0); });
      cleanInventory.belt = Number(invData.belt || 0);
      cleanInventory.towel = Number(invData.towel || 0);
      cleanInventory.invUpdatedAt = serverTimestamp();

      await updateDoc(userRef, { inventory: cleanInventory });
      if (setTeamData) setTeamData(prev => ({ ...prev, inventory: cleanInventory }));
      
      setIsModalOpen(false);
      Swal.fire({ icon: 'success', title: 'साठा जतन झाला! 🎉', text: 'इन्वेंटरी यशस्वीरित्या अपडेट झाली आहे.', showConfirmButton: false, timer: 1500, customClass: { popup: 'rounded-3xl' } });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'अडचण आली!', text: 'माहिती सुरक्षित करता आली नाही.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* हेडर विभाग */}
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack} 
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 active:bg-slate-200 transition-all flex items-center justify-center flex-shrink-0"
            title="मागे जा"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800">साठा व्यवस्थापन (Inventory)</h1>
            <p className="text-[10px] text-slate-400 font-bold">हिशोब वर्ष: {user.currentYear || "2026"}</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all active:scale-95 flex-shrink-0"
        >
          <Edit2 size={13} />
          <span>साठा अपडेट करा</span>
        </button>
      </div>

      {/* 📊 मुख्य डेटा डिस्प्ले - वर्षानुसार संपूर्ण अहवाल */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xs font-black text-slate-800 border-b pb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ff6600]"></span> चालू वर्ष एकूण उपलब्ध साठा - {user.currentYear || "2026"}
        </h3>
        
        {/* समरी ग्रीड */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100/60">
            <p className="text-[10px] uppercase font-black text-purple-500 tracking-wider">एकूण टी-शर्ट</p>
            <p className="text-xl font-black font-mono text-purple-900 mt-1">
              {tshirtSizes.reduce((sum, sz) => sum + Number(currentInv[`tshirt_${sz}`] || 0), 0)}
            </p>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/60">
            <p className="text-[10px] uppercase font-black text-indigo-500 tracking-wider">एकूण शॉर्ट्स</p>
            <p className="text-xl font-black font-mono text-indigo-900 mt-1">
              {shortsSizes.reduce((sum, sz) => sum + Number(currentInv[`shorts_${sz}`] || 0), 0)}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider">कमर बेल्ट</p>
            <p className="text-xl font-black font-mono text-slate-900 mt-1">{currentInv.belt || 0}</p>
          </div>

          <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100/60">
            <p className="text-[10px] uppercase font-black text-teal-500 tracking-wider">टॉवेल साठा</p>
            <p className="text-xl font-black font-mono text-teal-900 mt-1">{currentInv.towel || 0}</p>
          </div>
        </div>

{/* 📋 🎯 एकदम मॉडर्न आणि प्रिमियम विश्लेषण विभाग (Table Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* 👕 टी-शर्ट विश्लेषण टेबल */}
          <div className="bg-slate-50/40 border border-slate-200/60 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-base">👕</span>
              <h4 className="text-sm font-black text-slate-850 tracking-tight">टी-शर्ट वितरण व शिल्लक हिशोब</h4>
            </div>
            
            <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">साईझ</th>
                    <th className="py-3 px-2 text-center">एकूण साठा</th>
                    <th className="py-3 px-2 text-center">वाटप</th>
                    <th className="py-3 px-4 text-right">शिल्लक</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                  {tshirtSizes.map(sz => {
                    const stock = Number(currentInv[`tshirt_${sz}`] || 0);
                    const given = safePlayersList.filter(p => p.tshirt === sz && p.tshirtGiven === 'Yes').length;
                    if (stock === 0 && given === 0) return null;
                    const left = Math.max(0, stock - given);

                    return (
                      <tr key={sz} className="hover:bg-slate-50/50 transition-all font-mono">
                        <td className="py-3 px-4 font-black text-slate-800 font-sans">{sz === 'Custom' ? '✏️ Custom' : sz}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{stock}</td>
                        <td className="py-3 px-2 text-center text-purple-600">{given}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2.5 py-0.5 rounded-lg font-black text-[11px] ${left === 0 ? 'bg-red-50 text-red-600' : left <= 5 ? 'bg-amber-50 text-orange-600' : 'bg-green-50 text-emerald-600'}`}>
                            {left}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {tshirtSizes.every(sz => Number(currentInv[`tshirt_${sz}`] || 0) === 0) && (
                <p className="text-slate-400 text-[11px] font-medium text-center py-6 bg-white">टी-शर्टचा साठा नोंदवलेला नाही.</p>
              )}
            </div>
          </div>

          {/* 🩳 शॉर्ट्स विश्लेषण टेबल */}
          <div className="bg-slate-50/40 border border-slate-200/60 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-base">🩳</span>
              <h4 className="text-sm font-black text-slate-850 tracking-tight">शॉर्ट्स वितरण व शिल्लक हिशोब</h4>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">साईझ</th>
                    <th className="py-3 px-2 text-center">एकूण साठा</th>
                    <th className="py-3 px-2 text-center">वाटप</th>
                    <th className="py-3 px-4 text-right">शिल्लक</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                  {shortsSizes.map(sz => {
                    const stock = Number(currentInv[`shorts_${sz}`] || 0);
                    const given = safePlayersList.filter(p => p.shorts === sz && p.tshirtGiven === 'Yes').length;
                    if (stock === 0 && given === 0) return null;
                    const left = Math.max(0, stock - given);

                    return (
                      <tr key={sz} className="hover:bg-slate-50/50 transition-all font-mono">
                        <td className="py-3 px-4 font-black text-slate-800 font-sans">{sz === 'Custom' ? '✏️ Custom' : sz}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{stock}</td>
                        <td className="py-3 px-2 text-center text-indigo-600">{given}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2.5 py-0.5 rounded-lg font-black text-[11px] ${left === 0 ? 'bg-red-50 text-red-600' : left <= 5 ? 'bg-amber-50 text-orange-600' : 'bg-green-50 text-emerald-600'}`}>
                            {left}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {shortsSizes.every(sz => Number(currentInv[`shorts_${sz}`] || 0) === 0) && (
                <p className="text-slate-400 text-[11px] font-medium text-center py-6 bg-white">शॉर्ट्सचा साठा नोंदवलेला नाही.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 📦 अंतर्गत सुरक्षित पॉपअप मोडल */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto transform scale-100 transition-all font-sans">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-800">📦 इन्व्हेंटरी साठा नोंदवा</h3>
                <p className="text-[10px] text-orange-500 font-bold mt-0.5">अचूक आकडे भरून साठा सिंक करा</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveInventory} className="space-y-5 text-xs font-bold text-slate-600">
              {/* टी-शर्ट */}
              <div>
                <span className="text-[11px] font-black text-purple-600 uppercase tracking-wider block mb-2">👕 टी-शर्ट संख्या</span>
                <div className="grid grid-cols-4 gap-2.5">
                  {tshirtSizes.map(sz => (
                    <div key={sz} className="flex flex-col space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <label className="text-[10px] text-slate-500 text-center font-black">{sz === 'Custom' ? 'Custom' : sz}</label>
                      <input 
                        type="number" min="0" placeholder="0"
                        value={invData[`tshirt_${sz}`] || ''} 
                        onChange={(e) => setInvData(prev => ({ ...prev, [`tshirt_${sz}`]: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1 text-center font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* शॉर्ट्स */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider block mb-2">🩳 शॉर्ट्स संख्या</span>
                <div className="grid grid-cols-4 gap-2.5">
                  {shortsSizes.map(sz => (
                    <div key={sz} className="flex flex-col space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <label className="text-[10px] text-slate-500 text-center font-black">{sz === 'Custom' ? 'Custom' : sz}</label>
                      <input 
                        type="number" min="0" placeholder="0"
                        value={invData[`shorts_${sz}`] || ''} 
                        onChange={(e) => setInvData(prev => ({ ...prev, [`shorts_${sz}`]: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1 text-center font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* बेल्ट आणि टॉवेल */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">🎗️ कमर बेल्ट (Belt)</label>
                  <input 
                    type="number" min="0" placeholder="संख्या"
                    value={invData.belt || ''} 
                    onChange={(e) => setInvData(prev => ({ ...prev, belt: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-black text-teal-600 uppercase tracking-wider">🧼 टॉवेल (Towel)</label>
                  <input 
                    type="number" min="0" placeholder="संख्या"
                    value={invData.towel || ''} 
                    onChange={(e) => setInvData(prev => ({ ...prev, towel: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* बटन्स */}
              <div className="pt-3 border-t border-slate-100 flex items-center space-x-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl font-bold transition-all">रद्द करा</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#ff6600] hover:bg-[#e65c00] text-white py-2.5 rounded-xl font-black shadow-md transition-all">{loading ? 'जतन होत आहे...' : 'साठा जतन करा'}</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}