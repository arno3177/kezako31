import React, { useState } from 'react';
import { Article, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { Globe, Bookmark, ExternalLink, ArrowLeft, Search, Newspaper } from 'lucide-react';

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
  language = 'fr'
}) => {
  const t = getTranslation(language);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sources = Array.from(new Set(articles.map(a => a.source)));

  const filteredArticles = articles.filter(article => {
    const matchesSource = selectedSource === 'all' || article.source === selectedSource;
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in text-xs max-w-6xl mx-auto pb-10">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#16182a] border border-indigo-500/20 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight">
              {t.newsSources}
            </h1>
            <p className="text-[11px] text-pink-300/70">
              {t.allSources}
            </p>
          </div>
        </div>

        <button 
          onClick={onBackToHome}
          className="p-2 rounded-xl bg-[#0d0f17] border border-slate-800 hover:text-white text-slate-400 flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t.backToHome}</span>
        </button>
      </div>

      {/* Barre de Recherche et Filtres par Source */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151824] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedSource('all')}
            className={`px-3 py-1.5 rounded-xl border font-bold transition-all ${
              selectedSource === 'all'
                ? 'bg-indigo-600 text-white border-indigo-400'
                : 'bg-[#151824] text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {t.allArticles}
          </button>
          {sources.map(src => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all ${
                selectedSource === src
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-[#151824] text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des Articles */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map(article => (
            <div 
              key={article.id}
              className="bg-[#151824] border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-indigo-500/40 transition-all"
            >
              {article.imageUrl && (
                <div className="relative h-44 overflow-hidden">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-[#0d0f17]/80 backdrop-blur-md text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                    {article.source}
                  </span>
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 
                    onClick={() => onReadArticle(article)}
                    className="font-extrabold text-white text-sm hover:text-indigo-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
                  >
                    {article.title}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button 
                    onClick={() => onReadArticle(article)} 
                    className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 cursor-pointer text-[11px]"
                  >
                    <span>{t.readArticle}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button 
                    onClick={() => onToggleSave(article.id)} 
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      savedArticleIds.includes(article.id) 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                        : 'bg-[#0d0f17] text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#151824] border border-slate-800 rounded-2xl text-slate-400 space-y-2">
          <Newspaper className="w-8 h-8 mx-auto text-slate-600" />
          <p className="font-bold">{t.noArticlesFound}</p>
        </div>
      )}

    </div>
  );
};