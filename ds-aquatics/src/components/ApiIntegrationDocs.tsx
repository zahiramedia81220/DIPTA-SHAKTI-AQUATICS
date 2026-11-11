import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink, 
  Zap, 
  Cpu, 
  CheckCircle2 
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

export const ApiIntegrationDocs: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `curl -X POST https://your-domain.com/api/generate-master-script \\
  -H "Content-Type: application/json" \\
  -d '{
    "topic": "Revolusi AI dan Cyberpunk City 2088",
    "genre": "Sci-Fi Action",
    "targetDuration": "60 Detik",
    "voiceTypePref": "voiceover_dialog",
    "defaultTone": "cyberpunk",
    "defaultVoice": "Kore",
    "sceneCount": 5
  }'`,
    javascript: `// Node.js / Next.js / Browser Fetch Integration
const response = await fetch('/api/generate-master-script', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'Revolusi AI dan Cyberpunk City 2088',
    genre: 'Sci-Fi Action',
    targetDuration: '60 Detik',
    voiceTypePref: 'voiceover_dialog',
    defaultTone: 'cyberpunk',
    defaultVoice: 'Kore',
    sceneCount: 5
  })
});

const { id, title, scenes, fullSrt, fullJson } = await response.json();
console.log('Master Script Generated:', title);
// Export directly to Premiere / DaVinci Resolve via fullSrt or fullJson!`,
    python: `# Python Automation Pipeline (Premiere / CapCut / Resolve)
import requests

payload = {
    "topic": "Revolusi AI dan Cyberpunk City 2088",
    "genre": "Sci-Fi Action",
    "targetDuration": "60 Detik",
    "voiceTypePref": "voiceover_dialog",
    "defaultTone": "cyberpunk",
    "defaultVoice": "Kore",
    "sceneCount": 5
}

res = requests.post("https://your-domain.com/api/generate-master-script", json=payload)
data = res.json()

# Save SRT file automatically
with open(f"{data['title']}.srt", "w", encoding="utf-8") as f:
    f.write(data["fullSrt"])

print("SRT Subtitle & Storyboard cues ready for video rendering!")`
  };

  const handleCopy = () => {
    copyToClipboard(snippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="api-integration" className="max-w-6xl mx-auto mb-16">
      <div className="cyber-glass rounded-3xl p-6 sm:p-8 lg:p-10 border border-emerald-500/30">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-emerald-500/20">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <Code2 className="w-4 h-4" />
              <span>DOKUMENTASI INTEGRASI API PIHAK KETIGA</span>
            </div>
            <h2 className="font-cyber font-bold text-2xl sm:text-3xl text-white tracking-wide">
              API MODULAR & EFISIEN (REST, JSON, SRT)
            </h2>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Mudah dihubungkan dengan workflow DaVinci Resolve, Adobe Premiere, n8n, Make, atau Webhook custom.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-xs font-mono text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Standard REST v1.0</span>
            </span>
          </div>
        </div>

        {/* Code Snippet Tabs */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveLang('curl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeLang === 'curl'
                    ? 'bg-emerald-950 border border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(0,255,128,0.3)]'
                    : 'bg-slate-900/50 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                cURL CLI
              </button>

              <button
                onClick={() => setActiveLang('javascript')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeLang === 'javascript'
                    ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'bg-slate-900/50 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                JavaScript / Node.js
              </button>

              <button
                onClick={() => setActiveLang('python')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeLang === 'python'
                    ? 'bg-purple-950 border border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(157,0,255,0.3)]'
                    : 'bg-slate-900/50 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Python Automation
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-5 rounded-2xl bg-[#060a14] border border-emerald-500/20 text-xs sm:text-sm font-mono text-emerald-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {snippets[activeLang]}
          </pre>
        </div>

        {/* Feature Specs Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <h4 className="font-mono font-bold text-xs text-white uppercase mb-1">
              Dukungan Format File
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Output SubRip (<code className="text-cyan-300 font-mono">.SRT</code>), Modular JSON (<code className="text-purple-300 font-mono">.JSON</code>), dan Linear Audio (<code className="text-pink-300 font-mono">.WAV</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <h4 className="font-mono font-bold text-xs text-white uppercase mb-1">
              Dual Engine Failover
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Otomatis beralih ke engine cadangan tanpa downtime jika server utama Gemini mengalami lonjakan beban.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <h4 className="font-mono font-bold text-xs text-white uppercase mb-1">
              Cues Visual & Audio Terpadu
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Setiap scene menyertakan instruksi shot kamera untuk ilustrator storyboard dan efek audio untuk sound engineer.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
