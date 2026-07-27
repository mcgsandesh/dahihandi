import React, { useState } from 'react';

const ImageUploader = ({ onImageUploaded, currentImageUrl = '', label = "इमेज अपलोड करा" }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('कृपया फक्त इमेज फाईल (JPG, PNG, JPEG) सिलेक्ट करा.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_IMGBB_API_KEY .env.local मध्ये मिळालेली नाही!");
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = data.data.url;
        setPreview(imageUrl);
        setError('');
        if (onImageUploaded) {
          onImageUploaded(imageUrl);
        }
      } else {
        throw new Error(data.error?.message || "इमेज अपलोड अयशस्वी झाली.");
      }
    } catch (err) {
      console.error("ImgBB Upload Error:", err);
      setError("अपलोड करताना त्रुटी आली. पुन्हा प्रयत्न करा.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</label>
      
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-xl">
        {preview ? (
          <img src={preview} alt="Preview" className="w-10 h-10 object-contain rounded-lg border bg-white flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-[9px] text-slate-500 font-bold flex-shrink-0">No Img</div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-xs text-slate-500
            file:mr-2 file:py-1 file:px-3
            file:rounded-lg file:border-0
            file:text-[10px] file:font-black
            file:bg-orange-50 file:text-orange-600
            hover:file:bg-orange-100
            disabled:opacity-50 cursor-pointer"
        />
      </div>

      {uploading && <p className="text-[9px] text-blue-600 font-bold">📸 फोटो अपलोड होत आहे, कृपया थांब...</p>}
      {error && <p className="text-[9px] text-red-500 font-bold">{error}</p>}
    </div>
  );
};

export default ImageUploader;