import React from 'react';
import { Article } from '../types';
import { X, Bookmark, Trash2, ArrowRight } from 'lucide-react';

interface SavedArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedArticles: Article[];
  onReadArticle: (article: Article) => void;
  onToggleSave: (articleId: string) => void;
}

export const SavedArticlesModal: React.FC<SavedArticlesModalProps> = ({
  isOpen,
  onClose,
  savedArticles,
  onReadArticle,
  onToggleSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-2xl bg-[#12141c] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#151821]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-['Playfair_Display'] text-lg font-bold text-white">Articles sauvegardés</h3>
              <p className="text-xs text-gray-400">{savedArticles.length} article(s) dans vos favoris</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {savedArticles.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h4 className="font-bold text-white text-base mb-1">Aucun article sauvegardé</h4>
              <p className="text-xs text-gray-400">Cliquez sur l'icône de favori sur n'importe quel article pour le retrouver ici.</p>
            </div>
          ) : (
            savedArticles.map((article) => (
              <div 
                key={article.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#181b24] border border-gray-800 hover:border-indigo-500/40 transition-all group cursor-pointer"
                onClick={() => { onReadArticle(article); onClose(); }}
              >
                <div className="flex items-center space-x-4 flex-1 pr-4">
                  <img src={article.imageUrl} alt={article.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      {article.category}
                    </span>
                    <h4 className="font-['Playfair_Display'] text-sm font-bold text-white mt-1 line-clamp-1 group-hover:text-indigo-300">
                      {article.title}
                    </h4>
                    <span className="text-[11px] text-gray-400">{article.publishedAt} • {article.readTime}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSave(article.id); }}
                    className="p-2 rounded-xl bg-gray-800/80 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
                    title="Retirer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-[#151821] border-t border-gray-800 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-800 text-white font-semibold text-xs hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
