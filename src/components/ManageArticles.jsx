import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { PenTool, Image, User, Link2, Trash2, Globe, Layers, Eye, EyeOff, Bold, List, Heading, Plus, Edit3, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ManageArticles() {
  // फॉर्म दृश्यता आणि एडिट स्टेट्स
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // फॉर्म फील्ड्स स्टेट्स
  const [titleMr, setTitleMr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentMr, setContentMr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [reference, setReference] = useState('');
  const [category, setCategory] = useState('इतिहास');

  // डेटा यादी स्टेट्स
  const [articlesList, setArticlesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formTab, setFormTab] = useState('mr');

  // १. फायरबेसमधून लेखांची यादी आणणे
  const fetchArticles = async () => {
    try {
      const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const articles = [];
      querySnapshot.forEach((doc) => {
        articles.push({ id: doc.id, ...doc.data() });
      });
      setArticlesList(articles);
    } catch (err) {
      console.error("❌ लेख आणताना एरर:", err);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // ✍️ मजकुरामध्ये फॉर्मॅटिंग टॅग्ज जोडण्यासाठी हेल्पर
  const injectFormatting = (type) => {
    const textarea = document.getElementById(formTab === 'mr' ? 'contentMrField' : 'contentEnField');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    let replacement = '';
    if (type === 'bold') replacement = `**${selected || 'ठळक मजकूर'}**`;
    if (type === 'bullet') replacement = `\n- ${selected || 'मुद्दा १'}`;
    if (type === 'p') replacement = `\n\n${selected || 'नवीन परिच्छेद...'}\n\n`;

    if (formTab === 'mr') {
      setContentMr(text.substring(0, start) + replacement + text.substring(end));
    } else {
      setContentEn(text.substring(0, start) + replacement + text.substring(end));
    }
  };

  // २. लेख सेव्ह किंवा अपडेट करणे (Common Add/Edit Logic)
  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!titleMr.trim() || !contentMr.trim()) {
      Swal.fire({ icon: 'error', title: 'मराठी शीर्षक आणि मजकूर अनिवार्य आहे!' });
      return;
    }

    setLoading(true);
    try {
      const articleData = {
        titleMr: titleMr.trim(),
        titleEn: titleEn.trim() || titleMr.trim(),
        contentMr: contentMr.trim(),
        contentEn: contentEn.trim() || "English version coming soon...",
        imageUrl: imageUrl.trim() || 'https://via.placeholder.com/800x400?text=Govinda+Katta',
        authorName: authorName.trim() || 'लेखक',
        authorRole: authorRole.trim() || 'संपादक',
        reference: reference.trim(),
        category: category,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        // अपडेट मोड ✏️
        const docRef = doc(db, "articles", editingId);
        await updateDoc(docRef, articleData);
        Swal.fire({ icon: 'success', title: 'लेख यशस्वीरित्या अपडेट झाला! 📜', timer: 1200, showConfirmButton: false });
      } else {
        // नवीन जोडा मोड ➕
        articleData.views = 0;
        articleData.likes = 0;
        articleData.isVisible = true;
        articleData.createdAt = serverTimestamp();
        await addDoc(collection(db, "articles"), articleData);
        Swal.fire({ icon: 'success', title: 'लेख यशस्वीरित्या पब्लिश झाला! 🚩', timer: 1200, showConfirmButton: false });
      }

      // फॉर्म रीसेट आणि बंद करणे
      resetForm();
      fetchArticles();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'कृती करताना राडा झाला!' });
    } finally {
      setLoading(false);
    }
  };

  // ३. एडिट मोड ॲक्टिव्हेट करणे (Common Form Pre-fill)
  const handleEditClick = (art) => {
    setEditingId(art.id);
    setTitleMr(art.titleMr || '');
    setTitleEn(art.titleEn || '');
    setContentMr(art.contentMr || '');
    setContentEn(art.contentEn || '');
    setImageUrl(art.imageUrl || '');
    setAuthorName(art.authorName || '');
    setAuthorRole(art.authorRole || '');
    setReference(art.reference || '');
    setCategory(art.category || 'इतिहास');
    
    setIsFormOpen(true); // फॉर्म ओपन
    window.scrollTo({ top: 0, behavior: 'smooth' }); // वरती स्क्रोल
  };

  // फॉर्म रीसेट हेल्पर
  const resetForm = () => {
    setEditingId(null);
    setTitleMr(''); setTitleEn(''); setContentMr(''); setContentEn('');
    setImageUrl(''); setAuthorName(''); setAuthorRole(''); setReference('');
    setCategory('इतिहास');
    setIsFormOpen(false);
  };

  // ४. सॉफ्ट डिलीट दृश्यता टोगल
  const handleToggleVisibility = async (id, currentStatus) => {
    try {
      const docRef = doc(db, "articles", id);
      await updateDoc(docRef, { isVisible: !currentStatus });
      Swal.fire({ icon: 'success', title: !currentStatus ? 'लेख कट्ट्यावर लाईव्ह केला! 👁️' : 'लेख पब्लिक व्ह्यूधून लपवला! 👁️‍🗨️', timer: 1000, showConfirmButton: false });
      fetchArticles();
    } catch (err) { console.error(err); }
  };

  // ५. हार्ड डिलीट
  const handleHardDelete = async (id) => {
    const result = await Swal.fire({ 
      title: 'कायमचा उडवायचा?', 
      text: "हा लेख डेटाबेसमधून कायमचा नष्ट होईल!", 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonColor: '#dc2626', 
      confirmButtonText: 'हो, नष्ट करा!' 
    });
    if (result.isConfirmed) {
      await deleteDoc(doc(db, "articles", id));
      Swal.fire({ icon: 'success', title: 'लेख उडवला!', timer: 1000, showConfirmButton: false });
      fetchArticles();
    }
  };

  return (
    <div className="space-y-4 text-left text-slate-700 w-full px-2">
      
      {/* 🔝 टॉप हेडर आणि ॲड बटन रो */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-sm font-black text-slate-800 uppercase tracking-wider">दहीहंडी विशेष लेख व्यवस्थापन</h1>
          <p className="text-[10px] text-slate-400 font-bold">येथून तुम्ही कट्ट्यावरील लेख नियंत्रित करू शकता.</p>
        </div>
        
        {!isFormOpen ? (
          <button 
            type="button" 
            onClick={() => setIsFormOpen(true)} 
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center space-x-1.5 active:scale-95"
          >
            <Plus size={14} /> <span>नवीन लेख जोडा</span>
          </button>
        ) : (
          <button 
            type="button" 
            onClick={resetForm} 
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center space-x-1.5 active:scale-95"
          >
            <X size={14} /> <span>फॉर्म बंद करा</span>
          </button>
        )}
      </div>

      {/* ✍️ डायनॅमिक फ्लूइड लेख निर्मिती फॉर्म (टोगल ओपन 🚀) */}
      {isFormOpen && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <div className="flex items-center space-x-2">
              <PenTool className="text-orange-500" size={16} />
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {editingId ? 'लेख संपादन कक्ष (Editing Mode)' : 'दहीहंडी ज्ञानपीठ लेख निर्मिती कक्ष'}
              </h2>
            </div>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>

          <form onSubmit={handleSaveArticle} className="space-y-3">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">लेखकाचे नाव</label>
                <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="संदीप महाडिक" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">हुद्दा/रोल</label>
                <input type="text" value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} placeholder="माजी गोविंदा / संपादक" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">वर्ग (Category)</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer">
                  <option value="इतिहास">🚩 इतिहास व संस्कृती</option>
                  <option value="सुरक्षा">🛡️ सुरक्षा व नियम</option>
                  <option value="अनुभव">💪 पथकांचे अनुभव</option>
                  <option value="सराव">⚡ सराव टिप्स</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">संदर्भ / Reference</label>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="उदा. लोकसत्ता वृत्त" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-orange-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">मुख्य फोटो लिंक (Image URL)</label>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://image-link.com/photo.jpg" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-orange-500" />
            </div>

            {/* भाषा स्विच आणि मिनी टूलबार कप्पा */}
            <div className="flex flex-wrap items-center justify-between border-t pt-2 gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-lg space-x-0.5">
                <button type="button" onClick={() => setFormTab('mr')} className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${formTab === 'mr' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'}`}>मराठी लेख</button>
                <button type="button" onClick={() => setFormTab('en')} className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${formTab === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}>English Version</button>
              </div>

              <div className="flex bg-slate-50 border rounded-lg p-0.5 space-x-1 text-slate-500">
                <button type="button" onClick={() => injectFormatting('bold')} title="Bold" className="p-1 hover:bg-slate-200 rounded transition-all"><Bold size={12} /></button>
                <button type="button" onClick={() => injectFormatting('bullet')} title="Bullet List" className="p-1 hover:bg-slate-200 rounded transition-all"><List size={12} /></button>
                <button type="button" onClick={() => injectFormatting('p')} title="Paragraph" className="p-1 hover:bg-slate-200 rounded transition-all"><Heading size={12} /></button>
              </div>
            </div>

            {formTab === 'mr' ? (
              <div className="space-y-2 animate-in fade-in duration-100">
                <input type="text" value={titleMr} onChange={(e) => setTitleMr(e.target.value)} placeholder="मराठी कडक शीर्षक..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:border-orange-500" />
                <textarea id="contentMrField" rows={5} value={contentMr} onChange={(e) => setContentMr(e.target.value)} placeholder="येथे मराठीत लेख लिहा. बोल्ड करण्यासाठी शब्दाच्या मागे-पुढे ** स्टार लावा..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-orange-500 font-sans leading-relaxed" />
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in duration-100">
                <input type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="English Title..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:border-orange-500" />
                <textarea id="contentEnField" rows={5} value={contentEn} onChange={(e) => setContentEn(e.target.value)} placeholder="Enter English content here..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-orange-500 font-sans leading-relaxed" />
              </div>
            )}

            <div className="flex justify-end border-t pt-2 space-x-2">
              {editingId && (
                <button type="button" onClick={resetForm} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-1.5 rounded-xl font-bold text-[11px] transition-all">
                  रद्द करा
                </button>
              )}
              <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-1.5 rounded-xl font-bold text-[11px] shadow-xs transition-all disabled:opacity-50">
                {loading ? 'प्रक्रिया सुरू आहे...' : editingId ? 'लेख अपडेट करा ✏️' : 'लेख थेट पब्लिश करा 🚩'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 📋 ३. पूर्ण फ्लूइड (`w-full`) लेखांची यादी कक्ष */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2 w-full">
        <div className="flex items-center space-x-2 border-b border-slate-50 pb-1.5">
          <Globe className="text-slate-400" size={14} />
          <h3 className="text-[10px] font-black text-slate-500 tracking-wider uppercase">पोर्टलवरील एकूण लेख ({articlesList.length})</h3>
        </div>

        {articlesList.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center border border-dashed rounded-xl w-full">अजून एकही लेख पब्लिश केलेला नाही भाऊ.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            {articlesList.map((art) => (
              <div key={art.id} className={`border rounded-xl p-3 flex items-center space-x-3 transition-all hover:shadow-md ${art.isVisible ? 'bg-slate-50/60 border-slate-100' : 'bg-red-50/20 border-red-100/50'}`}>
                <div className="w-16 h-14 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-100">
                  <img src={art.imageUrl} alt="Thumb" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="text-[8px] font-black bg-slate-200 text-slate-700 px-1 rounded">{art.category}</span>
                    {!art.isVisible && <span className="text-[8px] font-black bg-red-100 text-red-700 px-1 rounded">लपवलेला (Hidden)</span>}
                  </div>
                  <h4 className="text-xs font-black text-slate-800 truncate mt-0.5">{art.titleMr}</h4>
                  <p className="text-[9px] text-slate-400 font-bold">लेखक: {art.authorName} | हुद्दा: {art.authorRole}</p>
                </div>

                {/* ॲक्शन पॅनेल: एडिट + सॉफ्ट डिलीट टोगल */}
                <div className="flex items-center space-x-0.5 flex-shrink-0">
                  <button type="button" onClick={() => handleEditClick(art)} title="लेख सुधारा (Edit)" className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-all active:scale-90">
                    <Edit3 size={14} />
                  </button>
                  <button type="button" onClick={() => handleToggleVisibility(art.id, art.isVisible)} title={art.isVisible ? "पब्लिक व्ह्यूधून लपवा" : "पब्लिक व्ह्यूमध्ये दाखवा"} className={`p-1.5 rounded-lg transition-all active:scale-90 ${art.isVisible ? 'text-slate-500 hover:bg-slate-200' : 'text-red-500 hover:bg-red-100'}`}>
                    {art.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button type="button" onClick={() => handleHardDelete(art.id)} title="कायमचा नष्ट करा" className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg active:scale-90 transition-all"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}