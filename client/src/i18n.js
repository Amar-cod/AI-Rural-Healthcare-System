import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  en: {
    translation: {
      "patient_dashboard": "Patient Dashboard",
      "welcome_back": "Welcome back",
      "logout": "Logout",
      "ai_assistant": "AI Assistant",
      "medical_history": "Medical History",
      "quick_actions": "Quick Actions",
      "start_consultation": "Start New AI Consultation",
      "upcoming_appointments": "Upcoming Appointments",
      "no_appointments": "No appointments booked yet.",
      "live_queue": "Live Queue Status",
      "position": "Position in queue:",
      "estimated_wait": "Estimated wait:",
      "status": "Status:",
      "not_in_queue": "You are not currently in any queue.",
      "downloadable_reports": "Downloadable Reports",
      "no_reports": "No reports available.",
      "download_pdf": "Download PDF",
      "login_title": "AI Rural Healthcare System",
      "login_subtitle": "Accessible healthcare for everyone",
      "email": "Email Address",
      "password": "Password",
      "login_button": "Log In",
      "dont_have_account": "Don't have an account?",
      "register_here": "Register here",
      "admin_login": "Admin Login",
      "doctor_login": "Doctor Login"
    }
  },
  hi: {
    translation: {
      "patient_dashboard": "मरीज़ डैशबोर्ड",
      "welcome_back": "वापसी पर स्वागत है",
      "logout": "लॉग आउट",
      "ai_assistant": "एआई सहायक",
      "medical_history": "चिकित्सा इतिहास",
      "quick_actions": "त्वरित क्रियाएं",
      "start_consultation": "नई एआई परामर्श शुरू करें",
      "upcoming_appointments": "आगामी अपॉइंटमेंट",
      "no_appointments": "अभी तक कोई अपॉइंटमेंट बुक नहीं किया गया है।",
      "live_queue": "लाइव कतार स्थिति",
      "position": "कतार में स्थान:",
      "estimated_wait": "अनुमानित प्रतीक्षा समय:",
      "status": "स्थिति:",
      "not_in_queue": "आप वर्तमान में किसी कतार में नहीं हैं।",
      "downloadable_reports": "डाउनलोड करने योग्य रिपोर्ट",
      "no_reports": "कोई रिपोर्ट उपलब्ध नहीं है।",
      "download_pdf": "पीडीएफ डाउनलोड करें",
      "login_title": "एआई ग्रामीण स्वास्थ्य देखभाल प्रणाली",
      "login_subtitle": "सभी के लिए सुलभ स्वास्थ्य देखभाल",
      "email": "ईमेल पता",
      "password": "पासवर्ड",
      "login_button": "लॉग इन करें",
      "dont_have_account": "क्या आपके पास खाता नहीं है?",
      "register_here": "यहां रजिस्टर करें",
      "admin_login": "व्यवस्थापक लॉगिन",
      "doctor_login": "डॉक्टर लॉगिन"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
