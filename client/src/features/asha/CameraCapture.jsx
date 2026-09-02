import { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';

const CameraCapture = ({ onCapture }) => {
  const [stream, setStream] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const videoRef = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Failed to access camera:', err);
      alert('Could not access the camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => stopCamera(); // Cleanup on unmount
  }, [stream]);

  const takePhoto = async () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      stopCamera();
      setIsCompressing(true);
      
      try {
        // Compress image to ~200KB for rural bandwidth
        const options = {
          maxSizeMB: 0.2, 
          maxWidthOrHeight: 1200,
          useWebWorker: true
        };
        const compressedBlob = await imageCompression(blob, options);
        
        const url = URL.createObjectURL(compressedBlob);
        setPhotoUrl(url);
        onCapture(compressedBlob);
      } catch (error) {
        console.error('Compression error:', error);
        // Fallback to uncompressed if it fails
        const url = URL.createObjectURL(blob);
        setPhotoUrl(url);
        onCapture(blob);
      } finally {
        setIsCompressing(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const retake = () => {
    setPhotoUrl(null);
    onCapture(null);
    startCamera();
  };

  if (photoUrl) {
    return (
      <div className="flex flex-col items-center">
        <img src={photoUrl} alt="Captured preview" className="rounded-lg max-h-48 mb-2" />
        <button type="button" onClick={retake} className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded">
          Retake Photo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {!stream ? (
        <button type="button" onClick={startCamera} className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm">
          Open Camera
        </button>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline className="rounded-lg max-h-48 mb-2 bg-black" />
          <button type="button" onClick={takePhoto} disabled={isCompressing} className="bg-brand-asha text-white px-4 py-2 rounded-lg font-bold text-sm">
            {isCompressing ? 'Processing...' : 'Capture'}
          </button>
        </>
      )}
    </div>
  );
};

export default CameraCapture;
