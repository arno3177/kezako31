import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, Mail } from 'lucide-react';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewsletterModal: React.FC<NewsletterModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-br from-[#181c29] via-[#131620] to-[#0e1017] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-xl shadow-indigo-500/30 mb-6">
              <div className="w-full h-full bg-[#12141c] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>
            </div>

            <h3 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-white mb-2">
              Le Brief Quotidien
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Recevez chaque matin l’essentiel de l’actualité internationale, des innovations technologiques et des prévisions météo directement dans votre boîte mail. Zéro spam, désabonnement en un clic.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="Votre adresse email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#12141c] border border-gray-700 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <span>S'inscrire gratuitement</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-['Playfair_Display'] text-2xl font-bold text-white mb-2">
              Bienvenue parmi nous !
            </h3>
            <p className="text-sm text-gray-300 mb-6">
              Votre inscription est confirmée. Surveillez votre boîte mail pour votre premier journal matinal.
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30"
            >
              Fermer
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
