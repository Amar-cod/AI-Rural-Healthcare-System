import { useState, useEffect } from 'react';
import api from '../../../lib/axios';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchReminders();
    checkPushSubscription();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await api.get('/reminders/me');
      setReminders(res.data);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkPushSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
      }
    }
  };

  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      alert('Push notifications are not supported in this browser.');
      return;
    }

    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Permission for notifications was denied.');
        return;
      }

      // We need a service worker registered for push
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        // We will register a minimal SW if one doesn't exist.
        // Vite places public files at the root
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        alert('VAPID public key is not configured.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      await api.post('/reminders/subscribe', { subscription });
      setPushEnabled(true);
      alert('Push notifications enabled successfully!');
    } catch (err) {
      console.error('Failed to subscribe:', err);
      alert('Failed to enable push notifications.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.patch(`/reminders/${id}`, { status: newStatus });
      fetchReminders(); // Refresh list to get accurate status
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-brand-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (dateString) => {
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const activeReminders = reminders.filter(r => r.status === 'pending' || isToday(r.scheduledTime));
  const historyReminders = reminders.filter(r => r.status !== 'pending' && !isToday(r.scheduledTime));

  return (
    <div className="min-h-screen bg-accent-soft-blue p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-border-color">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">💊 My Reminders</h1>
            <p className="text-text-secondary mt-1">Track your daily medications and check-ups.</p>
          </div>
          {!pushEnabled && (
            <button 
              onClick={enablePushNotifications}
              disabled={subscribing}
              className="mt-4 sm:mt-0 bg-brand-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-secondary transition"
            >
              {subscribing ? 'Enabling...' : '🔔 Enable Notifications'}
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
          <h2 className="text-xl font-bold mb-4">Today's Schedule & Active</h2>
          
          {activeReminders.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-text-secondary">You have no pending reminders for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeReminders.map(r => {
                const isOverdue = new Date(r.scheduledTime) < new Date() && r.status === 'pending';
                const pcBg = r.status === 'completed' ? 'bg-green-50 border-green-200' : isOverdue ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200';
                
                return (
                  <div key={r._id} className={`p-4 rounded-xl border ${pcBg} flex justify-between items-center transition-colors`}>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {r.type === 'medication' ? '💊' : '📅'}
                      </div>
                      <div>
                        <p className={`font-bold ${r.status === 'completed' ? 'line-through text-gray-500' : 'text-text-primary'}`}>
                          {r.message}
                        </p>
                        <p className="text-xs text-text-secondary">
                          Scheduled: {new Date(r.scheduledTime).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.status === 'completed'}
                          onChange={() => handleToggleStatus(r._id, r.status)}
                          className="w-6 h-6 text-brand-primary rounded focus:ring-brand-primary cursor-pointer border-gray-300"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {historyReminders.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
            <details className="group">
              <summary className="text-lg font-bold cursor-pointer text-text-primary outline-none">
                History (Completed / Past)
              </summary>
              <div className="mt-4 space-y-3">
                {historyReminders.map(r => (
                  <div key={r._id} className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex justify-between items-center opacity-70">
                    <div>
                      <p className="font-semibold text-sm line-through text-gray-500">{r.message}</p>
                      <p className="text-xs text-text-secondary">{new Date(r.scheduledTime).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs font-bold uppercase text-gray-500">{r.status}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default RemindersPage;
