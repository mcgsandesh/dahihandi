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

      {/* 📱 खेळाडू कार्ड्सची मुख्य कंटेनर यादी (pb-32 सुरक्षित) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden pb-32">
        {filteredPlayers.map((p, index) => {
          const isLastRecords = index >= filteredPlayers.length - 2 && filteredPlayers.length > 2;
          
          return (
            <div 
              key={p.id} 
              className="p-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 hover:bg-slate-50/50 transition-all relative min-h-[100px]"
            >
              
              {/* 🏢 डावी बाजू: प्रोफाईल आणि एका ओळीत डेटा ॲडजस्टमेंट */}
              <div className="flex items-start space-x-3.5 min-w-0 flex-1 pr-8 md:pr-0">
                {/* इनिशियल्स गोल राऊंड */}
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-xs font-black text-slate-700 flex-shrink-0 mt-0.5">
                  {getInitials(p.name)}
                </div>
                
                <div className="min-w-0 flex-1">
                  {/* 🎯 कडक बदल १: नाव आणि वय आता एकाच ओळीत शेजारी शेजारी! */}
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h4 className="text-sm font-black text-slate-800 tracking-wide truncate max-w-[180px] sm:max-w-none">
                      {p.name}
                    </h4>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-1.5 py-0.5 rounded-md font-sans">
                      वय: {calculateAge(p.dob)}
                    </span>
                  </div>
                  
                  {/* 🎯 कडक बदल २: सर्व उरलेले बॅजेस आता एकाच सिंगल ओळीत ॲडजस्ट */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-bold mt-2">
                    {p.tshirt && (
                      <span className="bg-slate-50 text-slate-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200/50 font-mono">
                        👕 {p.tshirt}
                      </span>
                    )}

                    {p.shorts && p.shorts !== '—' && (
                      <span className="bg-slate-50 text-slate-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200/50 font-mono">
                        🩳 {p.shorts}
                      </span>
                    )}
                    
                    {(p.belt === 'Yes' || p.needBelt === 'Yes') && (
                      <span className="bg-amber-50/60 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-100/70 uppercase">
                        🎗️ Belt
                      </span>
                    )}

                    {(p.towel === 'Yes' || p.needTowel === 'Yes') && (
                      <span className="bg-sky-50/60 text-sky-800 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-sky-100/70 uppercase">
                        🧼 Towel
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* मोबाईलवर ३-डॉट्स बटण (Top Right Position - एकदम फिक्स) */}
              <div className="absolute top-2 right-2 md:hidden">
                <div className="relative group">
                  <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all focus:outline-none active:bg-slate-200">
                    <MoreVertical size={18} />
                  </button>
                  
                  <div className={`absolute right-0 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 w-36 hidden group-focus-within:block group-hover:block z-50 pointer-events-auto animate-in fade-in zoom-in-95 duration-100 ${
                    isLastRecords ? 'bottom-10' : 'top-10'
                  }`}>
                    <a href={`tel:${p.mobile}`} className="flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Phone size={13} className="text-emerald-500" /> <span>कॉल करा</span></a>
                    <a href={`https://wa.me/91${p.mobile}`} target="_blank" rel="noreferrer" className="flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><MessageSquare size={13} className="text-green-500" /> <span>व्हॉट्सॲप</span></a>
                    <button onClick={() => openPlayerModal(p)} className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 text-left"><Edit2 size={13} className="text-blue-500" /> <span>सुधार करा</span></button>
                    <button onClick={() => handleSoftDelete(p.id, p.name)} className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 text-left border-t border-slate-100"><Trash2 size={13} /> <span>काढून टाका</span></button>
                  </div>
                </div>
              </div>

              {/* प्रोफेशनल मॉडर्न टॉगल बटन्स */}
              <div className="flex items-center space-x-2.5 justify-between md:justify-end w-full md:w-auto">
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleFastToggleInsurance(p.id, p.insurance)} 
                    className={`flex-1 md:flex-initial md:w-32 text-center py-2 md:py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      p.insurance === 'Done' || p.insurance === 'झालेले' 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/10' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p.insurance === 'Done' || p.insurance === 'झालेले' ? '🛡️ विमा पूर्ण' : '⏳ विमा बाकी'}
                  </button>
                  
                  <button 
                    onClick={() => handleFastToggleTshirt(p.id, p.tshirtGiven)} 
                    className={`flex-1 md:flex-initial md:w-32 text-center py-2 md:py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      p.tshirtGiven === 'Yes' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/10' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p.tshirtGiven === 'Yes' ? '👕 टी-शर्ट दिला' : '📦 टी-शर्ट बाकी'}
                  </button>
                </div>

                {/* डेस्कटॉप स्क्रीन ॲक्शन बटन्स */}
                <div className="hidden md:flex items-center space-x-1 pl-1">
                  <a href={`tel:${p.mobile}`} title="कॉल करा" className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"><Phone size={15} /></a>
                  <a href={`https://wa.me/91${p.mobile}`} target="_blank" rel="noreferrer" title="व्हॉट्सॲप" className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"><MessageSquare size={15} /></a>
                  <button onClick={() => openPlayerModal(p)} title="सुधार करा" className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"><Edit2 size={15} /></button>
                  <button onClick={() => handleSoftDelete(p.id, p.name)} title="काढून टाका" className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"><Trash2 size={15} /></button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}