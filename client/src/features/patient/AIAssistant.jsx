import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [handedOff, setHandedOff] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  // Speak text using SpeechSynthesis
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
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
        sessionId
      });

      const { sessionId: newSessionId, reply, isComplete, summary: summaryData } = res.data;
      
      if (!sessionId) setSessionId(newSessionId);

      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);

      // Speak the response
      if (!isComplete) {
        speakText(reply);
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

      {/* Disclaimer Banner — pinned, not dismissable */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
        <p className="text-sm text-amber-800 text-center font-medium">
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

      {/* Input Area */}
      {!summary && !handedOff && (
        <div className="bg-bg-card border-t border-border-color px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center space-x-3">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full transition ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              🎤
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening...' : 'Describe your symptoms...'}
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
          {isListening && (
            <p className="text-center text-xs text-red-500 mt-2 animate-pulse">🔴 Listening... Speak now</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
