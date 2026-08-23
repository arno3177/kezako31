import React, { useState } from 'react';
import { Article } from '../types';
import { X, Heart, MessageSquare, Bookmark, Share2, Send, Check } from 'lucide-react';

// Définition locale de l'interface Comment pour éviter toute erreur d'importation
export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
}

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (articleId: string) => void;
  onLike: (articleId: string) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  isSaved,
  onToggleSave,
  onLike
}) => {
  if (!article) return null;

  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'c1',
      author: 'Marc V.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
      content: 'Analyse extrêmement pertinente. Cela pose les bonnes questions pour notre avenir.',
      createdAt: 'Il y a 1 heure'
    },
    {
      id: 'c2',
      author: 'Claire D.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
      content: 'Merci pour cet éclairage de qualité. Hâte de voir la suite des évolutions sur ce sujet.',
      createdAt: 'Il y a 30 minutes'
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Date.now().toString(),
      author: 'Vous (Lecteur)',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80',
      content: newComment,
      createdAt: 'À l’instant'
    };
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLikeClick = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount(prev => prev + 1);
      onLike(article.id);
    } else {
      setLiked(false);
      setLikeCount(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-[#12141c] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Floating Actions / Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#12141c]/95 backdrop-blur-md border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              {article.category}
            </span>
            <span className="text-xs text-gray-400">• {article.readTime}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-medium transition-all"
              title="Copier le lien"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Copié !' : 'Partager'}</span>
            </button>

            <button
              onClick={() => onToggleSave(article.id)}
              className={`p-2 rounded-xl transition-all ${
                isSaved ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30' : 'bg-gray-800/60 text-gray-300 hover:text-white'
              }`}
              title="Favoris"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 md:p-10">
          
          {/* Article Title */}
          <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Author info */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-800">
            <div className="flex items-center space-x-4">
              <img 
                src={article.author.avatar} 
                alt={article.author.name} 
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40 shadow-lg"
              />
              <div>
                <h3 className="font-bold text-sm text-white">{article.author.name}</h3>
                <p className="text-xs text-gray-400">Journaliste & Rédacteur • Publié {article.publishedAt}</p>
              </div>
            </div>

            <button
              onClick={handleLikeClick}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border transition-all ${
                liked 
                  ? 'bg-pink-500/20 border-pink-500 text-pink-400' 
                  : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-pink-500/50'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current text-pink-500' : ''}`} />
              <span className="text-xs font-bold">{likeCount}</span>
            </button>
          </div>

          {/* Article Content (Sans image) */}
          <div className="prose prose-invert max-w-none text-gray-300 space-y-6 text-base md:text-lg leading-relaxed">
            <p className="font-medium text-indigo-200 text-lg md:text-xl leading-relaxed p-4 rounded-2xl bg-indigo-500/10 border-l-4 border-indigo-500">
              {article.excerpt}
            </p>
            {article.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Reactions and tags */}
          <div className="mt-12 pt-6 border-t border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Sujet :</span>
              <span className="px-3 py-1 text-xs bg-gray-800 text-indigo-300 rounded-lg font-medium">#{article.category}</span>
              <span className="px-3 py-1 text-xs bg-gray-800 text-indigo-300 rounded-lg font-medium">#Actualité</span>
            </div>

            <button
              onClick={handleLikeClick}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-pink-600/30 hover:scale-105 transition-all"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>J'aime cet article ({likeCount})</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <div className="flex items-center space-x-3 mb-6">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h3 className="font-['Playfair_Display'] text-2xl font-bold text-white">Commentaires ({comments.length})</h3>
            </div>

            {/* Add comment form */}
            <form onSubmit={handleAddComment} className="mb-8">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Partagez votre avis sur cet article..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-[#181b24] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <span>Publier</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Comments list */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 rounded-2xl bg-[#181b24]/60 border border-gray-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-xs font-bold text-white">{comment.author}</span>
                    </div>
                    <span className="text-[11px] text-gray-500">{comment.createdAt}</span>
                  </div>
                  <p className="text-sm text-gray-300 pl-11">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};