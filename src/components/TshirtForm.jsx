import React from 'react';

export default function TshirtForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  loading, 
  buttonText,
  showInsuranceSelect = false, // फक्त ॲडमीन पॅनेलमध्ये विमा स्थिती दाखवण्यासाठी
  showDistributionSelect = false, 
  teamCategory = 'Men',
  maxDate // 🎯 बदल: इथे आपण PublicRegister कडून आलेला maxDate प्रॉप अचूक पकडला!
}) {

  // इनपुट चेंज हँडलर
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      
      {/* विभाग १: वैयक्तिक माहिती */}
      <div className="space-y-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
        <p className="text-[10px] font-bold text-[#ff6600] uppercase tracking-wider">— वैयक्तिक माहिती —</p>
        
        {/* खेळाडूचे नाव */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">खेळाडूचे पूर्ण नाव</label>
          <input 
            type="text" 
            required 
            value={formData.playerName || ''} 
            onChange={(e) => handleChange('playerName', e.target.value)} 
            placeholder="उदा. राहुल पाटील" 
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-white font-medium text-slate-800" 
          />
        </div>

        {/* लिंग (Gender) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">लिंग (Gender)</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange('gender', 'Male')}
              className={`py-2 px-4 rounded-xl border text-xs font-bold text-center transition-all ${
                formData.gender === 'Male' 
                  ? 'bg-[#ff6600] text-white border-[#ff6600] shadow-sm' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              पुरुष (Male)
            </button>
            <button
              type="button"
              onClick={() => handleChange('gender', 'Female')}
              className={`py-2 px-4 rounded-xl border text-xs font-bold text-center transition-all ${
                formData.gender === 'Female' 
                  ? 'bg-[#ff6600] text-white border-[#ff6600] shadow-sm' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              महिला (Female)
            </button>
          </div>
        </div>

        {/* रक्त गट आणि थर रचना स्थान */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">रक्त गट</label>
            <select 
              value={formData.bloodGroup || 'B+'} 
              onChange={(e) => handleChange('bloodGroup', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700"
            >
              <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">थर रचना स्थान</label>
            <select 
              value={formData.pyramidPlace || 'Base'} 
              onChange={(e) => handleChange('pyramidPlace', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700"
            >
              {['Base', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Back Shidi', 'Front Shidi', 'Left Shidi', 'Right Shidi', 'Coach', 'Captain', 'Administration'].map((place) => (
                <option key={place} value={place}>{place}</option>
              ))}
            </select>
          </div>
        </div>

        {/* जन्मतारीख आणि मोबाईल */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">जन्म तारीख</label>
            <input 
              type="date" 
              required
              value={formData.birthDate || ''} 
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              max={maxDate} // 🎯 आता हा maxDate वरून प्रॉप मिळल्यामुळे कडक मर्यादित चालेल!
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none bg-white font-medium text-slate-800 focus:border-[#ff6600]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">मोबाईल नंबर</label>
            <input 
              type="tel" 
              required 
              maxLength="10" 
              value={formData.mobileNumber || ''} 
              onChange={(e) => handleChange('mobileNumber', e.target.value)} 
              placeholder="9876543210" 
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:border-[#ff6600]" 
            />
          </div>
        </div>
      </div>

      {/* विभाग २: युनिформ मापे */}
      <div className="space-y-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
        <p className="text-[10px] font-bold text-[#ff6600] uppercase tracking-wider">— युनिформ —</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">टी-शर्ट साईझ</label>
            <select 
              value={formData.tshirtSize || 'M'} 
              onChange={(e) => handleChange('tshirtSize', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700 font-bold"
            >
              <option value="S">S - 36–38</option>
              <option value="M">M - 38–40</option>
              <option value="L">L - 40–42</option>
              <option value="XL">XL - 42–44</option>
              <option value="2XL">2XL - 44–46</option>
              <option value="3XL">3XL - 46–48</option>
              <option value="4XL">4XL - 48–50</option>
              <option value="Custom">✏️ Custom साईझ</option>
            </select>
            {formData.tshirtSize === 'Custom' && (
              <input 
                type="text" 
                placeholder="उदा. 24" 
                value={formData.customTshirt || ''} 
                onChange={(e) => handleChange('customTshirt', e.target.value)} 
                className="w-full border border-purple-200 rounded-xl px-2 py-1 text-xs mt-1 bg-purple-50 font-bold" 
              />
            )}
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">शॉर्ट्स साईझ</label>
            <select 
              value={formData.shortsSize || 'M'} 
              onChange={(e) => handleChange('shortsSize', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700 font-bold"
            >
              <option value="S">S - 36–38</option>
              <option value="M">M - 38–40</option>
              <option value="L">L - 40–42</option>
              <option value="XL">XL - 42–44</option>
              <option value="2XL">2XL - 44–46</option>
              <option value="3XL">3XL - 46–48</option>
              <option value="4XL">4XL - 48–50</option>
              <option value="Custom">✏️ Custom साईझ</option>
            </select>
            {formData.shortsSize === 'Custom' && (
              <input 
                type="text" 
                placeholder="उदा. 22" 
                value={formData.customShorts || ''} 
                onChange={(e) => handleChange('customShorts', e.target.value)} 
                className="w-full border border-orange-200 rounded-xl px-2 py-1 text-xs mt-1 bg-orange-50 font-bold" 
              />
            )}
          </div>
        </div>
      </div>

      {/* विभाग ३: अतिरिक्त साहित्य */}
      <div className="space-y-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
        <p className="text-[10px] font-bold text-[#ff6600] uppercase tracking-wider">— अतिरिक्त साहित्य —</p>
        <div className={`grid ${showInsuranceSelect ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">पट्टा (Belt)</label>
            <select 
              value={formData.needBelt || 'No'} 
              onChange={(e) => handleChange('needBelt', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700"
            >
              <option>No</option><option>Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">टॉवेल (Towel)</label>
            <select 
              value={formData.needTowel || 'No'} 
              onChange={(e) => handleChange('needTowel', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700"
            >
              <option>No</option><option>Yes</option>
            </select>
          </div>
          {showInsuranceSelect && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">विма स्थिती</label>
              <select 
                value={formData.insuranceStatus || 'Pending'} 
                onChange={(e) => handleChange('insuranceStatus', e.target.value)} 
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 font-bold"
              >
                <option value="Pending">प्रलंबित</option>
                <option value="Done">झालेले</option>
              </select>
            </div>
          )}
          {showDistributionSelect && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">टी-शर्ट वाटप</label>
              <select 
                value={formData.tshirtGiven || 'No'} 
                onChange={(e) => handleChange('tshirtGiven', e.target.value)} 
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 font-bold"
              >
                <option value="No">बाकी (No)</option>
                <option value="Yes">दिला (Yes)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* सबमिट बटण */}
      <button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-[#0b132b] hover:bg-[#162244] text-white py-3.5 rounded-xl font-bold text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
      >
        <span>{loading ? 'नोंदणी होत आहे...' : buttonText}</span>
      </button>

    </form>
  );
}