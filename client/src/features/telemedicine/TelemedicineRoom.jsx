import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import { AuthContext } from '../../context/AuthContext';
import PatientHistoryPanel from '../doctor/PatientHistoryPanel';
import ActiveConsultation from '../doctor/ActiveConsultation';

const TelemedicineRoom = () => {
  const { id } = useParams(); // consultationId or room id
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [peerId, setPeerId] = useState('');
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
  const [peer, setPeer] = useState(null);
  
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [myStream, setMyStream] = useState(null);

  // We are keeping it simple: Patient and Doctor join the same room.
  // In a real app we would use Socket.io to exchange peer IDs automatically.
  // Here we'll just allow manual connection or basic signaling via socket if we had time.
  // For simplicity, we'll assume the patient ID is known or we use a fixed pattern.
  // Actually, let's use the consultation ID as a base for Peer IDs.
  // Doctor Peer ID: `${id}-doctor`
  // Patient Peer ID: `${id}-patient`

  useEffect(() => {
    const myRolePeerId = `${id}-${user.role}`;
    const targetRolePeerId = `${id}-${user.role === 'doctor' ? 'patient' : 'doctor'}`;
    setRemotePeerIdValue(targetRolePeerId);

    const newPeer = new Peer(myRolePeerId, {
      debug: 2
    });

    newPeer.on('open', (id) => {
      setPeerId(id);
    });

    newPeer.on('call', (call) => {
      // Auto-answer
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setMyStream(stream);
          if (myVideoRef.current) myVideoRef.current.srcObject = stream;
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          });
        })
        .catch(err => console.error('Failed to get local stream', err));
    });

    setPeer(newPeer);

    return () => {
      if (myStream) myStream.getTracks().forEach(t => t.stop());
      newPeer.destroy();
    };
  }, [id, user.role]);

  const startCall = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        
        const call = peer.call(remotePeerIdValue, stream);
        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        });
      })
      .catch(err => console.error('Failed to get local stream for call', err));
  };

  const endCall = () => {
    if (myStream) {
      myStream.getTracks().forEach(t => t.stop());
    }
    if (peer) {
      peer.disconnect();
    }
    navigate(`/${user.role}/dashboard`);
  };

  // Mock patient ID for the panel - in a real app, fetch consultation details to get patientId
  // We'll pass a dummy or require the backend to return the consultation details first
  // For the sake of the demo, let's assume we have it or we fetch it.
  const [patientId, setPatientId] = useState(null);

  useEffect(() => {
    if (user.role === 'patient') {
      setPatientId(user._id);
    } else {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get('patientId');
      if (pid) {
        setPatientId(pid);
      } else {
        console.warn('No patientId provided in URL');
      }
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-accent-soft-blue p-4 flex flex-col md:flex-row gap-4">
      {/* Video Section */}
      <div className="flex-1 bg-black rounded-xl overflow-hidden flex flex-col relative shadow-xl">
        {/* Remote Video (Main) */}
        <div className="flex-1 relative">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {user.role === 'doctor' ? 'Patient' : 'Doctor'}
          </div>
        </div>

        {/* Local Video (PiP) */}
        <div className="absolute bottom-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-1 left-2 text-white text-xs bg-black/50 px-1 rounded">You</div>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 p-4 flex justify-center space-x-4">
          <button onClick={startCall} className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700">
            Start Call
          </button>
          <button onClick={endCall} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700">
            End Call
          </button>
        </div>
      </div>

      {/* Side Panel (Doctor Only) */}
      {user.role === 'doctor' && (
        <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '100vh' }}>
          {/* We'd pass the actual patientId here in a real integration */}
          <div className="flex-1 min-h-[300px]">
             {patientId ? (
               <PatientHistoryPanel patientId={patientId} />
             ) : (
               <div className="bg-white rounded-lg shadow-sm p-4 h-full">Loading history panel...</div>
             )}
             <div className="bg-white rounded-lg shadow-sm p-4 h-full mt-4">
               <h3 className="font-bold border-b pb-2">Tools</h3>
               <p className="text-sm text-gray-500 mt-2">Patient history and active consultation forms go here.</p>
               <div className="mt-4">
                 <ActiveConsultation consultationId={id} patientId={patientId} onComplete={() => alert('Saved!')} />
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelemedicineRoom;
