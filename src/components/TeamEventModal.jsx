import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { X, Calendar, MapPin, Save, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import ImageUploader from './ImageUploader';

export default function TeamEventModal({ isOpen, onClose, user }) {
  const [eventTitleMr, setEventTitleMr] = useState('');
  const [eventType, setEventType] = useState('practice_session');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [eventMapLink, setEventMapLink] = useState('');
  const [eventRawCoordinates, setEventRawCoordinates] = useState('');
  const [postLink, setPostLink] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🎯 १. कडक व्हॅलिडेशन: सर्व मुख्य फिल्ड्स अनिवार्य (Mandatory Check)
    if (!eventTitleMr.trim()) {
      Swal.fire({ icon: 'warning', title: 'माहिती अपूर्ण!', text: 'कृपया इव्हेंट किंवा सरावाचे शीर्षक भरा.' });
      return;
    }
    if (!fromDate || !toDate) {
      Swal.fire({ icon: 'warning', title: 'माहिती अपूर्ण!', text: 'कृपया सुरुवातीची व अंतिम तारीख निवडा.' });
      return;
    }
    if (!posterUrl.trim()) {
      Swal.fire({ icon: 'warning', title: 'पोस्टर फोटो आवश्यक!', text: 'कृपया इव्हेंट/सरावाचा फोटो गॅलरीतून अपलोड करा.' });
      return;
    }
    if (!eventRawCoordinates.trim() || !eventRawCoordinates.includes(',')) {
      Swal.fire({ icon: 'warning', title: 'मॅप कोऑर्डिनेट्स आवश्यक!', text: 'कृपया Google Maps चे Lat, Lng कोऑर्डिनेट्स अचूक टाका (उदा. 19.138832, 72.870798).' });
      return;
    }
    if (!eventMapLink.trim()) {
      Swal.fire({ icon: 'warning', title: 'मॅप लिंक आवश्यक!', text: 'कृपया Google Maps ची नेव्हिगेशन लिंक टाका.' });
      return;
    }

    setLoading(true);
    const currentYear = new Date().getFullYear().toString();
    const teamIdentifier = user.teamUID || user.uid;

    try {
      // 🎯 २. १ वर्षाला १ इव्हेंट अट तपासणे
      const q = query(
        collection(db, "events"),
        where("teamUID", "==", teamIdentifier),
        where("year", "==", currentYear)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        Swal.fire({
          icon: 'warning',
          title: 'मर्यादा पूर्ण!',
          text: `तुमच्या मंडळाने ${currentYear} या वर्षासाठी सराव/इव्हेंट माहिती आधीच सबमिट केली आहे. एका वर्षात फक्त १च इव्हेंट जोडता येतो.`
        });
        setLoading(false);
        return;
      }

      // 📍 Coordinates parse करणे
      const [latStr, lngStr] = eventRawCoordinates.split(',');
      const finalLat = latStr ? parseFloat(latStr.trim()) : null;
      const finalLng = lngStr ? parseFloat(lngStr.trim()) : null;

      if (!finalLat || !finalLng || isNaN(finalLat) || isNaN(finalLng)) {
        Swal.fire({ icon: 'warning', title: 'गलत कोऑर्डिनेट्स!', text: 'कृपया अचूक अंक आणि स्वल्पविराम (Lat, Lng) वापरा.' });
        setLoading(false);
        return;
      }

      const docId = `EVENT_${teamIdentifier}_${currentYear}`;
      await setDoc(doc(db, "events", docId), {
        title_mr: eventTitleMr.trim(),
        type: eventType,
        mandalName: user.teamName,
        teamUID: teamIdentifier,
        year: currentYear,
        fromDate,
        toDate,
        posterUrl: posterUrl.trim(),
        mapLink: eventMapLink.trim(),
        postLink: postLink.trim(),
        lat: finalLat,
        lng: finalLng,
        isApproved: false, // 🎯 ३. थेट पब्लिश न होता सुपरॲडमिन मंजुरीसाठी प्रलंबित राहील
        status: 'pending', // ⏳ प्रलंबित स्थिती
        createdAt: serverTimestamp()
      });

      Swal.fire({
        icon: 'success',
        title: 'इव्हेंट पाठवला आहे! 🚩',
        text: 'तुमची माहिती पडताळणीसाठी पाठवली आहे. सुपरॲडमिनच्या मंजुरीनंतर ती सराव कट्ट्यावर दिसेल.',
        confirmButtonColor: '#ff6600'
      });

      // फॉर्म रीसेट व बंद
      setEventTitleMr('');
      setFromDate('');
      setToDate('');
      setPosterUrl('');
      setEventMapLink('');
      setEventRawCoordinates('');
      setPostLink('');
      onClose();

    } catch (err) {
      console.error("Error adding event:", err);
      Swal.fire({ icon: 'error', title: 'अडचण आली!', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"></div>
      <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl relative z-10 max-h-[85vh] overflow-y-auto text-left">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 p-1"><X size={18} /></button>
        <div className="mb-3">
          <h3 className="text-sm font-black text-slate-800">🚩 इव्हेंट / सराव कट्टा नोंदणी</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            टीप: १ वर्षाला १ इव्हेंट जोडता येईल. सर्व माहिती अचूक भरा. सुपरॲडमिनच्या पडताळणीनंतरच माहिती सराव कट्ट्यावर दिसेल.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs font-bold text-slate-600">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
              इव्हेंट / सूचनेचे शीर्षक <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={eventTitleMr} 
              onChange={(e) => setEventTitleMr(e.target.value)} 
              placeholder="उदा. भव्य दहीहंडी सराव शिबीर २०२६" 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
              इव्हेंट प्रकार <span className="text-red-500">*</span>
            </label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-bold text-slate-700 focus:outline-none">
              <option value="practice_session">🎯 सराव शिबीर</option>
              <option value="practice_start">🚩 सराव सुरू होणार</option>
              <option value="dahihandi_venue">🏰 दहीहंडी उत्सव ठिकाण</option>
              <option value="competition">🏆 स्पर्धा / सामने</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                प्रदर्शित तारीख (From) <span className="text-red-500">*</span>
              </label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                अंतिम तारीख (To) <span className="text-red-500">*</span>
              </label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none" />
            </div>
          </div>

          {/* 📸 फोटो अपलोडर (Compulsory) */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-black text-slate-700 block uppercase">
              पोस्टर फोटो <span className="text-red-500">* (अनिवार्य)</span>
            </span>
            <ImageUploader 
              label="गॅलरीतून फोटो निवडा"
              currentImageUrl={posterUrl}
              onImageUploaded={(url) => setPosterUrl(url)}
            />
          </div>

          {/* 📍 लोकेशन मॅपिंग (Compulsory) */}
          <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-200 space-y-2">
            <span className="text-[10px] font-black text-orange-600 block uppercase">
              📍 गुगल मॅप लोकेशन <span className="text-red-500">* (अनिवार्य)</span>
            </span>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">
                Google Maps Coordinates (Lat, Lng) <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={eventRawCoordinates} 
                onChange={(e) => setEventRawCoordinates(e.target.value)} 
                placeholder="19.138832, 72.870798" 
                className="w-full border border-slate-200 rounded-xl px-3 py-1.5 bg-white font-mono text-xs focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">
                Google Maps Short Link <span className="text-red-500">*</span>
              </label>
              <input 
                type="url" 
                value={eventMapLink} 
                onChange={(e) => setEventMapLink(e.target.value)} 
                placeholder="https://maps.app.goo.gl/..." 
                className="w-full border border-slate-200 rounded-xl px-3 py-1.5 bg-white font-mono text-xs focus:outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
              सोशल मीडिया पोस्ट लिंक (Insta/FB - Optional)
            </label>
            <input type="url" value={postLink} onChange={(e) => setPostLink(e.target.value)} placeholder="https://instagram.com/p/..." className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-mono focus:outline-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#ff6600] hover:bg-[#e65c00] text-white py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 mt-2">
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            <span>{loading ? 'सबमिट होत आहे...' : 'पडताळणीसाठी इव्हेंट पाठवा 🚩'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}