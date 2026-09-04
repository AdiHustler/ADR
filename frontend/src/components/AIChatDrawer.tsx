import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  RotateCcw, 
  Copy, 
  Check, 
  ShieldCheck
} from 'lucide-react';
import { AIChatMessage } from '../types';
import { api } from '../services/api';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reportContext?: any;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isOpen, onClose, reportContext }) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `### 👋 Clinical Pharmacovigilance AI Copilot

I can assist you with:
- **Registry Insights:** Search and summarize adverse event cases from our live database.
- **Drug Safety Profiles:** MedDRA terms, known ADRs, and boxed warnings.
- **Drug Interactions:** CYP450 metabolism and clinical risks (e.g. Warfarin + Clarithromycin).
- **Causality & Compliance:** Naranjo algorithm scoring & ICH E2B(R3) criteria.

*Type your question below or click the **Microphone** button to speak!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([
    'How many reports are in the registry?',
    'What are the risks of Amoxicillin?',
    'Warfarin + Clarithromycin interaction',
    'How does Naranjo scoring work?'
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          setInput((prev) => (prev ? `${prev} ${currentText}` : currentText));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech detected. Please try again.');
        } else {
          setVoiceError(`Voice recognition error (${event.error}).`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported by your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setVoiceError(null);
      try {
        recognitionRef.current?.start();
      } catch (_e) {
        // May already be active
        recognitionRef.current?.stop();
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg: AIChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiKey = localStorage.getItem('gemini_api_key') || undefined;
      const res = await api.chatWithAI(newMessages, reportContext, apiKey);

      const assistantMsg: AIChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (res.suggested_actions && res.suggested_actions.length > 0) {
        setSuggestedActions(res.suggested_actions);
      }
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `⚠️ **Connection Note:** ${err.message || 'Unable to reach the clinical AI assistant. Please ensure the backend is running.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'init-fresh',
        role: 'assistant',
        content: 'Clinical chat history cleared. How can I assist your pharmacovigilance workflow now?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      
      {/* Backdrop click to close on desktop */}
      <div className="flex-1 hidden md:block" onClick={onClose} />

      {/* Slide-out Drawer Container */}
      <div className="w-full sm:w-[480px] md:w-[520px] bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 bg-gradient-to-r from-teal-800 to-cyan-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-300 border border-white/10">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm leading-none">ADR-Sentinel Copilot</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-400/20 text-teal-200 font-semibold border border-teal-300/30">
                  Voice Enabled
                </span>
              </div>
              <p className="text-[11px] text-teal-100/80 mt-0.5">Clinical Pharmacovigilance & Drug Safety AI</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={clearChat}
              title="Clear conversation"
              className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Active Bar */}
        {isListening && (
          <div className="bg-rose-50 border-b border-rose-200 p-2.5 flex items-center justify-between text-rose-700 animate-pulse text-xs font-semibold px-4">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
              <span>Listening to your clinical query... Speak now</span>
            </div>
            <button
              onClick={toggleVoiceInput}
              className="text-[11px] bg-rose-600 text-white px-2 py-0.5 rounded-md font-bold hover:bg-rose-700"
            >
              Stop
            </button>
          </div>
        )}

        {voiceError && (
          <div className="bg-amber-50 border-b border-amber-200 p-2 text-amber-800 text-xs px-4 flex items-center justify-between">
            <span>{voiceError}</span>
            <button onClick={() => setVoiceError(null)} className="text-amber-600 font-bold ml-2">×</button>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id || idx}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs relative group ${
                  isUser 
                    ? 'bg-teal-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                }`}>
                  <div className="prose prose-xs max-w-none prose-slate leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  <div className={`flex items-center justify-between mt-2 pt-1 border-t text-[10px] ${
                    isUser ? 'border-teal-500/40 text-teal-100' : 'border-slate-100 text-slate-400'
                  }`}>
                    <span>{msg.timestamp || ''}</span>
                    
                    {!isUser && (
                      <button
                        onClick={() => copyMessage(msg.id || String(idx), msg.content)}
                        className="hover:text-slate-600 flex items-center space-x-1 transition-colors"
                        title="Copy message"
                      >
                        {copiedId === (msg.id || String(idx)) ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-3.5 shadow-xs flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[11px] text-slate-400 ml-1.5">Analyzing clinical context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        {suggestedActions.length > 0 && (
          <div className="p-2.5 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 no-scrollbar">
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSendMessage(action)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-[11px] text-slate-600 font-medium border border-slate-200 transition-colors shrink-0"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Input & Voice Controls */}
        <div className="p-3.5 bg-white border-t border-slate-200 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            {/* Microphone Toggle Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListening ? 'Stop listening' : 'Voice input (Speak query)'}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-600 ring-4 ring-rose-500/20 shadow-md animate-pulse'
                  : 'bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border-slate-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening... speak your query' : 'Ask about ADRs, Naranjo score, drug safety...'}
              disabled={loading}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all bg-slate-50/50"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-600" />
              ICH E2B(R3) & MedDRA Aligned
            </span>
            <span>Web Speech API Active</span>
          </div>
        </div>

      </div>
    </div>
  );
};
