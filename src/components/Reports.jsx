import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
// initializeFirestore आणि enableIndexedDbPersistence इम्पॉर्ट केले आहे
import { collection, getDocs, query, where, initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { ArrowLeft, Loader2, Shirt, Printer, ShieldCheck } from 'lucide-react';

export default function Reports({ userTeamName, onBack }) {
  // --- STATE MANAGEMENT ---
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FIREBASE INDEXEDDB (OFFLINE PERSISTENCE) CONFIG ---
  useEffect(() => {
    const enableOffline = async () => {
      try {
        // फायरबेसचे इन-बिल्ट IndexedDB लोकल कॅशिंग इनेबल करणे
        await enableIndexedDbPersistence(db);
        console.log("Firebase IndexedDB Persistence Enabled! Reads will be saved. 🔥");
      } catch (err) {
        if (err.code === 'failed-precondition') {
          // एकापेक्षा जास्त टॅब ओपन असतील तर हा एरर येतो
          console.warn("Persistence failed: Multiple tabs open.");
        } else if (err.code === 'unimplemented') {
          // ब्राउझर सपोर्ट करत नसेल तर
          console.warn("Persistence failed: Browser does not support IndexedDB.");
        }
      }
    };
    enableOffline();
  }, []);

  // --- DATA FETCHING (आता हा डेटा प्रामुख्याने IndexedDB मधून येईल) ---
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        console.log("Fetching players for team:", userTeamName);
        const q = query(collection(db, "players"), where("teamName", "==", userTeamName));
        const querySnapshot = await getDocs(q);
        
        // snapshot.metadata.fromCache हे सांगते की डेटा लोकल IndexedDB मधून आलाय की सर्व्हरवरून
        console.log("Data from Cache (IndexedDB)?", querySnapshot.metadata.fromCache);
        
        setPlayers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error loading players:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [userTeamName]);

  // --- AGE CALCULATION LOGIC ---
  const calculateAge = (dobString) => {
    if (!dobString || dobString.length < 10) return '—';
    try {
      const parts = dobString.split('/');
      if (parts.length === 3) {
        const birthYear = parseInt(parts[2], 10);
        const currentYear = new Date().getFullYear();
        if (!isNaN(birthYear)) return currentYear - birthYear;
      }
      const altParts = dobString.split('-');
      if (altParts.length === 3) {
        const birthYear = parseInt(altParts[0], 10);
        const currentYear = new Date().getFullYear();
        if (!isNaN(birthYear)) return currentYear - birthYear;
      }
      return '—';
    } catch (e) { return '—'; }
  };

  // --- T-SHIRT PRINT FUNCTION ---
  const handleTshirtPrint = () => {
    const counts = players.reduce((acc, p) => { acc[p.tshirt] = (acc[p.tshirt] || 0) + 1; return acc; }, {});
    const countStr = Object.entries(counts).map(([s, c]) => `${s}: ${c}`).join(' | ');
    const totalPlayers = players.length;
    const currentYear = new Date().getFullYear();

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${userTeamName.toUpperCase()} TSHIRT REPORT</title>
          <style>
            @page { size: auto; margin: 20mm 15mm 20mm 15mm; }
            body { font-family: sans-serif; margin: 0; padding: 0; }
            h1 { text-transform: uppercase; margin: 0 0 10px 0; font-size: 24px; color: #1e293b; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .count-summary { margin: 10px 0 20px 0; font-size: 14px; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .custom-footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 12px; color: #555; border-top: 1px solid #ccc; padding-top: 8px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${userTeamName} - T-SHIRT REPORT (${currentYear})</h1>
          <div class="count-summary">Total ${totalPlayers} = ${countStr}</div>
          <table>
            <thead>
              <tr><th>नाव</th><th style="width: 100px;">T-Shirt</th><th style="width: 100px;">Shorts</th></tr>
            </thead>
            <tbody>
              ${players.map(p => `<tr><td>${p.name}</td><td>${p.tshirt || '-'}</td><td>${p.shorts || '-'}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="custom-footer">
            Printed via DahiHandi Management | An Initiative by Sandesh Mahadik
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // --- INSURANCE PRINT FUNCTION ---
  const handleInsurancePrint = () => {
    const pendingPlayers = players.filter(p => !p.insurance || p.insurance === 'Pending');
    const totalPending = pendingPlayers.length;
    const currentYear = new Date().getFullYear();

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${userTeamName.toUpperCase()} PENDING INSURANCE REPORT</title>
          <style>
            @page { size: auto; margin: 20mm 15mm 20mm 15mm; }
            body { font-family: sans-serif; margin: 0; padding: 0; }
            h1 { text-transform: uppercase; margin: 0 0 10px 0; font-size: 24px; color: #1e293b; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .count-summary { margin: 10px 0 20px 0; font-size: 15px; color: #b91c1c; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-center { text-align: center; }
            .custom-footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 12px; color: #555; border-top: 1px solid #ccc; padding-top: 8px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${userTeamName} - PENDING INSURANCE REPORT (${currentYear})</h1>
          <div class="count-summary">Total Pending Players: ${totalPending}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;" class="text-center">SR No.</th>
                <th>Name</th>
                <th style="width: 100px;" class="text-center">Age</th>
              </tr>
            </thead>
            <tbody>
              ${pendingPlayers.length > 0 ? 
                pendingPlayers.map((p, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${p.name}</td>
                    <td class="text-center">${calculateAge(p.dob || p.birthDate || p.dobString)}</td>
                  </tr>
                `).join('') 
                : `<tr><td colspan="3" class="text-center" style="padding: 20px; font-weight: bold; color: green;">सर्व खेळाडूंचा विमा पूर्ण झाला आहे! (No Pending Players)</td></tr>`
              }
            </tbody>
          </table>
          <div class="custom-footer">
            Printed via DahiHandi Management | An Initiative by Sandesh Mahadik
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // --- LOADING UI ---
  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  // --- MAIN RENDER UI ---
  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <button onClick={onBack} className="mb-6 flex items-center font-bold text-sm text-slate-500 hover:text-[#ff6600] transition-all">
        <ArrowLeft size={18} className="mr-2" /> परत जा
      </button>
      
      <h1 className="text-2xl font-black mb-8 text-slate-800">रिपोर्ट पॅनेल</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* T-Shirt Card */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <h2 className="font-black mb-4 flex items-center gap-2 text-slate-800"><Shirt size={20} className="text-purple-600"/> टी-शर्ट अहवाल</h2>
          <div className="flex gap-2">
            <button onClick={handleTshirtPrint} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
              <Printer size={16} /> प्रिंट रिपोर्ट
            </button>
          </div>
        </div>

        {/* Insurance Card */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <h2 className="font-black mb-4 flex items-center gap-2 text-slate-800"><ShieldCheck size={20} className="text-emerald-600"/> विमा अहवाल</h2>
          <div className="flex gap-2">
            <button onClick={handleInsurancePrint} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
              <Printer size={16} /> प्रिंट विमा रिपोर्ट
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}