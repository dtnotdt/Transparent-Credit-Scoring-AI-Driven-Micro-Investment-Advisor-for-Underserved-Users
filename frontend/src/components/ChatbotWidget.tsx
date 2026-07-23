import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Mic, MicOff, RefreshCw, Sparkles, Globe } from 'lucide-react';
import { api, RiskProfileRequest, RiskProfileResponse } from '../api/client';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  options?: { label: string; value: any }[];
}

export type SupportedLanguage = 'en' | 'hi' | 'gu';

const I18N = {
  en: {
    widgetTitle: 'Risk Profiler AI',
    title: 'Risk Profiler Bot',
    subtitle: '8-Question Rule Classifier',
    welcome: 'Welcome to the Conversational Risk Profiler! I will ask you 8 simple questions to analyze your financial risk profile.',
    questionPrefix: 'Question',
    analyzing: 'Analyzing your responses using our rule engine...',
    complete: 'Analysis complete! Your Risk Profile is',
    error: 'An error occurred while calculating your risk profile. Please try restarting.',
    typeResponse: 'Type response...',
    restartTooltip: 'Restart Chat',
    voiceTooltip: 'Language Selection',
    riskLevel: 'Risk',
  },
  hi: {
    widgetTitle: 'रिस्क प्रोफाइलर AI',
    title: 'रिस्क प्रोफाइलर बॉट',
    subtitle: '8-प्रश्न नियम वर्गीकरण',
    welcome: 'वार्तालाप जोखिम प्रोफाइलर में आपका स्वागत है! आपके वित्तीय जोखिम प्रोफाइल का विश्लेषण करने के लिए मैं आपसे 8 सरल प्रश्न पूछूंगा।',
    questionPrefix: 'प्रश्न',
    analyzing: 'हमारे नियम इंजन का उपयोग करके आपके उत्तरों का विश्लेषण किया जा रहा है...',
    complete: 'विश्लेषण पूर्ण! आपकी जोखिम प्रोफ़ाइल है',
    error: 'आपकी जोखिम प्रोफ़ाइल की गणना करते समय एक त्रुटि हुई। कृपया पुनः प्रयास करें।',
    typeResponse: 'उत्तर टाइप करें...',
    restartTooltip: 'चैट पुनरारंभ करें',
    voiceTooltip: 'भाषा चयन',
    riskLevel: 'जोखिम',
  },
  gu: {
    widgetTitle: 'રિસ્ક પ્રોફાઇલર AI',
    title: 'રિસ્ક પ્રોફાઇલર બોટ',
    subtitle: '8-પ્રશ્ન વર્ગીકરણ એન્જિન',
    welcome: 'વાતચીત જોખમ પ્રોફાઇલરમાં આપનું સ્વાગત છે! તમારી નાણાકીય જોખમ પ્રોફાઇલનું વિશ્લેષણ કરવા માટે હું તમને 8 સરળ પ્રશ્નો પૂછીશ.',
    questionPrefix: 'પ્રશ્ન',
    analyzing: 'અમારા એન્જિનનો ઉપયોગ કરીને તમારા જવાબોનું વિશ્લેષણ કરી રહ્યાં છીએ...',
    complete: 'વિશ્લેષણ પૂર્ણ! તમારી જોખમ પ્રોફાઇલ છે',
    error: 'તમારી જોખમ પ્રોફાઇલની ગણતરી કરતી વખતે ભૂલ થઈ. કૃપા કરીને ફરી પ્રયાસ કરો.',
    typeResponse: 'જવાબ ટાઇપ કરો...',
    restartTooltip: 'ચેટ ફરી શરૂ કરો',
    voiceTooltip: 'ભાષા પસંદગી',
    riskLevel: 'જોખમ',
  },
};

const QUESTIONS_I18N = {
  en: [
    { key: 'age', question: 'What is your current age in years?', type: 'number', placeholder: 'e.g. 28' },
    { key: 'monthly_income', question: 'What is your monthly gross income in INR (₹)?', type: 'number', placeholder: 'e.g. 45000' },
    {
      key: 'occupation',
      question: 'What is your current occupation or employment type?',
      type: 'options',
      options: [
        { label: 'Salaried Private', value: 'Salaried Private' },
        { label: 'Government Employee', value: 'Government Employee' },
        { label: 'Self-Employed / Business', value: 'Self-Employed' },
        { label: 'Gig Worker / Freelancer', value: 'Gig Worker' },
        { label: 'Student / Other', value: 'Student' },
      ],
    },
    { key: 'monthly_savings', question: 'How much do you save each month on average in INR (₹)?', type: 'number', placeholder: 'e.g. 10000' },
    { key: 'investment_amount', question: 'How much would you like to invest monthly in a micro-SIP (₹)?', type: 'number', placeholder: 'e.g. 2500' },
    {
      key: 'has_emergency_fund',
      question: 'Do you have an emergency fund covering at least 3 months of expenses?',
      type: 'options',
      options: [
        { label: 'Yes, fully funded', value: true },
        { label: 'No / Partial fund', value: false },
      ],
    },
    {
      key: 'investment_duration_years',
      question: 'What is your targeted investment time horizon in years?',
      type: 'options',
      options: [
        { label: '1 - 2 Years (Short-term)', value: 2 },
        { label: '3 - 5 Years (Medium-term)', value: 4 },
        { label: '6 - 10 Years (Long-term)', value: 8 },
        { label: '10+ Years (Wealth Creation)', value: 12 },
      ],
    },
    {
      key: 'market_loss_reaction',
      question: 'If your investment portfolio loses 15% value in a market downturn, what would you do?',
      type: 'options',
      options: [
        { label: 'Sell immediately to stop loss', value: 'panic_sell' },
        { label: 'Hold and wait for market recovery', value: 'hold' },
        { label: 'Buy more at lower prices', value: 'buy_more' },
      ],
    },
  ],
  hi: [
    { key: 'age', question: 'आपकी वर्तमान आयु (वर्षों में) क्या है?', type: 'number', placeholder: 'उदा. 28' },
    { key: 'monthly_income', question: 'आपकी मासिक सकल आय रुपये (₹) में कितनी है?', type: 'number', placeholder: 'उदा. 45000' },
    {
      key: 'occupation',
      question: 'आपका वर्तमान व्यवसाय या रोजगार प्रकार क्या है?',
      type: 'options',
      options: [
        { label: 'वेतनभोगी निजी', value: 'Salaried Private' },
        { label: 'सरकारी कर्मचारी', value: 'Government Employee' },
        { label: 'स्व-रोजगार / व्यवसाय', value: 'Self-Employed' },
        { label: 'गिग वर्कर / फ्रीलांसर', value: 'Gig Worker' },
        { label: 'छात्र / अन्य', value: 'Student' },
      ],
    },
    { key: 'monthly_savings', question: 'आप औसतन प्रति माह कितने रुपये (₹) बचाते हैं?', type: 'number', placeholder: 'उदा. 10000' },
    { key: 'investment_amount', question: 'आप माइक्रो-एसआईपी (₹) में प्रति माह कितना निवेश करना चाहेंगे?', type: 'number', placeholder: 'उदा. 2500' },
    {
      key: 'has_emergency_fund',
      question: 'क्या आपके पास कम से कम 3 महीने के खर्चों को कवर करने वाला आपातकालीन कोष है?',
      type: 'options',
      options: [
        { label: 'हाँ, पूरी तरह से पोषित', value: true },
        { label: 'नहीं / आंशिक कोष', value: false },
      ],
    },
    {
      key: 'investment_duration_years',
      question: 'वर्षों में आपका लक्षित निवेश समय क्या है?',
      type: 'options',
      options: [
        { label: '1 - 2 वर्ष (अल्पकालिक)', value: 2 },
        { label: '3 - 5 वर्ष (मध्यम अवधि)', value: 4 },
        { label: '6 - 10 वर्ष (दीर्घकालिक)', value: 8 },
        { label: '10+ वर्ष (धन सृजन)', value: 12 },
      ],
    },
    {
      key: 'market_loss_reaction',
      question: 'यदि बाजार में मंदी के कारण आपके पोर्टफोलियो का मूल्य 15% गिर जाता है, तो आप क्या करेंगे?',
      type: 'options',
      options: [
        { label: 'नुकसान रोकने के लिए तुरंत बेचें', value: 'panic_sell' },
        { label: 'रुकें और बाजार की रिकवरी का इंतजार करें', value: 'hold' },
        { label: 'कम कीमतों पर अधिक खरीदें', value: 'buy_more' },
      ],
    },
  ],
  gu: [
    { key: 'age', question: 'તમારી હાલની ઉંમર (વર્ષોમાં) કેટલી છે?', type: 'number', placeholder: 'દા.ત. 28' },
    { key: 'monthly_income', question: 'તમારી માસિક કુલ આવક (₹ માં) કેટલી છે?', type: 'number', placeholder: 'દા.ત. 45000' },
    {
      key: 'occupation',
      question: 'તમારો વર્તમાન વ્યવસાય કે રોજગારનો પ્રકાર શું છે?',
      type: 'options',
      options: [
        { label: 'પગારદાર ખાનગી', value: 'Salaried Private' },
        { label: 'સરકારી કર્મચારી', value: 'Government Employee' },
        { label: 'સ્વ-રોજગાર / વ્યવસાય', value: 'Self-Employed' },
        { label: 'ગિગ વર્કર / ફ્રીલાન્સર', value: 'Gig Worker' },
        { label: 'વિદ્યાર્થી / અન્ય', value: 'Student' },
      ],
    },
    { key: 'monthly_savings', question: 'તમે દર મહિને સરેરાશ કેટલા રૂપિયા (₹) બચાવો છો?', type: 'number', placeholder: 'દા.ત. 10000' },
    { key: 'investment_amount', question: 'તમે માઇક્રો-SIP (₹) માં દર મહિને કેટલું રોકાણ કરવા માંગો છો?', type: 'number', placeholder: 'દા.ત. 2500' },
    {
      key: 'has_emergency_fund',
      question: 'શું તમારી પાસે ઓછામાં ઓછા 3 મહિનાના ખર્ચને આવરી લેતું કટોકટી ભંડોળ છે?',
      type: 'options',
      options: [
        { label: 'હા, સંપૂર્ણ ભંડોળ', value: true },
        { label: 'ના / અંશતઃ ભંડોળ', value: false },
      ],
    },
    {
      key: 'investment_duration_years',
      question: 'વર્ષોમાં તમારો લક્ષ્યાંકિત રોકાણ સમયગાળો શું છે?',
      type: 'options',
      options: [
        { label: '1 - 2 વર્ષ (ટૂંકા ગાળાનું)', value: 2 },
        { label: '3 - 5 વર્ષ (મધ્યમ ગાળાનું)', value: 4 },
        { label: '6 - 10 વર્ષ (લાંબા ગાળાનું)', value: 8 },
        { label: '10+ વર્ષ (સંપત્તિ સર્જન)', value: 12 },
      ],
    },
    {
      key: 'market_loss_reaction',
      question: 'જો બજારના ઘટાડામાં તમારું રોકાણ 15% ઘટે, તો તમે શું કરશો?',
      type: 'options',
      options: [
        { label: 'નુકસાન અટકાવવા વેચી દો', value: 'panic_sell' },
        { label: 'જાળવી રાખો અને રિકવરીની રાહ જુઓ', value: 'hold' },
        { label: 'સસ્તા ભાવે વધુ ખરીદો', value: 'buy_more' },
      ],
    },
  ],
};

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<RiskProfileRequest>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskProfileResponse | null>(null);

  const initialLang = (localStorage.getItem('preferred_language') as SupportedLanguage) || 'en';
  const [language, setLanguage] = useState<SupportedLanguage>(initialLang);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = I18N[language] || I18N.en;
  const questionsList = QUESTIONS_I18N[language] || QUESTIONS_I18N.en;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startChat(language);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLanguageChange = async (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    localStorage.setItem('preferred_language', newLang);

    // Save to user profile via backend API if logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.patch('/auth/language', { language: newLang });
      } catch (e) {
        // Safe silent fail if unauthenticated or offline
      }
    }

    // Refresh active bot prompt language mid-session
    if (currentStep < questionsList.length) {
      const activeQ = QUESTIONS_I18N[newLang][currentStep];
      const langT = I18N[newLang];
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        // Update current bot question prompt
        if (updated.length >= 2) {
          updated[0] = { ...updated[0], text: langT.welcome };
          updated[updated.length - 1] = {
            id: updated[updated.length - 1].id,
            sender: 'bot',
            text: `${langT.questionPrefix} ${currentStep + 1}/8: ${activeQ.question}`,
            options: activeQ.options,
          };
        }
        return updated;
      });
    }
  };

  const startChat = (lang: SupportedLanguage = language) => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    const langT = I18N[lang];
    const qList = QUESTIONS_I18N[lang];
    const q0 = qList[0];

    setMessages([
      {
        id: '1',
        sender: 'bot',
        text: langT.welcome,
      },
      {
        id: '2',
        sender: 'bot',
        text: `${langT.questionPrefix} 1/8: ${q0.question}`,
        options: q0.options,
      },
    ]);
  };

  // Web Speech Recognition
  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    const langCodes = { en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN' };
    recognition.lang = langCodes[language];
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleAnswer = async (value: any, displayLabel?: string) => {
    const q = questionsList[currentStep];
    const newAnswers = { ...answers, [q.key]: value };
    setAnswers(newAnswers);

    const userText = displayLabel || String(value);
    const newMsgList: ChatMessage[] = [
      ...messages,
      { id: Date.now().toString(), sender: 'user', text: userText },
    ];

    const nextStep = currentStep + 1;

    if (nextStep < questionsList.length) {
      setCurrentStep(nextStep);
      const nextQ = questionsList[nextStep];
      newMsgList.push({
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `${t.questionPrefix} ${nextStep + 1}/8: ${nextQ.question}`,
        options: nextQ.options,
      });
      setMessages(newMsgList);
      setInputValue('');
    } else {
      // Completed all 8 questions -> Call Backend API
      setMessages([
        ...newMsgList,
        { id: (Date.now() + 1).toString(), sender: 'bot', text: t.analyzing },
      ]);
      setLoading(true);

      try {
        const res = await api.post<RiskProfileResponse>('/risk-profile', newAnswers as RiskProfileRequest);
        setResult(res.data);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `${t.complete} **${res.data.risk_level} ${t.riskLevel}**.\n\n${res.data.rationale}`,
          },
        ]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: t.error,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const q = questionsList[currentStep];
    let val: any = inputValue.trim();
    if (q.type === 'number') {
      val = parseFloat(val);
      if (isNaN(val) || val < 0) return;
    }
    handleAnswer(val);
  };

  return (
    <>
      {/* Floating launcher button — Red & Gold Yellow Theme */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-red-600 via-red-700 to-amber-500 text-white font-extrabold shadow-lg shadow-red-600/40 hover:shadow-red-600/60 border border-amber-400/40 transition-all"
      >
        <Sparkles className="w-5 h-5 text-amber-300" />
        <span className="hidden sm:inline">{t.widgetTitle}</span>
      </motion.button>

      {/* Chat modal drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh] rounded-2xl glass-panel shadow-2xl flex flex-col overflow-hidden border border-red-200 dark:border-red-900"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-red-900/30 bg-gradient-to-r from-red-950 via-slate-950 to-red-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-amber-400/40 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">{t.title}</h3>
                  <p className="text-[10px] text-amber-200">{t.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Language switcher */}
                <div className="relative flex items-center gap-1 bg-slate-900 rounded-lg px-2 py-1 border border-slate-800">
                  <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                    className="bg-transparent text-[11px] font-bold text-slate-200 focus:outline-none cursor-pointer"
                    title={t.voiceTooltip}
                  >
                    <option value="en" className="bg-slate-900 text-white">EN (English)</option>
                    <option value="hi" className="bg-slate-900 text-white">HI (हिंदी)</option>
                    <option value="gu" className="bg-slate-900 text-white">GU (ગુજરાતી)</option>
                  </select>
                </div>

                <button
                  onClick={() => startChat(language)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  title={t.restartTooltip}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white dark:bg-slate-950">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.sender === 'user'
                        ? 'bg-red-600 text-white rounded-br-none font-medium shadow-md shadow-red-600/20'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>

                  {/* Render option buttons if present */}
                  {m.options && currentStep < questionsList.length && (
                    <div className="mt-2.5 flex flex-wrap gap-2 max-w-[90%]">
                      {m.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(opt.value, opt.label)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-600 hover:text-white text-red-700 dark:text-amber-300 border border-red-200 dark:border-red-900 transition-all text-left"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-amber-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {t.analyzing}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            {currentStep < questionsList.length && questionsList[currentStep].type !== 'options' && (
              <form onSubmit={handleSubmitText} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2 rounded-xl border transition-all ${
                    isListening
                      ? 'bg-red-600 border-red-500 text-white animate-pulse'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                  title={t.voiceTooltip}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <input
                  type={questionsList[currentStep]?.type || 'text'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={questionsList[currentStep]?.placeholder || t.typeResponse}
                  className="flex-1 glass-input rounded-xl px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
