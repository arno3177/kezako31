import React, { useState } from 'react';
import { Article } from '../types';
import { Globe, Search, Bookmark, ExternalLink, Radio, Rss, ChevronRight } from 'lucide-react';

interface SourcesNewsPageProps {
  articles: Article[];
  savedArticleIds: string[];
  onToggleSave: (id: string) => void;
  onReadArticle: (article: Article) => void;
  onBackToHome: () => void;
}

export const SourcesNewsPage: React.FC<SourcesNewsPageProps> = ({
  articles = [],
  savedArticleIds = [],
  onToggleSave,
  onReadArticle,
  onBackToHome
}) => {
  const [selectedSource, setSelectedSource] = useState<'all' | 'franceinfo' | 'lessentiel'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const safeArticles = Array.isArray(articles) ? articles : [];
  const safeSavedIds = Array.isArray(savedArticleIds) ? savedArticleIds : [];

  const franceInfoArticles = safeArticles.filter(a => a && a.source.includes('franceinfo'));
  const lessentielArticles = safeArticles.filter(a => a && a.source.includes('lessentiel'));

  const filteredFranceInfo = franceInfoArticles.filter(a => {
    const title = (a.title || '').toLowerCase();
    const excerpt = (a.excerpt || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    return title.includes(query) || excerpt.includes(query);
  });

  const filteredLessentiel = lessentielArticles.filter(a => {
    const title = (a.title || '').toLowerCase();
    const excerpt = (a.excerpt || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    return title.includes(query) || excerpt.includes(query);
  });

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#1a1e2a] via-[#151821] to-[#12141c] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/25 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Flux RSS Principaux et Officiels</span>
            </div>
            <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-white">
              Flux Principaux par Source RSS
            </h1>
            <p className="text-xs md:text-sm text-gray-300 mt-1 max-w-2xl">
              Accédez aux flux RSS principaux officiels de nos partenaires : <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">franceinfo.fr/titres.rss</code> et <code className="text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded text-xs">lessentiel.lu/rss/lessentiel-fr</code>.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#12141c] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Filter Selector tabs */}
      <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedSource('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedSource === 'all'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-[#151821] text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          Tous les flux ({safeArticles.length})
        </button>
        <button
          onClick={() => setSelectedSource('franceinfo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            selectedSource === 'franceinfo'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-[#151821] text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          <Rss className="w-3.5 h-3.5 text-blue-300" />
          <span>France Info ({filteredFranceInfo.length})</span>
        </button>
        <button
          onClick={() => setSelectedSource('lessentiel')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            selectedSource === 'lessentiel'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'bg-[#151821] text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          <Rss className="w-3.5 h-3.5 text-pink-300" />
          <span>L'Essentiel ({filteredLessentiel.length})</span>
        </button>
      </div>

      {/* SECTION 1: FRANCE INFO STREAM (Horizontal Layout) */}
      {(selectedSource === 'all' || selectedSource === 'franceinfo') && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Rss className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-['Playfair_Display'] text-xl font-bold text-white flex items-center space-x-2">
                  <span>Flux Principal France Info</span>
                </h2>
                <a 
                  href="https://www.francetvinfo.fr/titres.rss" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-400 hover:underline inline-flex items-center space-x-1 font-mono"
                >
                  <span>franceinfo.fr/titres.rss</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-gray-400 bg-[#151821] px-3 py-1 rounded-xl border border-gray-800">
              {filteredFranceInfo.length} article(s)
            </span>
          </div>

          {filteredFranceInfo.length === 0 ? (
            <div className="p-8 text-center bg-[#151821] rounded-2xl border border-gray-800">
              <p className="text-xs text-gray-400">Aucun article ne correspond à votre recherche pour France Info.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFranceInfo.map((article) => {
                const isSaved = safeSavedIds.includes(article.id);
                return (
                  <div
                    key={article.id}
                    onClick={() => onReadArticle(article)}
                    className="group bg-[#151821] border border-blue-500/20 hover:border-blue-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-row items-stretch p-3 gap-3.5 cursor-pointer"
                  >
                    {/* Left Image */}
                    <div className="relative w-28 sm:w-32 flex-shrink-0 rounded-xl overflow-hidden bg-black/40">
                      <img 
                        src={article.imageUrl} 
                        alt={article.title} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 min-h-[90px]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleSave(article.id); }}
                        className={`absolute top-1.5 right-1.5 p-1 rounded-md backdrop-blur-md transition-all ${
                          isSaved ? 'bg-pink-500 text-white shadow-md' : 'bg-black/40 text-white hover:bg-black/60 border border-white/10'
                        }`}
                      >
                        <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                          <span>{article.publishedAt}</span>
                          <span>{article.readTime}</span>
                        </div>
                        <h3 className="font-['Playfair_Display'] text-xs sm:text-sm font-bold text-white mb-1 group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                          {article.excerpt}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] mt-2">
                        <span className="text-blue-400 font-semibold truncate max-w-[80px]">{article.source}</span>
                        <span className="text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5">
                          <span>Lire</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: L'ESSENTIEL STREAM (Horizontal Layout) */}
      {(selectedSource === 'all' || selectedSource === 'lessentiel') && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Rss className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-['Playfair_Display'] text-xl font-bold text-white flex items-center space-x-2">
                  <span>Flux Principal L'Essentiel Luxembourg</span>
                </h2>
                <a 
                  href="https://partner-feeds.lessentiel.lu/rss/lessentiel-fr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] text-pink-400 hover:underline inline-flex items-center space-x-1 font-mono"
                >
                  <span>lessentiel.lu/rss/lessentiel-fr</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-gray-400 bg-[#151821] px-3 py-1 rounded-xl border border-gray-800">
              {filteredLessentiel.length} article(s)
            </span>
          </div>

          {filteredLessentiel.length === 0 ? (
            <div className="p-8 text-center bg-[#151821] rounded-2xl border border-gray-800">
              <p className="text-xs text-gray-400">Aucun article ne correspond à votre recherche pour L'Essentiel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLessentiel.map((article) => {
                const isSaved = safeSavedIds.includes(article.id);
                return (
                  <div
                    key={article.id}
                    onClick={() => onReadArticle(article)}
                    className="group bg-[#151821] border border-pink-500/20 hover:border-pink-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-row items-stretch p-3 gap-3.5 cursor-pointer"
                  >
                    {/* Left Image */}
                    <div className="relative w-28 sm:w-32 flex-shrink-0 rounded-xl overflow-hidden bg-black/40">
                      <img 
                        src={article.imageUrl} 
                        alt={article.title} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 min-h-[90px]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleSave(article.id); }}
                        className={`absolute top-1.5 right-1.5 p-1 rounded-md backdrop-blur-md transition-all ${
                          isSaved ? 'bg-pink-500 text-white shadow-md' : 'bg-black/40 text-white hover:bg-black/60 border border-white/10'
                        }`}
                      >
                        <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                          <span>{article.publishedAt}</span>
                          <span>{article.readTime}</span>
                        </div>
                        <h3 className="font-['Playfair_Display'] text-xs sm:text-sm font-bold text-white mb-1 group-hover:text-pink-300 transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                          {article.excerpt}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] mt-2">
                        <span className="text-pink-400 font-semibold truncate max-w-[80px]">{article.source}</span>
                        <span className="text-pink-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5">
                          <span>Lire</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
