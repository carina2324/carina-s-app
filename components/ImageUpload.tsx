
import React, { useRef } from 'react';

interface ImageUploadProps {
  onUpload: (base64: string) => void;
  currentImage: string | null;
  disabled: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, currentImage, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      <div 
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative group cursor-pointer overflow-hidden rounded-[40px] border-2 border-dashed transition-all duration-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 border-gray-200 bg-white'
        } ${currentImage ? 'aspect-[3/4]' : 'py-32 flex flex-col items-center justify-center'}`}
      >
        {currentImage ? (
          <>
            <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <span className="text-black font-extrabold text-sm uppercase tracking-widest bg-white shadow-xl px-8 py-3 rounded-full">New Look</span>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6 px-8">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-gray-900 leading-none">UPLOAD YOUR DRIP</p>
              <p className="text-gray-400 text-sm mt-3 font-medium uppercase tracking-wider">Drag here or click to browse files</p>
            </div>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default ImageUpload;
