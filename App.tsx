import React, { useState, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import LoadingScreen from './components/LoadingScreen';
import { analyzeFashionImage } from './services/geminiService';
import { AppState, AppTab, WardrobeItem, AppTheme } from './types';

const SAMPLE_INSPIRATION = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
  "https://images.unsplash.com/photo-1539109132314-3477524c8d95?w=800&q=80",
  "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=800&q=80",
  "https://images.unsplash.com/photo-1529139572311-0701e821040f?w=800&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
  "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=800&q=80",
];

const STYLIST_TIPS = [
  "Monochrome outfits create an elongated silhouette.",
  "Mix textures like silk and wool for visual interest.",
  "Accessories are the exclamation point of an outfit.",
  "Invest in basics, play with trends.",
  "Confidence is the best thing you can wear."
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedWardrobe = localStorage.getItem('stylelens_wardrobe');
    const savedHistory = localStorage.getItem('stylelens_history');
    const savedTheme = localStorage.getItem('stylelens_theme') as AppTheme || 'light';
    return {
      image: null,
      isLoading: false,
      result: null,
      error: null,
      activeTab: 'search',
      wardrobe: savedWardrobe ? JSON.parse(savedWardrobe) : [],
      history: savedHistory ? JSON.parse(savedHistory) : [],
      theme: savedTheme,
    };
  });

  const [stylistTip, setStylistTip] = useState(STYLIST_TIPS[0]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('stylelens_theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    localStorage.setItem('stylelens_wardrobe', JSON.stringify(state.wardrobe));
    localStorage.setItem('stylelens_history', JSON.stringify(state.history));
  }, [state.wardrobe, state.history]);

  useEffect(() => {
    if (state.isLoading) {
      const interval = setInterval(() => {
        setStylistTip(STYLIST_TIPS[Math.floor(Math.random() * STYLIST_TIPS.length)]);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [state.isLoading]);

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const handleUpload = async (base64: string) => {
    setState(prev => ({ 
      ...prev, 
      activeTab: 'search', 
      image: base64, 
      error: null, 
      result: null,
      history: [base64, ...prev.history.filter(h => h !== base64)].slice(0, 5)
    }));
    
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await analyzeFashionImage(base64);
      setState(prev => ({ ...prev, result, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  };

  const saveToWardrobe = () => {
    if (!state.image || !state.result) return;
    const isAlreadySaved = state.wardrobe.some(item => item.image === state.image);
    if (isAlreadySaved) return;
    const newItem: WardrobeItem = {
      id: Date.now().toString(),
      image: state.image,
      analysis: state.result,
      timestamp: Date.now(),
    };
    setState(prev => ({
      ...prev,
      wardrobe: [newItem, ...prev.wardrobe],
    }));
  };

  const analyzeFromUrl = async (url: string) => {
    setState(prev => ({ ...prev, isLoading: true, activeTab: 'search', image: url }));
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        handleUpload(base64);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setState(prev => ({ ...prev, error: "Image fetch failed.", isLoading: false }));
    }
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden selection:bg-blue-100 dark:selection:bg-blue-900 transition-colors duration-500 bg-[#F9F9F7] dark:bg-[#050505]">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setState(p => ({ ...p, activeTab: 'search' }))}>
            <div className="text-3xl font-black tracking-tighter uppercase leading-none dark:text-white group-hover:italic transition-all">
              Style<span className="text-blue-700 dark:text-blue-500">Lens</span>
            </div>
          </div>
          
          <div className="flex gap-4 md:gap-8 items-center">
            <div className="hidden md:flex bg-gray-50 dark:bg-gray-900 p-1 rounded-full">
              {(['search', 'feed', 'wardrobe'] as AppTab[]).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setState(prev => ({ ...prev, activeTab: tab }))}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    state.activeTab === tab ? 'bg-white dark:bg-gray-800 shadow-sm text-black dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button 
              onClick={toggleTheme}
              className="p-3 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all shadow-sm border border-transparent dark:border-gray-800"
              aria-label="Toggle Theme"
            >
              {state.theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-12 md:pt-20">
        {state.activeTab === 'search' && (
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            <section className="lg:col-span-5 space-y-12">
              <div className="space-y-6">
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] text-gray-900 dark:text-white uppercase">
                  Find the <br />
                  <span className="italic text-blue-700 dark:text-blue-500">Grails.</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg leading-relaxed max-w-sm">
                  Snap a look. Our engine breaks down every layer and finds exactly where to cop it.
                </p>
              </div>

              <div className="space-y-8">
                <ImageUpload 
                  onUpload={handleUpload} 
                  currentImage={state.image} 
                  disabled={state.isLoading} 
                />
                
                {state.history.length > 0 && !state.isLoading && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">Recent Lookups</p>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                      {state.history.map((img, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleUpload(img)}
                          className="flex-shrink-0 w-20 h-20 rounded-3xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all transform hover:scale-105"
                        >
                          <img src={img} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="lg:col-span-7">
              {state.isLoading ? (
                <div className="gallery-card bg-white dark:bg-[#121212] rounded-[48px] p-16 text-center space-y-8 min-h-[500px] flex flex-col justify-center border border-gray-100 dark:border-gray-900">
                  <LoadingScreen />
                  <div className="max-w-xs mx-auto pt-8 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 dark:text-gray-700 mb-2">Stylist Wisdom</p>
                    <p className="text-gray-500 dark:text-gray-400 font-medium italic">"{stylistTip}"</p>
                  </div>
                </div>
              ) : state.result ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
                  <div className="gallery-card bg-white dark:bg-[#121212] rounded-[48px] p-12 space-y-10 border border-gray-100 dark:border-gray-900 shadow-xl shadow-black/5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic dark:text-white">Analysis</h2>
                      </div>
                      <button 
                        onClick={saveToWardrobe}
                        className="flex items-center gap-2 px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full hover:scale-105 transition-all group active:scale-95 shadow-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span className="text-[11px] font-black uppercase tracking-widest">Add to Wardrobe</span>
                      </button>
                    </div>

                    <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">
                      {state.result.text}
                    </div>

                    <div className="pt-10 border-t border-gray-100 dark:border-gray-800">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 dark:text-gray-600 mb-8">Direct Market Match</h3>
                      <div className="grid sm:grid-cols-2 gap-6">
                        {state.result.sources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-6 gallery-card bg-gray-50 dark:bg-black/40 rounded-[32px] group border border-transparent hover:border-blue-500/30"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{new URL(source.uri).hostname.replace('www.', '')}</span>
                              <span className="font-black text-sm uppercase tracking-tight group-hover:text-blue-700 dark:group-hover:text-blue-400 dark:text-white transition-colors line-clamp-1">{source.title}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-all shadow-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="gallery-card bg-white dark:bg-[#121212] rounded-[48px] p-24 text-center border-2 border-dashed border-gray-100 dark:border-gray-900 flex flex-col items-center justify-center opacity-40 hover:opacity-100 transition-opacity min-h-[500px]">
                  <div className="w-32 h-32 mb-10 bg-gray-50 dark:bg-gray-800 rounded-[40px] flex items-center justify-center rotate-3 hover:rotate-0 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 dark:text-gray-600">Visual Engine Standby</p>
                </div>
              )}
            </section>
          </div>
        )}

        {state.activeTab === 'feed' && (
          <div className="space-y-16 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="space-y-2">
                <h2 className="text-6xl font-black uppercase tracking-tighter italic dark:text-white">Curated</h2>
                <p className="text-gray-400 dark:text-gray-500 font-medium">Trending silhouettes from the StyleLens community.</p>
              </div>
              <div className="flex gap-3">
                {['#runway', '#archive', '#vintage'].map(tag => (
                  <span key={tag} className="px-6 py-2 bg-gray-100 dark:bg-gray-900 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all cursor-default">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
              {SAMPLE_INSPIRATION.map((url, i) => (
                <div 
                  key={i} 
                  className="group cursor-pointer space-y-6"
                  onClick={() => analyzeFromUrl(url)}
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-[40px] gallery-card border border-gray-100 dark:border-gray-900 relative shadow-lg">
                    <img src={url} alt="Inspo" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                       <button className="bg-white dark:bg-black text-black dark:text-white text-[11px] font-black uppercase px-10 py-4 rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 active:scale-95">Source Look</button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 dark:text-gray-700">LENS_{i.toString().padStart(3, '0')}</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.activeTab === 'wardrobe' && (
          <div className="space-y-16 animate-in fade-in duration-700">
             <div className="space-y-2">
              <h2 className="text-6xl font-black uppercase tracking-tighter italic dark:text-white">Wardrobe</h2>
              <p className="text-gray-400 dark:text-gray-500 font-medium">Your personal digital closet of curated finds.</p>
            </div>
            
            {state.wardrobe.length === 0 ? (
              <div className="max-w-md mx-auto py-32 text-center space-y-10">
                <div className="w-40 h-40 mx-auto bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-200 dark:text-gray-800">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="space-y-6">
                  <p className="text-gray-900 dark:text-gray-100 font-black uppercase tracking-widest text-base">The archive is empty</p>
                  <button 
                    onClick={() => setState(p => ({ ...p, activeTab: 'search' }))}
                    className="bg-black dark:bg-white text-white dark:text-black px-14 py-5 rounded-full font-black uppercase tracking-[0.3em] text-[11px] hover:shadow-2xl transition-all active:scale-95"
                  >
                    Start Curating
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                {state.wardrobe.map((item) => (
                  <div key={item.id} className="gallery-card bg-white dark:bg-[#121212] rounded-[48px] overflow-hidden group border border-gray-100 dark:border-gray-900 hover:shadow-2xl transition-all">
                    <div className="aspect-[4/5] relative">
                      <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <button 
                        onClick={() => setState(prev => ({ ...prev, wardrobe: prev.wardrobe.filter(w => w.id !== item.id) }))}
                        className="absolute top-8 right-8 p-4 bg-white/20 dark:bg-black/20 backdrop-blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all text-white border border-white/20 shadow-xl"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-12 space-y-8">
                      <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Captured</span>
                        <span className="text-[10px] font-bold text-gray-300 dark:text-gray-700">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 italic font-medium leading-relaxed">"{item.analysis.text.slice(0, 120)}..."</p>
                      <button 
                        onClick={() => setState(prev => ({ ...prev, image: item.image, result: item.analysis, activeTab: 'search' }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-sm"
                      >
                        Full Breakdown
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-60 border-t border-gray-100 dark:border-gray-900 py-40 px-8 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-24">
          <div className="space-y-8">
            <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none dark:text-white">StyleLens</h2>
            <p className="text-gray-400 dark:text-gray-500 text-lg max-w-sm font-medium leading-relaxed">Defining the next generation of visual retail through intelligent grounding.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-20">
            <div className="space-y-6">
              <p className="text-[11px] font-black uppercase tracking-widest dark:text-gray-400">Engine</p>
              <ul className="text-sm font-bold text-gray-400 dark:text-gray-600 space-y-3">
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Neural Search</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Market Grounding</li>
              </ul>
            </div>
            <div className="space-y-6">
              <p className="text-[11px] font-black uppercase tracking-widest dark:text-gray-400">Company</p>
              <ul className="text-sm font-bold text-gray-400 dark:text-gray-600 space-y-3">
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Privacy</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Terms</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-gray-50 dark:border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-300 dark:text-gray-700">
           <span>© 2025 STYLELENS CORP. GEN_02.X</span>
           <span className="hidden md:block">Handcrafted for the high-fashion avant-garde</span>
        </div>
      </footer>
    </div>
  );
};

export default App;