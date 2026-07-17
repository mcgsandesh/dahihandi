 import React, { useState } from 'react'; // 👈 ही ओळ फाईलच्या अगदी टॉपला (Line 1) असावी
import { Search, Filter, Send, UploadCloud, Plus, Link2, Eye, Edit2, RotateCcw, Trash2, CheckSquare, Square, MapPin } from 'lucide-react';
export default function ManageTeams({
  loading,
  importLoading,
  viewTab,
  setViewTab,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  filteredTeams,
  teamsList,
  handlePublishLive,
  handleBulkImportCSV,
  openModal,
  generateSecureLink,
  copyToClipboard,
  setSelectedTeam,
  handleToggleActiveStatus,
  // 🆕 नवीन जोडलेले अप्रूव्हल हँडलर्स (डॅशबोर्ड कडून येणारे)
  handleApproveTeam,
  handleRejectCommentTeam,
  lang
}) {

 

  // 📍 डायनॅमिकली सर्व उपलब्ध जिल्ह्यांची यादी तयार करणे (Unique Districts)
  const districts = ['All', ...new Set(teamsList.map(t => t.district).filter(Boolean))];
  
  // 🆕 लोकल जिल्हा फिल्टर स्टेट (डॅशबोर्डवरून न आणता कॉम्पोनंट पातळीवर सोपं केलं)
  const [selectedDistrict, setSelectedDistrict] = React.useState('All');

  // 🔄 डॅशबोर्ड कडून आलेल्या फिल्टर्ड लिस्टला अजून डीप फिल्टर (जिल्हा + सर्च अपग्रेड 🎯) करणे
  const finalFilteredTeams = filteredTeams.filter(t => {
    // अ) जिल्हा मॅचिंग
    const matchesDistrict = selectedDistrict === 'All' ? true : (t.district?.toLowerCase() === selectedDistrict.toLowerCase());
    
    // ब) सर्च बार अपग्रेड: नाव, प्रमुख सोबत आता AreaName आणि Pincode पण शोधणार!
    const term = searchTerm.toLowerCase().trim();
    const matchesAdvancedSearch = term === '' ? true : (
      t.teamName?.toLowerCase().includes(term) ||
      t.name?.toLowerCase().includes(term) ||
      (t.uid && t.uid.toLowerCase().includes(term)) ||
      t.areaName?.toLowerCase().includes(term) ||
      t.pincode?.toString().includes(term) ||
      t.city?.toLowerCase().includes(term)
    );

    return matchesDistrict && matchesAdvancedSearch;
  });

  return (
    <div className="p-4 md:p-6 w-full animate-in fade-in duration-150">
      <div className="w-full space-y-6">
        
{/* 🔝 [SINGLE LINE TEAM HEADER] - बोल्ड टायटल आणि एकाच रेषेत बटन्स (नो एक्स्ट्रा हाईट 🚀) */}
        <div className="flex flex-row items-center justify-between gap-2 border-b border-slate-100 pb-3 -mt-3 w-full text-left">
          
          {/* डावी बाजू: ठळक आणि बोल्ड टायटल (सबटायटल उडवले जेणेकरून हाईट वाढणार नाही) */}
          <div>
            <h1 className="text-base md:text-xl font-black text-slate-800 uppercase tracking-wide">
              {lang === 'mr' ? 'संघ व्यवस्थापन' : 'Team Management'}
            </h1>
            <p className="text-[9px] md:text-[10px] text-slate-400 font-bold mt-0.5 leading-none">
              {lang === 'mr' 
                ? 'संघांचे व्यवस्थापन, संपादन, मंजुरी, अस्विकृती, डिलीट आणि थेट लाईव्ह पब्लिश व्यवस्था.' 
                : 'Manage, edit, approve, reject, delete and publish all teams.'}
            </p>
          </div>

          {/* उजवी बाजू: बटन्स (आता टायटलच्या अगदी रेषेत वर राहतील) */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              onClick={handlePublishLive}
              disabled={loading}
              className="bg-slate-950 text-white p-2 md:px-3 md:py-1.5 rounded-xl font-bold text-xs shadow-sm hover:bg-slate-800 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 h-[34px] w-[36px] md:w-auto"
              title="Publish Live वेबसाइट"
            >
              <Send size={13} />
              <span className="hidden md:inline">Publish Live</span>
            </button>

            <label className={`cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white p-2 md:px-3 md:py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 active:scale-95 h-[34px] w-[36px] md:w-auto ${importLoading ? 'opacity-50 pointer-events-none' : ''}`} title="Excel Import (.csv)">
              <input type="file" accept=".csv" onChange={handleBulkImportCSV} className="hidden" />
              <UploadCloud size={13} />
              <span className="hidden md:inline">Excel Import</span>
            </label>

            <button onClick={() => openModal()} className="hidden md:flex bg-[#ff6600] text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm hover:bg-[#e65c00] transition-all items-center space-x-1.5 h-[34px]">
              <Plus size={13} /><span>नवीन संघ जोडा</span>
            </button>
          </div>
        </div>

        {/* 📑 सुधारित टॅब्स बार */}
        <div className="flex space-x-1.5 border-b border-slate-200 pb-1 overflow-x-auto scrollbar-none">
          <button onClick={() => setViewTab('active')} className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${viewTab === 'active' ? 'bg-[#0b132b] text-white' : 'bg-white text-slate-600 border border-slate-200 border-b-0'}`}>🟢 सक्रिय ({teamsList.filter(t => !t.isDeleted).length})</button>
          <button onClick={() => setViewTab('form_allowed')} className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${viewTab === 'form_allowed' ? 'bg-green-600 text-white' : 'bg-white text-slate-600 border border-slate-200 border-b-0'}`}>📋 नोंदणी सुरू ({teamsList.filter(t => !t.isDeleted && t.allowInAppForm !== false).length})</button>
          <button onClick={() => setViewTab('edited_pending')} className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${viewTab === 'edited_pending' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200 border-b-0'}`}>⚠️ एडिट केलेले पथक ({teamsList.filter(t => !t.isDeleted && t.hasPendingEdits === true).length})</button>
          <button onClick={() => setViewTab('deactive')} className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${viewTab === 'deactive' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200 border-b-0'}`}>🔴 बंद केलेले ({teamsList.filter(t => t.isDeleted).length})</button>
        </div>

        {/* 🔍 प्रगत सर्च बार, कॅटेगरी आणि जिल्हा फिल्टर हब 🎯 */}
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-3xl items-center">
          <div className="w-full relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Search size={16} /></span>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="UID, संघ, परिसर (Area) किंवा पिनकोडने शोध..." className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm focus:outline-none focus:border-[#ff6600] shadow-sm font-medium transition-all h-[38px]" />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
            {/* कॅटेगरी फिल्टर */}
            <div className="relative flex-1 sm:flex-none">
              <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-500"><Filter size={13} /></span>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#ff6600] shadow-sm h-[38px] cursor-pointer">
                <option value="All">All Category</option>
                <option value="Men">👨‍👦 पुरुष (Men)</option>
                <option value="Women">👩‍👧  महिला (Women)</option>
                <option value="Both">👨‍👩‍👦  दोन्ही (Both)</option>
              </select>
            </div>

            {/* 🆕 नवीन कडक फीचर: जिल्हा निहाय ड्रॉपडाउन फिल्टर */}
            <div className="relative flex-1 sm:flex-none">
              <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-500"><MapPin size={13} className="text-slate-400" /></span>
              <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-7 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#ff6600] shadow-sm h-[38px] appearance-none cursor-pointer">
                {districts.map((dist, idx) => (
                  <option key={idx} value={dist}>{dist === 'All' ? 'सर्व जिल्हे (District)' : `📍 ${dist}`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 🖥️ डेस्कटॉप टेबल यादी व्ह्यू */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-full text-left">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-24">UID</th>
                <th className="p-4">मंडळ / टीमचे नाव</th>
                <th className="p-4">परिसर / जिल्हा</th>
                <th className="p-4">नोंदणी लिंक (WhatsApp)</th>
                <th className="p-4">स्थिती</th>
                <th className="p-4 text-center w-44">क्रिया</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {finalFilteredTeams.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400 text-xs font-medium">या फिल्टरमध्ये कोणताही संघ उपलब्ध नाही भाऊ.</td></tr>
              ) : (
                finalFilteredTeams.map((t, idx) => {
                  const secureLink = generateSecureLink(t);
                  // व्हॉट्सॲपवर चॅट करण्यासाठी नंबर काढणे
                  const contactNumber = t.mobiles && t.mobiles.length > 0 ? t.mobiles[0] : '';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-all text-slate-700">
                      <td className="p-4 font-mono text-xs font-bold text-slate-600 bg-slate-50/50">{t.uid || t.id || '—'}</td>
                      <td className="p-4 font-black text-slate-900 uppercase tracking-wide">
                        <div className="flex items-center space-x-1">
                          <span>{t.teamName}</span>
                          {t.hasPendingEdits && <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-black animate-pulse">EDITED</span>}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5 font-normal text-[11px] text-slate-400">
                          <span>{t.teamCategory || 'Men'}</span>
                          <span>•</span>
                          <span>स्था. {t.establishedYear || '—'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{t.areaName || t.city || '—'}</p>
                        <p className="text-xs text-slate-400 font-mono">{t.district || '—'} {t.pincode ? `(${t.pincode})` : ''}</p>
                      </td>
                      <td className="p-4">
                        {t.allowInAppForm !== false && !t.isDeleted ? (
                          <button onClick={() => copyToClipboard(secureLink)} className="flex items-center space-x-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-600 font-bold px-3 py-1.5 rounded-lg border border-green-200/50 transition-all">
                            <Link2 size={13} /><span>लिंक कॉपी करा</span>
                          </button>
                        ) : (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md font-bold font-mono">📋 माहिती फक्त</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${t.isDeleted ? 'bg-red-50 text-red-600' : (t.hasPendingEdits ? 'bg-orange-50 text-orange-600' : t.isProfileComplete ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600')}`}>
                          {t.isDeleted ? 'बंद' : (t.hasPendingEdits ? 'व्हेरीफाय बाकी' : t.isProfileComplete ? 'पूर्ण' : 'प्रलंबित')}
                        </span>
                      </td>
                      <td className="p-4 flex items-center justify-center space-x-1">
                      {/* 📞 व्हॉट्सॲप डायरेक्ट चॅट आयकॉन (Pre-filled Message सह 🚀) */}
                      {contactNumber && (() => {
                        // १. मराठी संदेशाचा सुबक फॉरमॅट तयार करणे (\n म्हणजे नवीन लाईन)
                        const messageText = `नमस्कार,

                      संघाचे नाव: ${t.teamName || '—'}
                      UID: ${t.uid || t.id || '—'}

                      www.maharashtrachagovinda.com

                      *महाराष्ट्राचा गोविंदा, प्रत्येक गोविंदासाठी!*`;

                        // २. युआरएलसाठी मेसेज सुरक्षित एन्कोड करणे
                        const encodedMessage = encodeURIComponent(messageText);

                        return (
                          <a 
                            href={`https://wa.me/91${contactNumber}?text=${encodedMessage}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" 
                            title="थेट व्हॉट्सॲप संपर्क"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.948h.003c4.177 0 7.882-3.559 7.886-7.928A7.86 7.86 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.69-4.936c-.202-.101-1.196-.59-1.383-.658-.188-.069-.325-.101-.462.101-.138.203-.534.658-.654.793-.12.134-.241.152-.443.051-.2-.102-.843-.311-1.606-.991-.593-.529-1.002-1.182-1.118-1.382-.117-.2-.012-.307.089-.408.092-.091.202-.234.302-.351.101-.117.135-.198.203-.331.067-.133.033-.251-.017-.352-.05-.101-.423-1.018-.578-1.393-.15-.36-.3-.311-.412-.317-.107-.006-.23-.006-.353-.006a.682.682 0 0 0-.492.23c-.168.183-.641.626-.641 1.528 0 .902.656 1.773.748 1.895.093.12 1.287 1.966 3.118 2.754.436.188.776.3 1.042.384.437.139.835.119 1.15.073.351-.05 1.197-.49 1.364-.963.167-.472.167-.878.118-.963-.05-.084-.188-.134-.39-.235z"/>
                            </svg>
                          </a>
                        );
                      })()}
                        <button onClick={() => setSelectedTeam(t)} className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-all" title="पब्लिक प्रोफाईल पहा"><Eye size={15} /></button>
                        {!t.isDeleted && <button onClick={() => openModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={15} /></button>}
                        
                        {/* ⚠️ प्रलंबित मंजुरी बटणे (टॅब व्हेरिफिकेशन ॲक्शन्स) */}
                        {viewTab === 'edited_pending' && (
                          <div className="flex items-center space-x-1">
                            <button onClick={() => handleApproveTeam(t.id || t.uid)} className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-black hover:bg-emerald-700 transition-all">Approve</button>
                            <button onClick={() => handleRejectCommentTeam(t.id || t.uid)} className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-black hover:bg-red-100 transition-all">Comment</button>
                          </div>
                        )}
                        
                        <button onClick={() => handleToggleActiveStatus(t.id, t.isDeleted)} className={`p-2 rounded-xl transition-all ${t.isDeleted ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}>
                          {t.isDeleted ? <RotateCcw size={15} /> : <Trash2 size={15} />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 📱 मोबाईल कॉम्पॅक्ट यादी व्ह्यू */}
        <div className="block md:hidden space-y-2 text-left">
          {finalFilteredTeams.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-100">या फिल्टरमध्ये कोणताही संघ उपलब्ध नाही भाऊ.</div>
          ) : (
            finalFilteredTeams.map((t, idx) => {
              const secureLink = generateSecureLink(t);
              const contactNumber = t.mobiles && t.mobiles.length > 0 ? t.mobiles[0] : '';
              return (
                <div key={idx} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className={`font-mono text-[9px] font-black px-1.5 py-0.5 rounded-md ${t.isDeleted ? 'bg-red-50 text-red-600' : 'bg-[#ff6600]/10 text-[#ff6600]'}`}>{t.uid || t.id || 'No UID'}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wide">{t.teamCategory || 'Men'}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${t.isDeleted ? 'bg-red-50 text-red-500' : (t.hasPendingEdits ? 'bg-orange-50 text-orange-600' : t.isProfileComplete ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600')}`}>
                        {t.isDeleted ? 'बंद' : (t.hasPendingEdits ? 'एडिट प्रलंबित' : t.isProfileComplete ? 'पूर्ण' : 'प्रलंबित')}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide truncate mt-1">{t.teamName}</h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{t.areaName || t.city || '—'}, {t.district || '—'}</p>
                  </div>
                  
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {contactNumber && (
                      <a href={`https://wa.me/91${contactNumber}`} target="_blank" rel="noreferrer" className="p-2 text-emerald-600 bg-emerald-50 rounded-lg border border-emerald-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.948h.003c4.177 0 7.882-3.559 7.886-7.928A7.86 7.86 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.69-4.936c-.202-.101-1.196-.59-1.383-.658-.188-.069-.325-.101-.462.101-.138.203-.534.658-.654.793-.12.134-.241.152-.443.051-.2-.102-.843-.311-1.606-.991-.593-.529-1.002-1.182-1.118-1.382-.117-.2-.012-.307.089-.408.092-.091.202-.234.302-.351.101-.117.135-.198.203-.331.067-.133.033-.251-.017-.352-.05-.101-.423-1.018-.578-1.393-.15-.36-.3-.311-.412-.317-.107-.006-.23-.006-.353-.006a.682.682 0 0 0-.492.23c-.168.183-.641.626-.641 1.528 0 .902.656 1.773.748 1.895.093.12 1.287 1.966 3.118 2.754.436.188.776.3 1.042.384.437.139.835.119 1.15.073.351-.05 1.197-.49 1.364-.963.167-.472.167-.878.118-.963-.05-.084-.188-.134-.39-.235z"/></svg>
                      </a>
                    )}
                    <button onClick={() => setSelectedTeam(t)} className="p-2 text-slate-700 bg-slate-50 active:bg-slate-100 rounded-lg border border-slate-100"><Eye size={13} /></button>
                    {!t.isDeleted && <button onClick={() => openModal(t)} className="p-2 text-blue-600 bg-blue-50 active:bg-blue-100 rounded-lg border border-blue-100"><Edit2 size={13} /></button>}
                    <button onClick={() => handleToggleActiveStatus(t.id, t.isDeleted)} className={`p-2 rounded-lg border ${t.isDeleted ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-500 bg-red-50 border-red-100'}`}>
                      {t.isDeleted ? <RotateCcw size={13} /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}