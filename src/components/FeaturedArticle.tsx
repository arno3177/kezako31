import React from 'react';
import { Article } from '../types';
import { Clock, Heart, MessageSquare, ArrowRight, Bookmark, Share2 } from 'lucide-react';

interface FeaturedArticleProps {
  article: Article;
  onReadArticle: (article: Article) => void;
  isSaved: boolean;
  onToggleSave: (articleId: string) => void;
}

export const FeaturedArticle: React.FC<FeaturedArticleProps> = ({
  article,
  onReadArticle,
  isSaved,
  onToggleSave
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#151821] border border-gray-800 shadow-2xl group transition-all duration-500 hover:border-indigo-500/50">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Image side */}
        <div className="lg:col-span-7 relative overflow-hidden min-h-[320px] lg:min-h-[440px]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#151821] via-transparent to-black/30 z-10 lg:hidden"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#151821]/80 z-10 hidden lg:block"></div>
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-4 left-4 z-20">
            <span className="px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/30 backdrop-blur-md">
              À la une • {article.category}
            </span>
          </div>
          <div className="absolute top-4 right-4 z-20 flex space-x-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleSave(article.id); }}
              className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
                isSaved 
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' 
                  : 'bg-black/40 text-white hover:bg-black/60 border border-white/10'
              }`}
              title={isSaved ? "Retirer des favoris" : "Sauvegarder"}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content side */}
        <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={article.author.avatar} 
                alt={article.author.name} 
                className="w-9 h-9 rounded-full object-cover border border-indigo-500/30"
              />
              <div>
                <h4 className="text-xs font-semibold text-gray-200">{article.author.name}</h4>
                <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                  <span>{article.publishedAt}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>

            <h2 
              onClick={() => onReadArticle(article)}
              className="font-['Playfair_Display'] text-2xl lg:text-3xl font-bold text-white mb-3 hover:text-indigo-300 transition-colors cursor-pointer leading-tight"
            >
              {article.title}
            </h2>

            <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-3">
              {article.excerpt}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center space-x-1.5">
                <Heart className="w-4 h-4 text-pink-400" />
                <span>{article.likes}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>{article.commentsCount}</span>
              </span>
            </div>

            <button
              onClick={() => onReadArticle(article)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 text-xs font-semibold transition-all group/btn"
            >
              <span>Lire l'article</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
