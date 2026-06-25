import React, { useState } from 'react';
import { Search, Plus, Phone, MessageSquare, Edit2, Trash2, MoreVertical } from 'lucide-react';

export default function PlayersList({
  filteredPlayers,
  searchTerm,
  setSearchTerm,
  calculateAge,
  getInitials,
  handleFastToggleInsurance,
  handleFastToggleTshirt,
  openPlayerModal,
  handleSoftDelete,
  setActiveTab,
  playersList,
  inventoryData
}) {

  const inv = inventoryData || {};
  const safePlayers = playersList || [];
  
  // पॉपअप कंट्रोल करण्यासाठी स्टेट
  const [showCustomPopup, setShowCustomPopup] = useState(false);

  // मुख्य फिक्स ७ साईजेस
  const mainSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

  // 👕 १. टी-शर्ट मुख्य साठा कॅल्क्युलेशन
  const mainTshirtStock = mainSizes.map(size => {
    const stock = Number(inv[`tshirt_${size}`] || 0);
    const given = safePlayers.filter(p => p.tshirt === size && p.tshirtGiven === 'Yes').length;
    return Math.max(0, stock - given);
  });

  // 🩳 २. शॉर्ट्स मुख्य साठा कॅल्क्युलेशन
  const mainShortsStock = mainSizes.map(size => {
    const stock = Number(inv[`shorts_${size}`] || 0);
    const given = safePlayers.filter(p => p.shorts === size && p.tshirtGiven === 'Yes').length;
    return Math.max(0, stock - given);
  });

  // 🔍 🎯 कन्सोल लॉग विभाग (डेटा ट्रॅकिंगसाठी)
  console.log("=== 📦 INVENTORY LIVE DATA ===", inv);
  console.log("=== 👥 TOTAL PLAYERS IN LIST ===", safePlayers.length);

  // ✏️ ३. इतर सर्व कस्टम साईजेस शोधण्याचे आणि कॅल्क्युलेट करण्याचे सुधारित लॉजिक
  const customInventoryKeys = Object.keys(inv).filter(k => k.startsWith('tshirt_') || k.startsWith('shorts_'));
  const loggedPlayerCustomSizes = safePlayers.map(p => p.tshirt).concat(safePlayers.map(p => p.shorts));
  
  const allUniqueCustomSizes = Array.from(new Set(
    customInventoryKeys
      .map(k => k.replace('tshirt_', '').replace('shorts_', ''))
      .concat(loggedPlayerCustomSizes)
  )).filter(size => size && !mainSizes.includes(size));

  console.log("🎯 All Detected Custom Sizes (S to 4XL सोडून):", allUniqueCustomSizes);

  // कस्टम साईजेसचा डेटा कलेक्ट करणे
  const customSizesData = allUniqueCustomSizes.map(size => {
    // जर फायरबेस की 'tshirt_Custom' असेल किंवा डायरेक्ट साईझचे नाव असेल (उदा. tshirt_30)
    const tStock = Number(inv[`tshirt_${size}`] || (size === 'Custom' ? inv['tshirt_Custom'] : 0));
    const sStock = Number(inv[`shorts_${size}`] || (size === 'Custom' ? inv['shorts_Custom'] : 0));
    
    const tGiven = safePlayers.filter(p => p.tshirt === size && p.tshirtGiven === 'Yes').length;
    const sGiven = safePlayers.filter(p => p.shorts === size && p.tshirtGiven === 'Yes').length;
    
    const tLeft = Math.max(0, tStock - tGiven);
    const sLeft = Math.max(0, sStock - sGiven);

    console.log(`📊 Size [${size}] -> Stock(T/S): ${tStock}/${sStock} | Given(T/S): ${tGiven}/${sGiven} | Left(T/S): ${tLeft}/${sLeft}`);

    return { size, tLeft, sLeft };
  }).filter(d => d.tLeft > 0 || d.sLeft > 0 || Number(inv[`tshirt_${d.size}`]) > 0 || Number(inv[`shorts_${d.size}`]) > 0);

  console.log("🔥 Final Processed Custom Sizes for Popup:", customSizesData);

  // बेल्ट आणि टॉवेल शिल्लक
  const totalBeltGiven = safePlayers.filter(p => p.belt === 'Yes' && p.tshirtGiven === 'Yes').length;
  const totalTowelGiven = safePlayers.filter(p => p.towel === 'Yes' && p.tshirtGiven === 'Yes').length;
  const leftBelt = Math.max(0, Number(inv.belt || 0) - totalBeltGiven);
  const leftTowel = Math.max(0, Number(inv.towel || 0) - totalTowelGiven);

  return (
    <div className="space-y-4">
      
      {/* हेडर विभाग */}
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button onClick={() => setActiveTab('dashboard')} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-all flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="text-xl font-black text-slate-800">खेळाडू यादी ({filteredPlayers.length})</h1>
        </div>
        <button onClick={() => openPlayerModal()} className="hidden md:flex bg-[#ff6600] hover:bg-[#e65c00] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md items-center space-x-1.5 transition-all active:scale-95">
          <Plus size={14} /><span>खेळाडू जोडा</span>
        </button>
      </div>

      {/* टेबल मॅट्रिक्स लेआउट */}
      <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-sm text-[11px] font-black text-slate-700 space-y-3 relative">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="text-slate-400 text-[9px] uppercase tracking-wider border-b border-slate-100">
                <th className="py-1 px-1 text-left font-bold text-slate-400">SIZE</th>
                {mainSizes.map(size => (
                  <th key={size} className="py-1 px-1 font-mono font-black text-slate-800 min-w-[35px]">{size}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono text-slate-600">
              <tr className="hover:bg-slate-50/40">
                <td className="py-1.5 px-1 text-left font-sans font-bold text-purple-700">T (शिल्लक)</td>
                {mainTshirtStock.map((stock, i) => (
                  <td key={i} className="py-1.5 px-1 text-purple-600 font-bold">{stock}</td>
                ))}
              </tr>
              <tr className="border-t border-slate-100 hover:bg-slate-50/40">
                <td className="py-1.5 px-1 text-left font-sans font-bold text-indigo-700">S (शिल्लक)</td>
                {mainShortsStock.map((stock, i) => (
                  <td key={i} className="py-1.5 px-1 text-indigo-600 font-bold">{stock}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* बेल्ट, टॉवेल आणि मोकळ्या जागेत कडक कस्टम बटण */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 flex-wrap gap-2 relative">
          <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-sans">
            <div>बेल्ट: <span className="text-slate-900 font-mono font-black bg-slate-50 border px-1.5 py-0.5 rounded-md ml-0.5">{leftBelt}</span></div>
            <div>टॉवेल: <span className="text-teal-600 font-mono font-black bg-slate-50 border px-1.5 py-0.5 rounded-md ml-0.5">{leftTowel}</span></div>
          </div>

          {/* ⚡ इतर साइजचे बटण */}
          {customSizesData.length > 0 ? (
            <div className="relative">
              <button 
                onClick={() => setShowCustomPopup(!showCustomPopup)}
                onMouseEnter={() => setShowCustomPopup(true)}
                onMouseLeave={() => setShowCustomPopup(false)}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-xl flex items-center space-x-1 transition-all active:scale-95 text-[10px]"
              >
                <span>✏️ इतर साईझ ({customSizesData.length})</span>
              </button>

              {/* फ्लोटिंग पॉपअप ड्रॉपडाऊन कार्ड */}
              {showCustomPopup && (
                <div 
                  className="absolute right-0 bottom-7 bg-[#0b132b] text-white p-3 rounded-xl shadow-2xl border border-slate-800 w-48 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 font-sans"
                  onMouseEnter={() => setShowCustomPopup(true)}
                  onMouseLeave={() => setShowCustomPopup(false)}
                >
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1 mb-2">स्पेशल साईझ साठा</div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {customSizesData.map(d => (
                      <div key={d.size} className="flex justify-between items-center bg-white/5 px-2 py-1 rounded-lg">
                        <span className="font-sans font-black text-amber-500 text-[11px]">{d.size}</span>
                        <span className="text-slate-300">T: <b className="text-purple-400">{d.tLeft}</b> | S: <b className="text-indigo-400">{d.sLeft}</b></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // जर कोणताही डेटा कलेक्ट झाला नाही तर कन्सोलमध्ये व्हेरिफाय करण्यासाठी डेव्हलपमेंट नोट
            <span className="text-[9px] text-slate-300 font-normal">नो कस्टम साईझ</span>
          )}
        </div>
      </div>

      {/* इथून खाली तुमची फिल्टर प्लेयर्स यादी सुरू राहू दे... */}

      {/* इथून खाली तुझा ओरिजिनल सर्च बार आणि प्लेयर्स लिस्ट कार्ड्स चालू होतील... */}

      {/* सर्च बार */}
      <div className="w-full relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Search size={18} /></span>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="नाव किंवा मोबाईलने शोधा..." 
          className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none" 
        />
      </div>

      {/* खेळाडू कार्ड्स यादी */}
<div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        {filteredPlayers.map((p, index) => {
          const isLastRecords = index >= filteredPlayers.length - 2 && filteredPlayers.length > 2;
          return (
            <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 hover:bg-slate-50/40 transition-all relative">
              
            {/* डावी बाजू: प्रोफाईल फोटो/नाव/माहिती */}
              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-[#ff6600]/10 border border-[#ff6600]/20 flex items-center justify-center text-xs font-black text-[#ff6600] flex-shrink-0">
                  {getInitials(p.name)}
                </div>
                <div className="truncate flex-1">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{p.name}</h4>
                  
                  {/* 🎯 एकदम कडक बदल: वयासोबत आता टी-शर्ट आणि शॉर्ट्सचे पण प्रिमियम बॅजेस (Chips) */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-bold mt-1">
                    <span className="text-slate-500 font-sans mr-0.5">वय: {calculateAge(p.dob)}</span>
                    
                    {/* 👕 टी-शर्ट साईझ बॅज (प्रिमियम पर्पल चिप) */}
                    {p.tshirt && (
                      <span className="bg-purple-50 text-purple-700 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-purple-100/70 font-mono">
                        👕 {p.tshirt}
                      </span>
                    )}

                    {/* 🩳 शॉर्ट्स साईझ बॅज (प्रिमियम इंडिगो चिप) */}
                    {p.shorts && p.shorts !== '—' && (
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-indigo-100/70 font-mono">
                        🩳 {p.shorts}
                      </span>
                    )}
                    
                    {/* 🎗️ कमर बेल्ट बॅज (फक्त 'Yes' असेल तरच दिसेल) */}
                    {(p.belt === 'Yes' || p.needBelt === 'Yes') && (
                      <span className="bg-slate-100 text-slate-700 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-slate-200 uppercase tracking-tight">
                        🎗️ Belt
                      </span>
                    )}

                    {/* 🧼 टॉवेल बॅज (फक्त 'Yes' असेल तरच दिसेल) */}
                    {(p.towel === 'Yes' || p.needTowel === 'Yes') && (
                      <span className="bg-teal-50 text-teal-700 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-teal-200 uppercase tracking-tight">
                        🧼 Towel
                      </span>
                    )}
                  </div>

                </div>
              </div>

              {/* उजवी बाजू: मूळ टॉगल बट्स + सर्व ॲक्शन बट्स */}
              <div className="flex items-center space-x-3 justify-between md:justify-end">
                
                {/* विमा आणि टी-शर्ट फास्ट टॉगल्स */}
                <div className="flex items-center space-x-2 flex-1 md:flex-initial pt-1 md:pt-0">
                  <button onClick={() => handleFastToggleInsurance(p.id, p.insurance)} className={`flex-1 md:flex-initial md:w-32 text-center py-2 md:py-1 rounded-xl text-[10px] font-black border ${p.insurance === 'Done' || p.insurance === 'झालेले' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{p.insurance === 'Done' || p.insurance === 'झालेले' ? '🛡️ विमा पूर्ण' : '⏳ विमा प्रलंबित'}</button>
                  <button onClick={() => handleFastToggleTshirt(p.id, p.tshirtGiven)} className={`flex-1 md:flex-initial md:w-32 text-center py-2 md:py-1 rounded-xl text-[10px] font-black border ${p.tshirtGiven === 'Yes' ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{p.tshirtGiven === 'Yes' ? '👕 टी-शर्ट दिला' : '📦 टी-शर्ट बाकी'}</button>
                </div>

                {/* ॲक्शन बटन्स ब्लॉक */}
                <div className="relative flex items-center">
                  {/* डेस्कटॉप ॲक्शन बटन्स */}
                  <div className="hidden md:flex items-center space-x-1.5 mr-2">
                    <a href={`tel:${p.mobile}`} title="कॉल करा" className="p-2 hover:bg-green-50 text-green-600 rounded-xl transition-all"><Phone size={16} /></a>
                    <a href={`https://wa.me/91${p.mobile}`} target="_blank" rel="noreferrer" title="व्हॉट्सॲप" className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all"><MessageSquare size={16} /></a>
                    <button onClick={() => { console.log("✏️ Editing Player Data:", p); openPlayerModal(p); }} title="सुधार करा" className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleSoftDelete(p.id, p.name)} title="काढून टाका" className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>

                  {/* मोबाईल ३-डॉट्स मेनू */}
                  <div className="relative group md:hidden">
                    <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all focus:outline-none">
                      <MoreVertical size={18} />
                    </button>
                    
                    <div className={`absolute right-0 bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 w-32 hidden group-focus-within:block group-hover:block z-50 pointer-events-auto animate-in fade-in duration-150 ${
                      isLastRecords ? 'bottom-9' : 'top-9'
                    }`}>
                      <a href={`tel:${p.mobile}`} className="flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-green-600 hover:bg-slate-50"><Phone size={13} /> <span>कॉल करा</span></a>
                      <a href={`https://wa.me/91${p.mobile}`} target="_blank" rel="noreferrer" className="flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-slate-50"><MessageSquare size={13} /> <span>व्हॉट्सॲप</span></a>
                      <button onClick={() => { console.log("✏️ Editing Player Data Mobile:", p); openPlayerModal(p); }} className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-slate-50 text-left"><Edit2 size={13} /> <span>सुधार करा</span></button>
                      <button onClick={() => handleSoftDelete(p.id, p.name)} className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 text-left border-t border-slate-100"><Trash2 size={13} /> <span>काढून टाका</span></button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}