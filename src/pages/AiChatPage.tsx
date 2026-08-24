import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Send, Bot, User, AlertCircle, RefreshCw } from 'lucide-react';

export const AiChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Salutations. Je suis votre assistant IA quantique. Comment puis-je optimiser votre journée, vos trajets ou analyser vos actualités ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = localStorage.getItem('user_gemini_api_key');
      if (!apiKey) {
        setApiKeyMissing(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Erreur : Aucune clé API Gemini détectée. Veuillez configurer votre clé personnelle dans les Paramètres de l\'application.' }]);
        setIsLoading(false);
        return;
      }

      setApiKeyMissing(false);
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userMessage,
        config: {
          systemInstruction: "Tu es un assistant IA futuriste, ultra-rapide et utile, intégré dans un tableau de bord personnel intelligent (Actualités, Météo, Trajets au Luxembourg). Structure tes réponses avec des paragraphes clairs, des sauts de ligne et évite les balises markdown brutes illisibles."
        }
      });

      const aiResponse = response.text || "Je n'ai pas pu générer de réponse claire.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error: any) {
      console.error("Erreur Gemini:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Erreur de communication avec l'IA : ${error.message || 'Vérifiez votre clé API.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAiMessage = (text: string) => {
    const parts = text.split('\n');
    return parts.map((line, i) => {
      const cleanedLine = line.replace(/\*\*/g, '').replace(/\*/g, '');
      if (cleanedLine.startsWith('- ') || cleanedLine.startsWith('• ')) {
        return <li key={i} className="ml-4 list-disc text-slate-200 my-0.5">{cleanedLine.replace(/^[-•]\s*/, '')}</li>;
      }
      return <p key={i} className="my-1">{cleanedLine}</p>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in text-xs pb-10">
      
      {/* En-tête futuriste */}
      <div className="bg-gradient-to-r from-[#111e25] via-[#132733] to-[#111e25] border border-cyan-500/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center space-x-3 relative z-10">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
              QUANTUM AI CORE <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">Gemini 3.6</span>
            </h1>
            <p className="text-slate-400 text-[10px]">Interface neuronale de dialogue et d'assistance temps réel</p>
          </div>
        </div>
        {apiKeyMissing && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
            <AlertCircle className="w-3.5 h-3.5" /> Clé requise dans les Paramètres
          </div>
        )}
      </div>

      {/* Fenêtre de chat futuriste */}
      <div className="bg-[#111e25] border border-cyan-500/20 rounded-2xl p-4 shadow-2xl flex flex-col h-[520px] relative">
        
        {/* Corps des messages */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex items-start space-x-2.5 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' 
                  ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400' 
                  : 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-950/50'
              }`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed text-[11px] font-medium shadow-md ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-950'
                  : 'bg-[#0a1217] border border-cyan-500/20 text-slate-200 rounded-tl-none space-y-1'
              }`}>
                {msg.role === 'assistant' ? formatAiMessage(msg.content) : msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3 rounded-2xl bg-[#0a1217] border border-cyan-500/20 text-cyan-400 flex items-center space-x-2 text-[11px]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyse neuronale en cours...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Barre de saisie */}
        <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question à l'IA..."
            className="flex-1 p-3 rounded-xl bg-[#0a1217] border border-cyan-500/30 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none text-xs font-mono shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold flex items-center justify-center transition-all shadow-lg shadow-cyan-950 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
};