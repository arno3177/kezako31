import React from 'react';
import { Compass, Sparkles, Heart, Github, Twitter, Linkedin } from 'lucide-react';

interface FooterProps {
  onOpenNewsletter: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenNewsletter }) => {
  return (
    <footer className="bg-[#0b0d12] border-t border-gray-800/80 pt-16 pb-12 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-gray-800/80">
          
          <div className="md:col-span-5">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg">
                <div className="w-full h-full bg-[#12141c] rounded-[14px] flex items-center justify-center">
                  <Compass className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <span className="font-['Playfair_Display'] text-2xl font-bold tracking-tight text-white">
                Mon Journal
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-md">
              Votre source quotidienne d'actualités rigoureuses, de reportages inspirants et de prévisions météo mondiales. Conçu pour éveiller la curiosité et nourrir l'esprit.
            </p>
            <div className="flex items-center space-x-3">
              <a href="#twitter" className="w-9 h-9 rounded-xl bg-gray-800/60 hover:bg-indigo-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#github" className="w-9 h-9 rounded-xl bg-gray-800/60 hover:bg-indigo-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#linkedin" className="w-9 h-9 rounded-xl bg-gray-800/60 hover:bg-indigo-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Rubriques</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><a href="#tech" className="hover:text-indigo-400 transition-colors">Technologie & Science</a></li>
              <li><a href="#world" className="hover:text-indigo-400 transition-colors">Actualité Internationale</a></li>
              <li><a href="#culture" className="hover:text-indigo-400 transition-colors">Culture & Arts</a></li>
              <li><a href="#eco" className="hover:text-indigo-400 transition-colors">Économie & Avenir</a></li>
              <li><a href="#lifestyle" className="hover:text-indigo-400 transition-colors">Style de vie & Slow Life</a></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Newsletter Exclusive</h4>
            <p className="text-xs text-gray-400 mb-4">
              Recevez notre sélection du matin directement dans votre boîte mail.
            </p>
            <button
              onClick={onOpenNewsletter}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>S'abonner au Brief Quotidien</span>
            </button>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Mon Journal — Actus & Météo. Tous droits réservés.</p>
          <div className="flex items-center space-x-6 mt-4 sm:mt-0">
            <a href="#privacy" className="hover:text-gray-400 transition-colors">Politique de confidentialité</a>
            <a href="#terms" className="hover:text-gray-400 transition-colors">Mentions légales</a>
            <a href="#cookies" className="hover:text-gray-400 transition-colors">Gestion des cookies</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
