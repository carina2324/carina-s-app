import React, { useState, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import LoadingScreen from './components/LoadingScreen';
import { analyzeFashionImage } from './services/geminiService';
import { AppState, AppTab, WardrobeItem } from './types';

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
    return {
      image: null,
      isLoading: false,
      result: null,
      error: null,
      activeTab: 'search',
      wardrobe: savedWardrobe ? JSON.parse(savedWardrobe) : [],
      history: savedHistory ? JSON.parse(savedHistory) : [],
    };
  });

  const [stylistTip, setStylistTip] = useState(STYLIST_TIPS[0]);

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
    if (isAlreadySaved) {
      alert("This look is already in your wardrobe.");
      return;
    }
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
      setState(prev => ({ ...prev, error: "Image fetch failed. Remote source may block direct access.", isLoading: false }));
    }
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden selection:bg-blue-100">
      {/* Premium Header */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setState(p => ({ ...p, activeTab: 'search' }))}>
            <div className="text-3xl font-black tracking-tighter uppercase leading-none">
              Style<span className="text-blue-700">Lens</span>
            </div>
            <div className="h-4 w-[1px] bg-gray-200 hidden md:block"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hidden md:block mt-1">AI Curated Fashion</span>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="flex bg-gray-50 p-1 rounded-full">
              {(['search', 'feed', 'wardrobe'] as AppTab[]).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setState(prev => ({ ...prev, activeTab: tab }))}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    state.activeTab === tab ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-12 md:pt-20">
        {state.activeTab === 'search' && (
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            {/* Control Panel */}
            <section className="lg:col-span-5 space-y-12">
              <div className="space-y-6">
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] text-gray-900">
                  FIND THE <br />
                  <span className="italic">GRAILS.</span>
                </h1>
                <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-sm">
                  The internet's smartest visual engine for sourcing outfits and accessories.
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
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Scans</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                      {state.history.map((img, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleUpload(img)}
                          className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 hover:border-black transition-all"
                        >
                          <img src={img} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Insight Area */}
            <section className="lg:col-span-7">
              {state.isLoading ? (
                <div className="gallery-card rounded-[48px] p-16 text-center space-y-8 min-h-[500px] flex flex-col justify-center">
                  <LoadingScreen />
                  <div className="max-w-xs mx-auto pt-8 border-t border-gray-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-2">Stylist Tip</p>
                    <p className="text-gray-500 font-medium italic">"{stylistTip}"</p>
                  </div>
                </div>
              ) : state.result ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
                  <div className="gallery-card rounded-[48px] p-12 space-y-10">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase italic">Look Breakdown</h2>
                      </div>
                      <button 
                        onClick={saveToWardrobe}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">Collect Fit</span>
                      </button>
                    </div>

                    <div className="prose prose-sm max-w-none text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                      {state.result.text}
                    </div>

                    <div className="pt-10 border-t border-gray-100">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-6">Marketplace Links</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {state.result.sources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-6 gallery-card rounded-3xl group"
                          >
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">{new URL(source.uri).hostname.replace('www.', '')}</span>
                              <span className="font-black text-xs uppercase tracking-tight group-hover:text-blue-700 transition-colors line-clamp-1">{source.title}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white group-hover:border-blue-700 transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="gallery-card rounded-[48px] p-24 text-center border-dashed flex flex-col items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
                  <div className="w-24 h-24 mb-8 bg-gray-50 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Analysis Engine Ready</p>
                </div>
              )}
            </section>
          </div>
        )}

        {state.activeTab === 'feed' && (
          <div className="space-y-16 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="space-y-2">
                <h2 className="text-5xl font-black uppercase tracking-tighter italic">Inspiration</h2>
                <p className="text-gray-400 font-medium">Top global looks trending on StyleLens today.</p>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500">#minimal</span>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500">#streetwear</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
              {SAMPLE_INSPIRATION.map((url, i) => (
                <div 
                  key={i} 
                  className="group cursor-pointer space-y-4"
                  onClick={() => analyzeFromUrl(url)}
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-[32px] gallery-card relative">
                    <img src={url} alt="Inspo" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                       <button className="w-full bg-white text-black text-[10px] font-black uppercase py-4 rounded-2xl shadow-xl">Source This Look</button>
                    </div>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Look {i + 1}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Trending</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.activeTab === 'wardrobe' && (
          <div className="space-y-16 animate-in fade-in duration-500">
             <div className="space-y-2">
              <h2 className="text-5xl font-black uppercase tracking-tighter italic">Personal Closet</h2>
              <p className="text-gray-400 font-medium">Fits you've analyzed and saved for your wishlist.</p>
            </div>
            
            {state.wardrobe.length === 0 ? (
              <div className="max-w-md mx-auto py-32 text-center space-y-8">
                <div className="w-32 h-32 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-900 font-black uppercase tracking-widest text-sm">Your closet is empty</p>
                  <button 
                    onClick={() => setState(p => ({ ...p, activeTab: 'search' }))}
                    className="bg-black text-white px-12 py-5 rounded-full font-black uppercase tracking-[0.2em] text-[10px] hover:shadow-2xl transition-all"
                  >
                    Find a Fit
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                {state.wardrobe.map((item) => (
                  <div key={item.id} className="gallery-card rounded-[40px] overflow-hidden group">
                    <div className="aspect-[4/5] relative">
                      <img src={item.image} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setState(prev => ({ ...prev, wardrobe: prev.wardrobe.filter(w => w.id !== item.id) }))}
                        className="absolute top-6 right-6 p-4 bg-white/10 backdrop-blur-xl rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all text-white border border-white/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-10 space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Analysis Snapshot</span>
                        <span className="text-[9px] font-bold text-gray-300">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 italic font-medium">"{item.analysis.text.slice(0, 100)}..."</p>
                      <button 
                        onClick={() => setState(prev => ({ ...prev, image: item.image, result: item.analysis, activeTab: 'search' }))}
                        className="w-full bg-gray-50 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-black hover:text-white transition-all"
                      >
                        Open Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Corporate Chic Footer */}
      <footer className="mt-40 border-t border-gray-100 py-32 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="space-y-6">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">StyleLens</h2>
            <p className="text-gray-400 text-sm max-w-xs font-medium">The world's most advanced visual shopper. Powered by Gemini, built for the fashion-forward.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest">Platform</p>
              <ul className="text-xs font-bold text-gray-400 space-y-2">
                <li className="hover:text-black cursor-pointer">Visual Engine</li>
                <li className="hover:text-black cursor-pointer">API Access</li>
                <li className="hover:text-black cursor-pointer">Marketplace</li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest">Legal</p>
              <ul className="text-xs font-bold text-gray-400 space-y-2">
                <li className="hover:text-black cursor-pointer">Privacy</li>
                <li className="hover:text-black cursor-pointer">Terms</li>
                <li className="hover:text-black cursor-pointer">Retailers</li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest">Social</p>
              <ul className="text-xs font-bold text-gray-400 space-y-2">
                <li className="hover:text-black cursor-pointer">Instagram</li>
                <li className="hover:text-black cursor-pointer">TikTok</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-gray-50 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-300">
           <span>© 2025 STYLELENS CORP. ALL RIGHTS RESERVED.</span>
           <span className="hidden md:block">Optimized for High-Fashion Retail</span>
        </div>
      </footer>
    </div>
  );
};

export default App;