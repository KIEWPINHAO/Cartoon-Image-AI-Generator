/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  History, 
  Trash2, 
  Loader2, 
  ArrowRight,
  Maximize2,
  X,
  Info
} from 'lucide-react';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('visionary_history');
    if (saved) {
      try {
        setImages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('visionary_history', JSON.stringify(images));
  }, [images]);

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const rubberHosePrompt = `Create a 1930s rubber hose cartoon style image of: ${prompt}. Characteristics: black and white, high contrast, ink-blot eyes, noodle-like limbs, white gloves, pie-cut eyes, vintage animation aesthetic, grainy film texture.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: rubberHosePrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      let imageUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }

      if (imageUrl) {
        const newImage: GeneratedImage = {
          id: Math.random().toString(36).substring(7),
          url: imageUrl,
          prompt: prompt,
          timestamp: Date.now(),
        };
        setImages(prev => [newImage, ...prev]);
        setPrompt('');
      } else {
        throw new Error("No image data received from the model.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Something went wrong during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const downloadImage = (url: string, filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename.slice(0, 20)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-emerald-500/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight">
              Cartoon<span className="text-emerald-500">.</span>AI 
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setImages([])}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-red-400"
              title="Clear History"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <h2 className="font-display text-4xl font-bold leading-tight">
              <span className="text-emerald-500">Animation</span> Generator
            </h2>
            <p className="text-zinc-400 text-lg">
              Enter any subject to see it reimagined in the iconic 1930s "Rubber Hose" cartoon style.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cat playing a piano, a robot dancing, a detective with a magnifying glass..."
                className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none placeholder:text-zinc-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    generateImage();
                  }
                }}
              />
              <div className="absolute bottom-4 right-4 text-xs text-zinc-500 font-mono">
                CTRL + ENTER TO GENERATE
              </div>
            </div>

            <button
              onClick={generateImage}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all ${
                isGenerating || !prompt.trim()
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Image
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex gap-3"
              >
                <Info className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
          </div>

          <div className="pt-8 border-t border-white/5">
            <div className="flex items-center gap-2 text-zinc-500 mb-4">
              <History className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-wider">Recent Creations</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {images.slice(0, 6).map((img) => (
                <motion.div
                  key={img.id}
                  layoutId={img.id}
                  onClick={() => setSelectedImage(img)}
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-emerald-500/50 transition-all group relative"
                >
                  <img 
                    src={img.url} 
                    alt={img.prompt} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
              ))}
              {images.length === 0 && (
                <div className="col-span-3 h-24 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-zinc-600 text-sm italic">
                  No history yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Main Display */}
        <div className="lg:col-span-7">
          <div className="sticky top-28">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="aspect-square w-full rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-6 overflow-hidden relative"
                >
                  <div className="absolute inset-0 scanline bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent h-1/2 w-full pointer-events-none" />
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <Sparkles className="w-8 h-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-display font-bold">Painting your vision...</p>
                    <p className="text-zinc-500 font-mono text-sm">GEMINI 2.5 FLASH IMAGE</p>
                  </div>
                </motion.div>
              ) : images.length > 0 ? (
                <motion.div
                  key={images[0].id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative aspect-square w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                >
                  <img 
                    src={images[0].url} 
                    alt={images[0].prompt} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                    <p className="text-white text-lg font-medium mb-6 line-clamp-3">
                      "{images[0].prompt}"
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={(e) => downloadImage(images[0].url, images[0].prompt, e)}
                        className="flex-1 py-3 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </button>
                      <button 
                        onClick={() => setSelectedImage(images[0])}
                        className="p-3 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-colors"
                      >
                        <Maximize2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="aspect-square w-full rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-zinc-600 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-medium">Your creation will appear here</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl w-full bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="md:w-2/3 aspect-square">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.prompt} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="md:w-1/3 p-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-2">Prompt</h3>
                    <p className="text-white text-lg leading-relaxed">
                      {selectedImage.prompt}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-2">Created</h3>
                    <p className="text-zinc-300">
                      {new Date(selectedImage.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 pt-8">
                  <button 
                    onClick={(e) => downloadImage(selectedImage.url, selectedImage.prompt, e)}
                    className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download PNG
                  </button>
                  <button 
                    onClick={(e) => {
                      deleteImage(selectedImage.id, e);
                      setSelectedImage(null);
                    }}
                    className="w-full py-4 bg-white/5 text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete Creation
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-8 border-t border-white/5 mt-auto">
        {<div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-sm">
          <p>Created by Pin Hao.</p>
          {/* <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">API Status</a>
          </div> */}
        </div>}
      </footer>
    </div>
  );
}
