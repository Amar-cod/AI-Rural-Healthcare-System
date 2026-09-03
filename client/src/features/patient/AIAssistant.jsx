import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

const LANGUAGES = [
  { code: 'en', name: 'English', bcp47: 'en-US', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', bcp47: 'hi-IN', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', bcp47: 'ta-IN', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', bcp47: 'te-IN', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', bcp47: 'bn-IN', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', bcp47: 'kn-IN', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', bcp47: 'mr-IN', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', bcp47: 'gu-IN', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', bcp47: 'ml-IN', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', bcp47: 'pa-IN', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ', bcp47: 'or-IN', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', bcp47: 'ur-IN', flag: '🇵🇰' }
];

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [handedOff, setHandedOff] = useState(false);
  const [symptomsList, setSymptomsList] = useState([]);
  
  // Language state
  const [selectedLang, setSelectedLang] = useState('en');

  // Voice states: 'idle' | 'listening' | 'speaking'
  const [voiceState, setVoiceState] = useState('idle');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch symptoms for quick select
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const res = await api.get('/symptoms');
        setSymptomsList(res.data);
      } catch (err) {
        console.error('Failed to fetch symptoms', err);
      }
    };
    fetchSymptoms();
  }, []);

  // Check voice support when language changes
  const checkVoiceSupport = useCallback((langCode) => {
    const lang = LANGUAGES.find(l => l.code === langCode);
    if (!lang) { setVoiceSupported(false); return; }

    // Check TTS support
    const voices = window.speechSynthesis?.getVoices() || [];
    const hasTTS = voices.some(v => v.lang.startsWith(langCode) || v.lang.startsWith(lang.bcp47.split('-')[0]));

    // Check STT support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasSTT = !!SpeechRecognition;

    setVoiceSupported(hasTTS || hasSTT);
  }, []);

  // Initialize SpeechRecognition and check voice on language change
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      const lang = LANGUAGES.find(l => l.code === selectedLang);
      recognition.lang = lang?.bcp47 || 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setVoiceState('idle');
      };
      recognition.onerror = () => setVoiceState('idle');
      recognition.onend = () => setVoiceState('idle');

      recognitionRef.current = recognition;
    }

    // voices may load async — check immediately + on voiceschanged
    checkVoiceSupport(selectedLang);
    const handleVoicesChanged = () => checkVoiceSupport(selectedLang);
    window.speechSynthesis?.addEventListener('voiceschanged', handleVoicesChanged);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', handleVoicesChanged);
  }, [selectedLang, checkVoiceSupport]);

  // Speak text using SpeechSynthesis in the selected language
  const speakText = (text, msgIndex) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const lang = LANGUAGES.find(l => l.code === selectedLang);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang?.bcp47 || 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Try to find a voice for the language
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(lang?.bcp47?.split('-')[0] || 'en'));
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onstart = () => {
      setVoiceState('speaking');
      setSpeakingMsgIndex(msgIndex);
    };
    utterance.onend = () => {
      setVoiceState('idle');
      setSpeakingMsgIndex(null);
    };
    utterance.onerror = () => {
      setVoiceState('idle');
      setSpeakingMsgIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setVoiceState('idle');
    setSpeakingMsgIndex(null);
  };

  const toggleMic = () => {
    if (voiceState === 'speaking') {
      stopSpeaking();
      return;
    }

    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    if (voiceState === 'listening') {
      recognitionRef.current.stop();
      setVoiceState('idle');
    } else {
      recognitionRef.current.start();
      setVoiceState('listening');
    }
  };

  const handleLanguageChange = (newLang) => {
    if (sessionId) {
      // Can't change language mid-session — start fresh
      if (!window.confirm('Changing language will start a new conversation. Continue?')) return;
      setMessages([]);
      setSessionId(null);
      setSummary(null);
      setHandedOff(false);
    }
    setSelectedLang(newLang);
    stopSpeaking();
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: trimmed,
        sessionId,
        language: selectedLang
      });

      const { sessionId: newSessionId, reply, isComplete, summary: summaryData } = res.data;
      
      if (!sessionId) setSessionId(newSessionId);

      const newMsgIndex = messages.length + 1; // +1 because we just pushed user msg
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);

      // Auto-speak the response (if not the final JSON summary)
      if (!isComplete) {
        speakText(reply, newMsgIndex);
      }

      if (isComplete && summaryData) {
        setSummary(summaryData);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleHandoff = async () => {
    if (!sessionId) return;
    try {
      await api.post(`/ai/session/${sessionId}/handoff`);
      setHandedOff(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to hand off session.');
    }
  };

  const priorityColors = {
    high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', badge: 'bg-red-600' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', badge: 'bg-amber-500' },
    routine: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', badge: 'bg-green-600' }
  };

  const currentLang = LANGUAGES.find(l => l.code === selectedLang);

  return (
    <div className="min-h-screen bg-accent-soft-blue flex flex-col">
      {/* Header */}
      <div className="bg-bg-card border-b border-border-color px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary">AI Symptom Assistant</h1>
          <p className="text-sm text-text-secondary">Powered by Google Gemini</p>
        </div>
        <button onClick={() => navigate('/patient/dashboard')} className="text-brand-primary underline text-sm">
          ← Back to Dashboard
        </button>
      </div>

      {/* Language Selector + Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="lang-select" className="text-sm font-semibold text-amber-800">🌐 Language:</label>
          <select
            id="lang-select"
            value={selectedLang}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-amber-800 text-center font-medium flex-1">
          ⚕️ <strong>Important:</strong> This AI assistant collects symptom information and flags possible urgency.
          It does <strong>not</strong> diagnose or prescribe. A qualified doctor makes all final decisions.
        </p>
      </div>

      {/* High Priority Emergency Banner */}
      {summary && summary.suggestedPriority === 'high' && !handedOff && (
        <div className="bg-red-600 text-white px-6 py-3 text-center">
          <p className="font-bold text-sm">
            🚨 Your symptoms may need urgent attention. If you are in a life-threatening emergency,
            seek immediate in-person emergency care.
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🩺</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">How are you feeling today?</h2>
            <p className="text-text-secondary max-w-md mx-auto">
              Tell me about your symptoms in your own words. I'll ask a few follow-up questions to help a doctor understand your situation better.
            </p>
            {selectedLang !== 'en' && (
              <p className="text-brand-primary font-medium mt-3 text-sm">
                🌐 You can type in {currentLang?.name} — I'll respond in the same language.
              </p>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-brand-primary text-white rounded-br-sm'
                : 'bg-white border border-border-color text-text-primary rounded-bl-sm shadow-sm'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              {/* Speaker button on AI messages */}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => speakingMsgIndex === i ? stopSpeaking() : speakText(msg.text, i)}
                  className={`mt-2 text-xs flex items-center gap-1 transition-colors ${
                    speakingMsgIndex === i
                      ? 'text-brand-primary font-semibold'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={speakingMsgIndex === i ? 'Stop speaking' : 'Listen to response'}
                >
                  {speakingMsgIndex === i ? (
                    <><span className="animate-pulse">🔊</span> Speaking...</>
                  ) : (
                    <>🔈 Listen</>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-border-color rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {summary && (
          <div className={`mx-auto max-w-lg rounded-2xl border-2 p-6 ${priorityColors[summary.suggestedPriority]?.bg} ${priorityColors[summary.suggestedPriority]?.border}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Symptom Summary</h3>
              <span className={`px-3 py-1 rounded-full text-white text-xs font-bold uppercase ${priorityColors[summary.suggestedPriority]?.badge}`}>
                {summary.suggestedPriority} Priority
              </span>
            </div>
            <p className="text-sm text-text-primary mb-3">{summary.summary}</p>
            {summary.duration && (
              <p className="text-sm text-text-secondary mb-2"><strong>Duration:</strong> {summary.duration}</p>
            )}
            {summary.redFlags && summary.redFlags.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Red Flags Detected:</p>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {summary.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                </ul>
              </div>
            )}

            {!handedOff ? (
              <button
                onClick={handleHandoff}
                className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-secondary transition text-sm"
              >
                📤 Send to a Doctor
              </button>
            ) : (
              <div className="text-center py-3 bg-green-100 rounded-xl border border-green-300">
                <p className="text-green-700 font-bold text-sm">✅ Successfully sent to a doctor for review!</p>
                <button
                  onClick={() => navigate('/patient/dashboard')}
                  className="mt-2 text-brand-primary underline text-sm"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Quick Select Chips */}
      {!summary && !handedOff && (
        <div className="bg-white p-4 border-t border-border-color shadow-sm rounded-b-2xl">
          {/* Quick Select Chips */}
          {symptomsList.length > 0 && !loading && (
            <div className="flex overflow-x-auto gap-2 pb-3 mb-2 hide-scrollbar">
              {symptomsList.map((symptom) => (
                <button
                  key={symptom._id}
                  onClick={() => setInput(prev => prev ? prev + ', ' + symptom.name : symptom.name)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    symptom.isRedFlag 
                      ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' 
                      : 'border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {symptom.name}
                </button>
              ))}
            </div>
          )}

          <div className="max-w-3xl mx-auto flex items-center space-x-3">
            {/* Mic Button with voice state */}
            <div className="relative">
              <button
                onClick={toggleMic}
                disabled={!voiceSupported && voiceState === 'idle'}
                className={`p-3 rounded-full transition relative ${
                  voiceState === 'listening'
                    ? 'bg-red-500 text-white'
                    : voiceState === 'speaking'
                    ? 'bg-brand-primary text-white'
                    : voiceSupported
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
                title={
                  !voiceSupported
                    ? 'Voice not available in this language — please type'
                    : voiceState === 'listening'
                    ? 'Stop listening'
                    : voiceState === 'speaking'
                    ? 'Stop speaking'
                    : 'Start voice input'
                }
              >
                {voiceState === 'listening' ? (
                  <span className="animate-pulse text-lg">🎤</span>
                ) : voiceState === 'speaking' ? (
                  <span className="animate-pulse text-lg">🔊</span>
                ) : (
                  <span className="text-lg">🎤</span>
                )}
                {/* Pulsing ring for listening state */}
                {voiceState === 'listening' && (
                  <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping"></span>
                )}
              </button>
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                voiceState === 'listening'
                  ? 'Listening...'
                  : selectedLang !== 'en'
                  ? `Type in ${currentLang?.name}...`
                  : 'Describe your symptoms...'
              }
              className="flex-1 border border-border-color rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-brand-primary text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-brand-secondary transition disabled:opacity-50"
            >
              Send
            </button>
          </div>

          {/* Voice State Indicator */}
          {voiceState === 'listening' && (
            <div className="text-center mt-2">
              <p className="text-xs text-red-500 font-medium animate-pulse">
                🔴 Listening... Speak now in {currentLang?.name}
              </p>
              {/* Waveform animation */}
              <div className="flex items-end justify-center gap-0.5 mt-1 h-4">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-400 rounded-full animate-bounce"
                    style={{
                      animationDelay: `${i * 80}ms`,
                      height: `${8 + Math.random() * 12}px`,
                      animationDuration: '0.6s'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {voiceState === 'speaking' && (
            <p className="text-center text-xs text-brand-primary mt-2 font-medium animate-pulse">
              🔊 Speaking... Tap the mic button or speaker to stop
            </p>
          )}

          {!voiceSupported && voiceState === 'idle' && selectedLang !== 'en' && (
            <p className="text-center text-xs text-gray-400 mt-2">
              ⚠️ Voice not available in {currentLang?.name} — please type your message
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
