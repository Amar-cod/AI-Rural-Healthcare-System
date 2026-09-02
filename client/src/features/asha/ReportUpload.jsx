import { useState, useRef } from 'react';

const ReportUpload = ({ onFileSelect }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = (selectedFile) => {
    setError('');
    
    // Size check (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }
    
    // Type check (image/jpeg, image/png, application/pdf)
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Only JPEG, PNG, and PDF are allowed.');
      return;
    }
    
    setFile(selectedFile);
    onFileSelect(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setFile(null);
    setError('');
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {!file ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
        >
          <input 
            type="file" 
            className="hidden" 
            ref={inputRef}
            accept="image/jpeg, image/png, application/pdf"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />
          <span className="text-2xl mb-2 block">📄</span>
          <p className="text-sm font-semibold text-gray-700">Click or Drag & Drop</p>
          <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="truncate flex-1">
            <p className="text-sm font-bold text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button type="button" onClick={clearFile} className="ml-3 text-red-500 font-bold px-2 text-xl hover:text-red-700">
            &times;
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-2 font-bold">{error}</p>}
    </div>
  );
};

export default ReportUpload;
