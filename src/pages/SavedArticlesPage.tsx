import React from 'react';
import { Article } from '../types';
import { Bookmark, ArrowLeft, Trash2, ExternalLink } from 'lucide-react';

interface SavedArticlesPageProps {
  savedArticles: Article[];
  onReadArticle: (article: Article) => void;
  onToggleSave: (id: string) => void;
  onBackToHome: () => void;
}

export const SavedArticlesPage: React.FC<SavedArticlesPageProps> = ({
  savedArticles,
  onReadArticle,
  onToggleSave,
  onBackToHome,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in text-xs pb-16">
      
      {/* En-tête de la page */}
      <div className="flex items-center justify-between bg-[#151824] border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToHome}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-400" /> Vos Favoris
            </h1>
            <p className="text-[10px] text-slate-400">
              {savedArticles.length} article{savedArticles.length > 1 ? 's' : ''} enregistré{savedArticles.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Liste des articles ou état vide */}
      {savedArticles.length === 0 ? (
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-bold">Aucun article dans vos favoris</p>
          <p className="text-slate-500 text-[10px]">
            Cliquez sur l'icône de marque-page dans les articles pour les enregistrer ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {savedArticles.map((article) => (
            <div
              key={article.id}
              className="bg-[#151824] border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all"
            >
              <div className="space-y-2">
                <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold rounded text-[9px] uppercase">
                  {article.source}
                </span>
                <h2 className="font-extrabold text-white text-xs leading-snug">
                  {article.title}
                </h2>
                <p className="text-slate-400 text-[11px] line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => onReadArticle(article)}
                  className="text-indigo-400 hover:text-indigo-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <span>Lire l'article</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onToggleSave(article.id)}
                  className="p-1.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 rounded-lg transition-colors cursor-pointer"
                  title="Supprimer des favoris"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedArticlesPage;