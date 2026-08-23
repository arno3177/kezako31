import React, { useState } from 'react';
import { Article, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Newspaper, Bookmark, Clock, ChevronRight, 
  Search, ArrowLeft, ExternalLink, Cpu, Terminal, Radio, Shield, Zap
} from 'lucide-react';

interface SourcesNewsPageProps {
  articles: Article[];
  savedArticleIds: string[];
  onToggleSave: (id: string) => void;
  onReadArticle: (article: Article) => void;
  onBackToHome: () => void;
  language?: AppSettings['language'];
}

export const SourcesNewsPage: React.FC<SourcesNewsPageProps> = ({
  articles,
  savedArticleIds,
  onToggleSave,
  onReadArticle,
  onBackToHome,
  language = 'en'
}) => {
  const t = getTranslation(language);
  const [activeFilter, setActiveFilter] = useState<'all' | 'franceinfo' | 'essentiel'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredArticles = articles.filter(art => {
    const matchesSource = 
      activeFilter === 'all' ? true :
      activeFilter === 'franceinfo' ? (art.source || '').toLowerCase().includes('franceinfo') :
      (art.source || '').toLowerCase().includes('essentiel');
    
    const matchesSearch = 
      searchFilter === '' ||
      art.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (art.excerpt && art.excerpt.toLowerCase().includes(searchFilter.toLowerCase()));

    return matchesSource && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in text-xs w-full max-w-7xl mx-auto pb-16 px-4">
      
      {/* HEADER HUD / FUTURISTE */}
      <div className="relative bg-gradient-to-r from-[#090d16] via-[#0d1527] to-[#090d16] border border-cyan-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-hidden">
        {/* Effet de lueur holographique en arrière-plan */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <button 
              onClick={onBackToHome}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 transition-colors flex items-center gap-2 cursor-pointer font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>[RETOUR_BASE]</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                DATASTREAM // ACTIVE_FEED_LINK
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white font-mono tracking-wider">
              CENTRE DE TÉLÉMÉTRIE & NEWS
            </h1>
          </div>

          {/* FILTRES INTERACTIVE HUD */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl font-mono font-bold transition-all cursor-pointer border ${
                activeFilter === 'all' 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              &gt; TOUS [{articles.length}]
            </button>
            <button
              onClick={() => setActiveFilter('franceinfo')}
              className={`px-4 py-2 rounded-xl font-mono font-bold transition-all cursor-pointer border ${
                activeFilter === 'franceinfo' 
                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              &gt; FRANCE_INFO
            </button>
            <button
              onClick={() => setActiveFilter('essentiel')}
              className={`px-4 py-2 rounded-xl font-mono font-bold transition-all cursor-pointer border ${
                activeFilter === 'essentiel' 
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              &gt; L_ESSENTIEL
            </button>
          </div>
        </div>

        {/* BARRE DE RECHERCHE TERMINAL */}
        <div className="mt-6 relative z-10">
          <div className="relative">
            <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="rechercher un flux ou un mot-clé..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#05080f]/90 border border-cyan-500/30 rounded-2xl pl-11 pr-4 py-3 text-xs md:text-sm text-cyan-200 placeholder-cyan-700 focus:outline-none focus:border-cyan-400 font-mono transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* GRILLE DE CARTES HOLOGRAPHIQUES (BENTO FUTURISTE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredArticles.map((art) => {
          const isSaved = savedArticleIds.includes(art.id);
          const isFranceInfo = (art.source || '').toLowerCase().includes('franceinfo');

          return (
            <div
              key={art.id}
              onClick={() => onReadArticle(art)}
              className={`group relative bg-gradient-to-br from-[#0c1220] via-[#080d17] to-[#05080f] border rounded-3xl p-5 md:p-6 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between overflow-hidden shadow-2xl ${
                isFranceInfo ? 'border-indigo-500/30 hover:border-indigo-400/80' : 'border-emerald-500/30 hover:border-emerald-400/80'
              }`}
            >
              {/* Effet de scanline / lueur au survol */}
              <div className={`absolute -right-12 -top-12 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-all opacity-20 group-hover:opacity-40 ${
                isFranceInfo ? 'bg-indigo-500' : 'bg-emerald-500'
              }`} />

              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-widest border ${
                    isFranceInfo ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  }`}>
                    [{art.source}]
                  </span>

                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> {art.publishedAt}
                  </span>
                </div>

                <h2 className="font-extrabold text-white text-sm md:text-base group-hover:text-cyan-300 transition-colors leading-snug line-clamp-3 font-mono">
                  {art.title}
                </h2>

                <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed font-sans">
                  {art.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 relative z-10 text-xs">
                <span className="text-cyan-400 font-mono font-bold flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                  <span>[ACCÉDER]</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(art.id);
                    }}
                    className={`p-2 rounded-xl border transition-colors ${
                      isSaved 
                        ? 'bg-pink-500/20 border-pink-500 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.3)]' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>

                  {art.url && (
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                      title="Lien externe direct"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredArticles.length === 0 && (
        <div className="bg-[#090d16] border border-cyan-500/30 rounded-3xl p-12 text-center space-y-3 font-mono">
          <Cpu className="w-10 h-10 text-cyan-500 mx-auto animate-pulse" />
          <p className="text-sm text-cyan-300">[!] ERREUR : AUCUN FLUX DISPONIBLE POUR CETTE REQUÊTE.</p>
        </div>
      )}

    </div>
  );
};