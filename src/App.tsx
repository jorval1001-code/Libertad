import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  MessageCircle,
  ThumbsUp,
  Share2,
  Calendar,
  User,
  Clock,
  Send,
  Check,
  Menu,
  X,
  Vote,
  Sparkles,
  Bookmark,
  Landmark,
  BarChart2,
  Lock,
  Heart,
  MapPin
} from 'lucide-react';

// Interfaces
interface Comment {
  id: string;
  author: string;
  avatarColor: string;
  text: string;
  timestamp: string;
  likes: number;
}

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Economía' | 'Política' | 'Comunidad';
  date: string;
  author: string;
  readTime: string;
  likes: number;
  link?: string;
}

interface Poll {
  question: string;
  options: { id: string; text: string; votes: number }[];
}

// Localized Mock Data for LLA Plottier, Neuquén, Argentina
const INITIAL_NEWS: NewsArticle[] = [];

const INITIAL_POLL: Poll = {
  question: '¿Qué iniciativa libertaria para la ciudad de Plottier considera que debería implementarse con mayor urgencia?',
  options: [
    { id: 'opt-1', text: 'Habilitación comercial inmediata digital y costo cero', votes: 840 },
    { id: 'opt-2', text: 'Auditoría externa del gasto y reducción de cargos políticos', votes: 1210 },
    { id: 'opt-3', text: 'Reducción drástica de tasas de alumbrado y limpieza', votes: 650 },
    { id: 'opt-4', text: 'Fomento a la competencia del transporte y libertad de rutas', votes: 410 }
  ]
};

// Secondary Pine Tree (Pino) Logo representing Neuquén / Plottier LLA branch
function PineLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={className} 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M100 25 C115 40, 130 50, 145 55 C130 65, 115 70, 100 72 C85 70, 70 65, 55 55 C70 50, 85 40, 100 25 Z" />
      <path d="M100 45 C120 60, 145 65, 175 70 C150 82, 125 85, 100 86 C75 85, 50 82, 25 70 C55 65, 80 60, 100 45 Z" />
      <path d="M100 65 C125 80, 155 83, 185 92 C155 102, 125 105, 100 106 C75 105, 45 102, 15 92 C45 83, 75 80, 100 65 Z" />
      <path d="M100 85 C120 100, 140 105, 165 115 C140 125, 120 128, 100 128 C80 128, 60 125, 35 115 C60 105, 80 100, 100 85 Z" />
      <path d="M100 108 C105 112, 112 118, 116 126 C114 128, 108 132, 104 135 C101 131, 99 125, 100 108 Z" />
      <path d="M100 125 C104 125, 108 128, 112 133 C108 135, 105 137, 100 138 C97 137, 95 133, 100 125 Z" />
      <path d="M100 130 L115 155 L108 160 L100 152 L92 160 L85 155 Z" />
      <path d="M45 145 Q100 185 155 145 Q100 170 45 145 Z" />
    </svg>
  );
}

export default function App() {
  const [news, setNews] = useState<NewsArticle[]>(INITIAL_NEWS);
  const [selectedNewsId, setSelectedNewsId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [isSavedOnly, setIsSavedOnly] = useState<boolean>(false);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<string>('');
  const [commentAuthor, setCommentAuthor] = useState<string>(() => {
    return localStorage.getItem('lla_comment_author') || '';
  });
  
  // Guardadas list state
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('lla_saved_articles');
    return saved ? JSON.parse(saved) : [];
  });

  // Poll state
  const [poll, setPoll] = useState<Poll>(INITIAL_POLL);
  const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(null);

  // App notification state
  const [notification, setNotification] = useState<string | null>(null);

  // Mobile menu toggle state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // News fetch state
  const [isFetchingNews, setIsFetchingNews] = useState<boolean>(false);

  const fetchPartyNews = async () => {
    setIsFetchingNews(true);
    try {
      const res = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://lalibertadavanza.com.ar/feed/'
      );
      const data = await res.json();
      if (data.status === 'ok' && data.items?.length > 0) {
        const articles: NewsArticle[] = data.items.map((item: any) => ({
          id: item.guid || item.link,
          title: item.title,
          excerpt: item.description?.replace(/<[^>]*>/g, '').slice(0, 220) + '...',
          content: (item.content || item.description || '').replace(/<[^>]*>/g, ''),
          category: 'Política' as const,
          date: new Date(item.pubDate).toISOString().split('T')[0],
          author: item.author || 'La Libertad Avanza',
          readTime: '3 min',
          likes: 0,
          link: item.link
        }));
        setNews(articles);
        setSelectedNewsId(articles[0].id);
        showToast('Noticias cargadas correctamente. 🦁');
      } else {
        showToast('No se encontraron noticias en este momento.');
      }
    } catch {
      showToast('Error al cargar noticias. Revisá tu conexión.');
    } finally {
      setIsFetchingNews(false);
    }
  };

  const [isFetchingLaNacion, setIsFetchingLaNacion] = useState<boolean>(false);

  const fetchLaNacionNews = async () => {
    setIsFetchingLaNacion(true);
    try {
      const res = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://www.lanacion.com.ar/arc/outboundfeeds/rss/'
      );
      const data = await res.json();
      if (data.status === 'ok' && data.items?.length > 0) {
        const articles: NewsArticle[] = data.items.map((item: any) => ({
          id: item.guid || item.link,
          title: item.title,
          excerpt: item.description?.replace(/<[^>]*>/g, '').slice(0, 220) + '...',
          content: (item.content || item.description || '').replace(/<[^>]*>/g, ''),
          category: 'Política' as const,
          date: new Date(item.pubDate).toISOString().split('T')[0],
          author: item.author || 'La Nación',
          readTime: '3 min',
          likes: 0,
          link: item.link
        }));
        setNews(articles);
        setSelectedNewsId(articles[0].id);
        showToast('Noticias de La Nación cargadas. 📰');
      } else {
        showToast('No se encontraron noticias en este momento.');
      }
    } catch {
      showToast('Error al cargar noticias. Revisá tu conexión.');
    } finally {
      setIsFetchingLaNacion(false);
    }
  };

  // Fiscal form modal state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isAfiliadoFormOpen, setIsAfiliadoFormOpen] = useState<boolean>(false);
  const [afiliadoData, setAfiliadoData] = useState({
    nombre: '', apellido: '', edad: '', sexo: '',
    dni: '', provincia: '', municipio: '', barrio: '',
    email: '', celular: ''
  });
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', fechaNacimiento: '', sexo: '',
    dni: '', ciudad: '', municipio: '', barrio: '',
    email: '', celular: '', quiereAfiliarse: false
  });

  // Load comments & polls from localStorage on component mount
  useEffect(() => {
    const savedComments = localStorage.getItem('lla_plottier_comments');
    if (savedComments) {
      try {
        setComments(JSON.parse(savedComments));
      } catch (e) {
        console.error('Error loading comments', e);
      }
    } else {
      // Seed initial comments including Marisa's request-specific comment
      const initialSeed: Record<string, Comment[]> = {
        'plottier-habilitacion-express': [
          {
            id: 'c-marisa',
            author: 'Marisa G.',
            avatarColor: 'from-purple-500 to-indigo-600',
            text: '¡Gran noticia! ¡VLLC! 🦁',
            timestamp: 'Hace 1m',
            likes: 42
          },
          {
            id: 'c1',
            author: 'Laura_Plottier',
            avatarColor: 'from-purple-500 to-indigo-600',
            text: 'Excelente proyecto. Tengo un pequeño taller de costura en el barrio Los Hornos y las tasas de habilitación actuales son ridículas. ¡Necesitamos esto urgente!',
            timestamp: 'Hace 2 horas',
            likes: 38
          },
          {
            id: 'c2',
            author: 'Mariano_V',
            avatarColor: 'from-fuchsia-500 to-pink-600',
            text: 'Menos burocracia municipal es sinónimo de progreso libre. Plottier tiene un potencial gigante si dejamos trabajar a la gente en paz.',
            timestamp: 'Hace 45 minutos',
            likes: 21
          }
        ],
        'superavit-local-plottier': [
          {
            id: 'c3',
            author: 'Carlos Alberdi',
            avatarColor: 'from-violet-600 to-blue-700',
            text: 'La casta municipal de Plottier tiene que entender que el déficit cero nacional también debe ser norma acá. Menos gasto político y más asfalto e iluminación.',
            timestamp: 'Hace 1 día',
            likes: 45
          }
        ]
      };
      setComments(initialSeed);
      localStorage.setItem('lla_plottier_comments', JSON.stringify(initialSeed));
    }

    const savedPollVote = localStorage.getItem('lla_plottier_user_vote');
    if (savedPollVote) {
      setUserVotedOptionId(savedPollVote);
    }

    const savedPollState = localStorage.getItem('lla_plottier_poll_state');
    if (savedPollState) {
      try {
        setPoll(JSON.parse(savedPollState));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save comments wrapper
  const saveCommentsToStorage = (updatedComments: Record<string, Comment[]>) => {
    setComments(updatedComments);
    localStorage.setItem('lla_plottier_comments', JSON.stringify(updatedComments));
  };

  // Toast notifier
  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Like article action
  const handleLikeArticle = (id: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    
    // Check if liked in this session
    const key = `liked_art_${id}`;
    if (sessionStorage.getItem(key)) {
      showToast('Ya has apoyado este artículo.');
      return;
    }

    const updatedNews = news.map((art) => {
      if (art.id === id) {
        return { ...art, likes: art.likes + 1 };
      }
      return art;
    });

    setNews(updatedNews);
    sessionStorage.setItem(key, 'true');
    showToast('¡Artículo apoyado! 👍 🦁');
  };

  // Bookmark / Save article action
  const toggleSaveArticle = (id: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    const updated = savedArticleIds.includes(id)
      ? savedArticleIds.filter(artId => artId !== id)
      : [...savedArticleIds, id];
    setSavedArticleIds(updated);
    localStorage.setItem('lla_saved_articles', JSON.stringify(updated));
    showToast(savedArticleIds.includes(id) ? 'Artículo quitado de guardados. 🔖' : '¡Artículo guardado con éxito! 🔖');
  };

  // Add Comment action (Posts in real-time as logged-in user Marisa G.)
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    const activeId = selectedNewsId;
    if (!commentText.trim()) {
      showToast('Por favor, ingresa el contenido de tu comentario.');
      return;
    }

    const authorName = commentAuthor.trim() || 'Anónimo';
    localStorage.setItem('lla_comment_author', authorName);

    const newComment: Comment = {
      id: Date.now().toString(),
      author: authorName,
      avatarColor: 'from-purple-500 to-indigo-600',
      text: commentText.trim(),
      timestamp: 'Recién',
      likes: 0
    };

    const newsComments = comments[activeId] || [];
    const updatedComments = {
      ...comments,
      [activeId]: [newComment, ...newsComments]
    };

    saveCommentsToStorage(updatedComments);
    setCommentText('');
    showToast('¡Comentario publicado en tiempo real! 💬');
  };

  // Vote in interactive poll
  const handleVotePoll = (optionId: string) => {
    if (userVotedOptionId) {
      showToast('Ya has registrado tu voto en esta encuesta municipal.');
      return;
    }

    const updatedOptions = poll.options.map((opt) => {
      if (opt.id === optionId) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    const updatedPoll = { ...poll, options: updatedOptions };
    setPoll(updatedPoll);
    setUserVotedOptionId(optionId);
    localStorage.setItem('lla_plottier_user_vote', optionId);
    localStorage.setItem('lla_plottier_poll_state', JSON.stringify(updatedPoll));
    showToast('¡Voto registrado! Impulsando las ideas en Plottier. 🦁');
  };

  // Like comment action
  const handleLikeComment = (articleId: string, commentId: string) => {
    const key = `liked_cmt_${commentId}`;
    if (sessionStorage.getItem(key)) {
      showToast('Ya apoyaste este comentario.');
      return;
    }

    const updatedArticleComments = (comments[articleId] || []).map((c) =>
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    );
    saveCommentsToStorage({ ...comments, [articleId]: updatedArticleComments });
    sessionStorage.setItem(key, 'true');
  };

  // Share article action
  const handleShareArticle = (article: NewsArticle, event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/noticias/${article.id}`);
    showToast('¡Enlace copiado al portapapeles! Comparte la libertad. 🔗');
  };

  // Filtering news based on Sidebar Active Tab Selection
  const filteredNews = news.filter((art) => {
    if (isSavedOnly) {
      return savedArticleIds.includes(art.id);
    }
    if (activeCategory === 'Todas') return true;
    return art.category === activeCategory;
  });

  // Active News Article displaying inside the main Container Card
  const activeArticle = news.find(art => art.id === selectedNewsId) || filteredNews[0] || news[0];
  const activeArticleComments = comments[activeArticle?.id] || [];

  // Calculate total poll votes
  const totalPollVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C0F62] via-[#5030A0] to-[#7A58BE] text-slate-100 flex flex-col font-sans antialiased selection:bg-purple-600/30 selection:text-purple-200">

      {/* LOGO BANNER FULL WIDTH */}
      <div className="w-full relative overflow-hidden flex justify-center items-center">
        <img
          src="/Plottier.png"
          alt="Plottier"
          className="absolute inset-0 w-full h-full object-cover object-[center_70%]"
        />
        <div className="absolute inset-0 bg-black/40" />
        <img
          src="/Libertad.png"
          alt="Logo La Libertad Avanza"
          className="relative z-10 w-1/2 h-auto object-contain translate-y-16"
          style={{ filter: 'invert(1) drop-shadow(0 2px 12px rgba(0,0,0,0.5))' }}
        />
      </div>
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-16 right-6 z-50 bg-[#1E0A48] border border-purple-500/40 text-slate-100 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in text-sm backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* HORIZONTAL MAIN WRAPPER: Sidebar + Central Panel */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* MOBILE HEADER FOR SIDEBAR TOGGLE */}
        <div className="lg:hidden bg-[#1E0A48] border-b border-purple-950/40 p-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <img
              src="/Libertad.png"
              alt="Logo LLA"
              className="h-8 w-auto object-contain invert mix-blend-screen"
            />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-purple-950/50 border border-purple-800/40 text-slate-200 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* MOBILE SIDEBAR BLACK OVERLAY */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* 1. LEFT SIDEBAR (BARRA DE NAVEGACIÓN) */}
        <aside 
          className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 lg:z-10 w-80 bg-[#1E0A48] flex flex-col justify-between transform transition-transform duration-300 ease-in-out border-r border-purple-950/20 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >

          {/* Navigation vertical menu */}
          <nav className="flex-1 px-4 py-6 space-y-2.5">
            <button
              onClick={() => {
                setActiveCategory('Todas');
                setIsSavedOnly(false);
                setIsMobileMenuOpen(false);
                fetchPartyNews();
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                activeCategory === 'Todas' && !isSavedOnly
                  ? 'bg-white/10 text-white font-bold border border-white/15 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {isFetchingNews
                ? <span className="w-5 h-5 rounded-full border-2 border-purple-300 border-t-transparent animate-spin shrink-0" />
                : <Newspaper className="w-5 h-5 text-purple-300" />
              }
              <span>{isFetchingNews ? 'Cargando...' : 'Noticias de nuestro partido'}</span>
            </button>

            <button
              onClick={() => {
                setActiveCategory('Todas');
                setIsSavedOnly(false);
                setIsMobileMenuOpen(false);
                fetchLaNacionNews();
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {isFetchingLaNacion
                ? <span className="w-5 h-5 rounded-full border-2 border-purple-300 border-t-transparent animate-spin shrink-0" />
                : <Newspaper className="w-5 h-5 text-purple-300" />
              }
              <span>{isFetchingLaNacion ? 'Cargando...' : 'Noticias de hoy'}</span>
            </button>

          </nav>

        </aside>

        {/* 2. CENTRAL PANEL (CONTENIDO PRINCIPAL) */}
        <main className="flex-1 bg-black/10 backdrop-blur-3xl flex flex-col">
          

          {/* Central Grid Content */}
          <div className="p-6 lg:p-8 flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
            
            {/* Left 2 Columns inside central panel: Main Active Article */}
            <div className="xl:col-span-2 space-y-8">
              
              {filteredNews.length === 0 ? (
                <div className="space-y-6">
                  {/* Card Fiscales */}
                  <div className="bg-[#1A0B3C] border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] rounded-3xl p-10 flex flex-col items-center text-center space-y-5">
                    <div className="p-4 rounded-full bg-purple-600/20 border border-purple-500/30">
                      <Vote className="w-10 h-10 text-purple-300" />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase leading-tight">
                        SUMATE A NUESTRO EQUIPO DE FISCALES
                      </h2>
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
                        En cada escuela hay una batalla por la libertad. Sumate como fiscal y asegurá que cada voto cuente.
                      </p>
                      <p className="text-purple-300 font-bold text-base sm:text-lg">
                        ¡Salí a defender las urnas!
                      </p>
                    </div>
                    <button
                      onClick={() => setIsFormOpen(true)}
                      className="mt-2 px-8 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm tracking-wider uppercase transition-all shadow-lg shadow-purple-900/40"
                    >
                      Ver más
                    </button>
                  </div>

                  {/* Card Afiliación */}
                  <div className="bg-[#1A0B3C] border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] rounded-3xl p-10 flex flex-col items-center text-center space-y-5">
                    <div className="p-4 rounded-full bg-purple-600/20 border border-purple-500/30">
                      <Heart className="w-10 h-10 text-purple-300" />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase leading-tight">
                        AFILIATE AL PARTIDO DE LA LIBERTAD
                      </h2>
                      <p className="text-purple-300 font-bold text-base sm:text-lg">
                        ¡Protegé tu Libertad!
                      </p>
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
                        Ayudanos a cambiar esta realidad.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAfiliadoFormOpen(true)}
                      className="mt-2 px-8 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm tracking-wider uppercase transition-all shadow-lg shadow-purple-900/40"
                    >
                      Ver más
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Article Container with very rounded corners and purple neon borders */}
                  <article className="bg-[#130830] border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.12)] rounded-[2.2rem] overflow-hidden p-6 sm:p-8 space-y-6">
                    
                    <div className="space-y-2">
                      <span className="text-[11px] font-black tracking-widest text-purple-400 uppercase">
                        ÚLTIMAS NOTICIAS DE LA LIBERTAD AVANZA
                      </span>
                      
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                        {activeArticle.title}
                      </h2>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="font-extrabold text-purple-300 uppercase tracking-widest bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/25">
                          {activeArticle.category}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {activeArticle.date}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">Por: <strong>{activeArticle.author}</strong></span>
                      </div>
                    </div>

                    {/* Article Image (High-quality modern city layout with sutil touches of LLA branding) */}
                    <div className="relative rounded-2xl overflow-hidden aspect-video border border-purple-950/40">
                      <img 
                        src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=1000" 
                        alt="Plottier y el Futuro Libre" 
                        className="w-full h-full object-cover filter brightness-90 contrast-[1.05]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                      
                      {/* Interactive Save and Share Actions overlayed on the image */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                          onClick={(e) => toggleSaveArticle(activeArticle.id, e)}
                          className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${
                            savedArticleIds.includes(activeArticle.id)
                              ? 'bg-purple-600/90 border-purple-400 text-white shadow-lg'
                              : 'bg-[#160840]/80 border-white/10 text-slate-300 hover:text-white hover:bg-purple-900/40'
                          }`}
                          title="Guardar Artículo"
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleShareArticle(activeArticle, e)}
                          className="p-2.5 rounded-xl bg-[#160840]/80 border border-white/10 text-slate-300 hover:text-white hover:bg-purple-900/40 backdrop-blur-md transition-all"
                          title="Copiar Enlace"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Floating Watermark Branding logo inside image */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PineLogo className="w-8 h-8 text-white/40 filter drop-shadow" />
                          <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase font-mono">
                            LLA PLOTTIER PROGRESO
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-white/30">VIVA LA LIBERTAD CARAJO</span>
                      </div>
                    </div>

                    {/* Article Content / Body in light gray */}
                    <div className="text-slate-300 leading-relaxed text-sm sm:text-base space-y-4 pt-2">
                      {activeArticle.content.split('\n\n').map((para, i) => (
                        <p key={i} className="whitespace-pre-wrap">
                          {para}
                        </p>
                      ))}
                    </div>

                    {/* Article footer */}
                    <div className="border-t border-purple-950/30 pt-4 flex items-center justify-between text-xs gap-3 flex-wrap">
                      <span className="text-slate-400 font-mono">Tiempo estimado de lectura: {activeArticle.readTime}</span>
                      <div className="flex items-center gap-2">
                        {activeArticle.link && (
                          <a
                            href={activeArticle.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-xs font-bold text-purple-300 hover:bg-purple-600/30 transition-all"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Leer nota completa</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleLikeArticle(activeArticle.id)}
                          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs font-bold text-slate-200 hover:bg-purple-900/30 transition-all"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-purple-400" />
                          <span>Apoyar ({activeArticle.likes})</span>
                        </button>
                      </div>
                    </div>

                  </article>

                  {/* COMMENTS SECTION */}
                  <div className="bg-[#130830] border border-purple-950/40 rounded-[2.2rem] p-6 sm:p-8 space-y-6">
                    <div className="border-b border-purple-950/20 pb-4">
                      <h3 className="text-lg font-bold tracking-tight text-white font-sans flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-purple-400" />
                        <span>Comentarios de Usuarios</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Intercambio de opiniones en base al respeto y las ideas libres</p>
                    </div>

                    {/* Interactive Comments List */}
                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
                      {activeArticleComments.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-500 italic">
                          No hay comentarios en este artículo. ¡Sé el primero en dejar tu opinión!
                        </div>
                      ) : (
                        activeArticleComments.map((comment) => (
                          <div 
                            key={comment.id}
                            className="p-4 rounded-2xl bg-[#1A0B3C]/70 border border-purple-950/20 flex items-start gap-3"
                          >
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${comment.avatarColor} flex items-center justify-center text-white font-black text-xs shrink-0 shadow`}>
                              {comment.author.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-bold text-slate-200">{comment.author}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{comment.timestamp}</span>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words">{comment.text}</p>
                              <div className="flex justify-end pt-1">
                                <button
                                  onClick={() => handleLikeComment(activeArticle.id, comment.id)}
                                  className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${
                                    sessionStorage.getItem(`liked_cmt_${comment.id}`)
                                      ? 'text-pink-400 cursor-default'
                                      : 'text-slate-500 hover:text-pink-400'
                                  }`}
                                  title="Me gusta"
                                >
                                  <Heart className="w-3 h-3" />
                                  <span>{comment.likes}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Comment Entry Form */}
                    <form onSubmit={handleAddComment} className="mt-4 space-y-2">
                      <input
                        type="text"
                        placeholder="Tu nombre (opcional)..."
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                        className="w-full bg-[#1A0B3C] border border-purple-950/60 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 font-sans"
                      />
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder="Dejar un comentario para la comunidad..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="w-full bg-[#1A0B3C] border border-purple-950/60 rounded-2xl pl-4 pr-12 py-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 font-sans"
                        />
                        <button
                          type="submit"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shrink-0"
                          title="Enviar Comentario"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}

            </div>

            {/* Right 1 Column inside central panel: Side Feeds & Interactive Poll */}
            <div className="xl:col-span-1 space-y-8">
              

              {/* WEEKLY POLL CARD */}
              <div className="bg-[#130830] border border-purple-950/50 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-950/20 pb-3">
                  <div className="p-1.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Vote className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black tracking-wider text-white uppercase">Encuesta Plottier</h3>
                </div>

                <p className="text-xs font-bold text-slate-200 leading-snug">
                  {poll.question}
                </p>

                <div className="space-y-2.5">
                  {poll.options.map((opt) => {
                    const percentage = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;
                    const isSelected = userVotedOptionId === opt.id;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleVotePoll(opt.id)}
                        className={`w-full text-left relative p-3 rounded-xl border text-xs font-bold flex flex-col gap-1 transition-all ${
                          userVotedOptionId
                            ? isSelected
                              ? 'border-purple-400 bg-purple-600/10'
                              : 'border-purple-950/40 bg-purple-950/10 cursor-default'
                            : 'border-purple-950 hover:border-purple-500/30 bg-[#180938] hover:bg-purple-950/20'
                        }`}
                      >
                        {userVotedOptionId && (
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-purple-500/10 rounded-xl transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        )}

                        <div className="flex justify-between items-center gap-3 relative z-10 w-full">
                          <span className={`${isSelected ? 'text-purple-300 font-extrabold' : 'text-slate-300'}`}>{opt.text}</span>
                          {userVotedOptionId && (
                            <span className="font-mono text-purple-300 shrink-0">{percentage}%</span>
                          )}
                        </div>
                        {userVotedOptionId && (
                          <span className="text-[9px] text-slate-500 font-mono relative z-10">
                            {opt.votes.toLocaleString()} votos registrados
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {userVotedOptionId ? (
                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center text-[10px] text-purple-300 font-extrabold flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>PARTICIPACIÓN ANÓNIMA REGISTRADA</span>
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-500 text-center font-medium">
                    La participación es voluntaria y 100% anónima.
                  </p>
                )}
              </div>


            </div>

          </div>

        </main>

      </div>

      {/* FOOTER */}
      <footer className="bg-[#0E0625] border-t border-purple-950/40 pt-10 pb-6 px-6 z-10">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Logo + columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

            {/* Logo */}
            <div className="flex flex-col items-start gap-4">
              <img
                src="/Libertad.png"
                alt="Logo La Libertad Avanza"
                className="w-40 h-auto object-contain invert mix-blend-screen"
              />
              <a
                href="https://www.google.com/maps/search/Av.+Belgrano+y+Quillen+Plottier"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
              >
                <MapPin className="w-4 h-4 text-purple-400 group-hover:text-purple-300 shrink-0 mt-0.5" />
                <span>Nuestra sede en<br /><strong className="text-slate-300">Av. Belgrano y Quillen — Plottier</strong></span>
              </a>
            </div>

            {/* Columna navegación */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-purple-300 uppercase tracking-widest mb-3">Navegación</h4>
              {['Sobre Nosotros', 'Principios', 'Galería', 'Sumate'].map(item => (
                <p key={item}>
                  <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{item}</a>
                </p>
              ))}
            </div>

            {/* Columna legal */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-purple-300 uppercase tracking-widest mb-3">Información Legal</h4>
              {['Contacto', 'Términos de uso', 'Política de privacidad'].map(item => (
                <p key={item}>
                  <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{item}</a>
                </p>
              ))}
              <p>
                <button className="text-sm text-purple-400 hover:text-purple-200 transition-colors underline underline-offset-2">
                  Botón de arrepentimiento
                </button>
              </p>
            </div>

          </div>

          {/* Copyright */}
          <div className="border-t border-purple-950/40 pt-5 text-center text-xs text-slate-500">
            © 2026 La Libertad Avanza. Todos los derechos reservados.
          </div>

        </div>
      </footer>

      {/* MODAL FORMULARIO FISCAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1A0B3C] border border-purple-500/30 rounded-3xl shadow-2xl p-8 space-y-6">

            {/* Cerrar */}
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-purple-950/50 hover:bg-purple-800/40 text-slate-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Encabezado */}
            <div className="space-y-2 pr-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Fiscalizá en Plottier
              </h2>
              <p className="text-sm text-purple-200 font-semibold">
                ¡Javier y Karina Milei nos necesitan! La batalla cultural continúa y cada voto cuenta.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sumate como fiscal para defender el futuro de la Patria y asegurar la victoria en Neuquén.
              </p>
            </div>

            {/* Formulario */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('¡Formulario enviado! Nos pondremos en contacto. 🦁');
                setIsFormOpen(false);
                setFormData({ nombre: '', apellido: '', fechaNacimiento: '', sexo: '', dni: '', ciudad: '', municipio: '', barrio: '', email: '', celular: '', quiereAfiliarse: false });
              }}
              className="space-y-4"
            >
              {/* Fila nombre / apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nombre</label>
                  <input type="text" placeholder="Nombre" value={formData.nombre}
                    onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Apellido</label>
                  <input type="text" placeholder="Apellido" value={formData.apellido}
                    onChange={e => setFormData(p => ({ ...p, apellido: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              {/* Fila fecha / sexo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fecha de nacimiento</label>
                  <input type="text" placeholder="dd/mm/aaaa" value={formData.fechaNacimiento}
                    onChange={e => setFormData(p => ({ ...p, fechaNacimiento: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sexo</label>
                  <select value={formData.sexo}
                    onChange={e => setFormData(p => ({ ...p, sexo: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  >
                    <option value="" disabled>Sexo</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>

              {/* DNI */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">DNI</label>
                <input type="text" placeholder="DNI" value={formData.dni}
                  onChange={e => setFormData(p => ({ ...p, dni: e.target.value }))}
                  className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                />
              </div>

              {/* Ciudad / Municipio / Barrio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ciudad</label>
                  <input type="text" placeholder="Ciudad" value={formData.ciudad}
                    onChange={e => setFormData(p => ({ ...p, ciudad: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Municipio</label>
                  <input type="text" placeholder="Municipio" value={formData.municipio}
                    onChange={e => setFormData(p => ({ ...p, municipio: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Barrio</label>
                  <input type="text" placeholder="Barrio" value={formData.barrio}
                    onChange={e => setFormData(p => ({ ...p, barrio: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              {/* Email / Celular */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email</label>
                  <input type="email" placeholder="Email" value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Celular</label>
                  <input type="tel" placeholder="Celular" value={formData.celular}
                    onChange={e => setFormData(p => ({ ...p, celular: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              {/* Checkbox afiliación */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={formData.quiereAfiliarse}
                  onChange={e => setFormData(p => ({ ...p, quiereAfiliarse: e.target.checked }))}
                  className="w-4 h-4 rounded accent-purple-500"
                />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  Quiero afiliarme a La Libertad Avanza
                </span>
              </label>

              {/* Submit */}
              <button type="submit"
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm tracking-wider uppercase transition-all shadow-lg shadow-purple-900/40"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORMULARIO AFILIACIÓN */}
      {isAfiliadoFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1A0B3C] border border-purple-500/30 rounded-3xl shadow-2xl p-8 space-y-6">

            <button
              onClick={() => setIsAfiliadoFormOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-purple-950/50 hover:bg-purple-800/40 text-slate-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 pr-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Afiliate al Partido de la Libertad
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                El Presidente Javier Milei te necesita para terminar con la casta.
              </p>
              <p className="text-purple-300 font-bold text-base">Sumate</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('¡Afiliación enviada! Bienvenido a La Libertad Avanza. 🦁');
                setIsAfiliadoFormOpen(false);
                setAfiliadoData({ nombre: '', apellido: '', edad: '', sexo: '', dni: '', provincia: '', municipio: '', barrio: '', email: '', celular: '' });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nombre</label>
                  <input type="text" placeholder="Nombre" value={afiliadoData.nombre}
                    onChange={e => setAfiliadoData(p => ({ ...p, nombre: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Apellido</label>
                  <input type="text" placeholder="Apellido" value={afiliadoData.apellido}
                    onChange={e => setAfiliadoData(p => ({ ...p, apellido: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Edad</label>
                  <input type="number" placeholder="Edad" value={afiliadoData.edad}
                    onChange={e => setAfiliadoData(p => ({ ...p, edad: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sexo</label>
                  <select value={afiliadoData.sexo}
                    onChange={e => setAfiliadoData(p => ({ ...p, sexo: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  >
                    <option value="" disabled>Sexo</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">DNI</label>
                <input type="text" placeholder="DNI" value={afiliadoData.dni}
                  onChange={e => setAfiliadoData(p => ({ ...p, dni: e.target.value }))}
                  className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Provincia</label>
                  <input type="text" placeholder="Provincia" value={afiliadoData.provincia}
                    onChange={e => setAfiliadoData(p => ({ ...p, provincia: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Municipio</label>
                  <input type="text" placeholder="Municipio" value={afiliadoData.municipio}
                    onChange={e => setAfiliadoData(p => ({ ...p, municipio: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Barrio</label>
                  <input type="text" placeholder="Barrio" value={afiliadoData.barrio}
                    onChange={e => setAfiliadoData(p => ({ ...p, barrio: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email</label>
                  <input type="email" placeholder="Email" value={afiliadoData.email}
                    onChange={e => setAfiliadoData(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Celular</label>
                  <input type="tel" placeholder="Celular" value={afiliadoData.celular}
                    onChange={e => setAfiliadoData(p => ({ ...p, celular: e.target.value }))}
                    className="w-full bg-[#130830] border border-purple-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <button type="submit"
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm tracking-wider uppercase transition-all shadow-lg shadow-purple-900/40"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
