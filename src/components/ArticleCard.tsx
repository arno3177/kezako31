import React from 'react';
import { Article } from '../types';
import { Bookmark, ChevronRight } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onReadArticle: (article: Article) => void;
  isSaved: boolean;
  onToggleSave: (articleId: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onReadArticle,
  isSaved,
  onToggleSave
}) => {
  return (
    <div 
      onClick={() => onReadArticle(article)}
      className="group bg-[#151821] border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-indigo-500/40 transition-all duration-300 flex flex-row items-stretch cursor-pointer p-3 gap-3.5"
    >
      {/* Horizontal Left Image Container */}
      <div className="relative w-28 sm:w-32 flex-shrink-0 rounded-xl overflow-hidden bg-black/40">
        <img 
          src={article.imageUrl} 
          alt={article.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 min-h-[90px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
        
        <div className="absolute top-1.5 left-1.5">
          <span className="px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase bg-black/70 backdrop-blur-md text-indigo-300 border border-white/10 rounded-md">
            {article.category}
          </span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onToggleSave(article.id); }}
          className={`absolute top-1.5 right-1.5 p-1 rounded-md backdrop-blur-md transition-all ${
            isSaved 
              ? 'bg-pink-500 text-white shadow-md' 
              : 'bg-black/40 text-white hover:bg-black/60 border border-white/10'
          }`}
          title={isSaved ? "Retirer des favoris" : "Sauvegarder"}
        >
          <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] text-gray-200">
          <span>{article.publishedAt}</span>
        </div>
      </div>

      {/* Horizontal Right Content */}
      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] text-indigo-400 font-semibold">{article.readTime}</span>
          </div>
          <h3 className="font-['Playfair_Display'] text-xs sm:text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h3>
          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        </div>

        <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between mt-2">
          <div className="flex items-center space-x-1.5 truncate">
            <img 
              src={article.author.avatar} 
              alt={article.author.name} 
              className="w-4 h-4 rounded-full object-cover border border-gray-700 flex-shrink-0"
            />
            <span className="text-[10px] font-medium text-gray-400 truncate max-w-[90px]">{article.author.name}</span>
          </div>

          <span className="text-[10px] text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5 flex-shrink-0">
            <span>Lire</span>
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
