import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Markdown from "react-markdown";
import { Loader2, ArrowLeft, Download } from "lucide-react";
import { AuthContext } from "../AuthContext";

export const LessonGuidePrintView: React.FC = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [guideContent, setGuideContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!topicId) return;
    
    // Explicitly grab the best profile name from User context
    const profileName = (user as any)?.displayName || (user as any)?.name || (user?.email ? user.email.split('@')[0] : "User");
    
    const fetchGuide = async () => {
      try {
        const res = await fetch("/api/ai/lesson-guide", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
          },
          body: JSON.stringify({ 
            topic: decodeURIComponent(topicId),
            userName: profileName,
            userEmail: user?.email || ""
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          setGuideContent(data.guide);
          
          // Save guide context for this specific topic to be injected into future live tutoring sessions
          localStorage.setItem(`lesson_guide_context_${decodeURIComponent(topicId)}`, data.guide);
        } else {
          setGuideContent("Failed to generate guide.");
        }
      } catch (e) {
        setGuideContent("An error occurred generating the guide.");
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [topicId]);

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex flex-col items-center justify-center p-8">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-bold font-display">Generating your customized PDF Lesson Guide...</h2>
        <p className="text-slate-500 mt-2 text-sm text-center max-w-md">Our AI is compiling vocabulary, expressions, and conceptual guides based on exactly what was discussed.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 print:bg-white print:pb-0">
      {/* Controls */}
      <div className="sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm flex items-center justify-between z-50 print:hidden">
        <button onClick={() => navigate('/ai-tutor')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-4 py-2 rounded-xl hover:bg-slate-100 transition">
           <ArrowLeft className="w-5 h-5" /> Go Back
        </button>
        <button 
          onClick={handleDownload} 
          disabled={isDownloading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
        >
           <Download className="w-5 h-5" />
           Download / Print PDF
        </button>
      </div>

      {/* Printable Area */}
      <div className="max-w-3xl mx-auto shadow-xl rounded-2xl mt-8 mb-16 overflow-hidden bg-white print:shadow-none print:mt-0 print:mb-0 print:rounded-none">
        <div ref={printRef} className="pdf-export-container" style={{ position: 'relative', paddingBottom: '32px', minHeight: '800px', backgroundColor: '#ffffff' }}>
          
          <div style={{ position: 'relative', zIndex: 10, padding: '40px', paddingTop: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #000000', paddingBottom: '24px', marginBottom: '32px' }}>
              <div>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '13px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '6px' }}>Spoken Guide App - Lesson Outline</span>
                <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#000000', lineHeight: 1.2, margin: 0 }}>
                  {decodeURIComponent(topicId || "Custom Lesson")}
                </h1>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>
                 {new Date().toLocaleDateString()}<br />
                 SpokenGuide.com
              </div>
            </div>

            <div className="pdf-export-content">
              <Markdown>{guideContent}</Markdown>
            </div>

            <div className="print-footer" style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>Generated automatically by Spoken Guide AI</span>
              <span>Want to study more and practice live? Visit: https://spokenguide.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
