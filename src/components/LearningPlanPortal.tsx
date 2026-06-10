import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Download, GraduationCap, Map, Target, CalendarDays, CheckCircle2, AlertTriangle, BookOpen, Clock, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const LearningPlanPortal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(location.state?.plan);
  const [loading, setLoading] = useState(!location.state?.plan);
  const printRef = useRef<HTMLDivElement>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isAlreadyConverted, setIsAlreadyConverted] = useState(false);

  React.useEffect(() => {
    const checkConversionStatus = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        const res = await fetch('/api/user/course', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.course) {
          setIsAlreadyConverted(data.course.isConverted === 1);
        }
      } catch (e) {
        console.error("Error checking conversion status:", e);
      }
    };
    checkConversionStatus();
  }, []);

  React.useEffect(() => {
    if (!plan) {
      const fetchStoredPlan = async () => {
        try {
          const token = localStorage.getItem('auth_token');
          if (!token) {
            setLoading(false);
            return;
          }
          const res = await fetch('/api/user/course', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (data.course) {
            const reconstructed = {
              cefrLevel: data.course.cefrLevel,
              overallScore: data.course.overallScore,
              grammarScore: data.course.grammarScore,
              vocabularyScore: data.course.vocabularyScore,
              fluencyScore: data.course.fluencyScore,
              pronunciationScore: data.course.pronunciationScore,
              confidenceScore: data.course.confidenceScore,
              sentenceStructureScore: data.course.sentenceStructureScore,
              commonGrammarMistakes: typeof data.course.commonGrammarMistakes === 'string' && data.course.commonGrammarMistakes.startsWith('[') ? JSON.parse(data.course.commonGrammarMistakes) : data.course.commonGrammarMistakes,
              vocabularyGaps: typeof data.course.vocabularyGaps === 'string' && data.course.vocabularyGaps.startsWith('[') ? JSON.parse(data.course.vocabularyGaps) : data.course.vocabularyGaps,
              strengths: typeof data.course.strengths === 'string' && data.course.strengths.startsWith('[') ? JSON.parse(data.course.strengths) : data.course.strengths,
              weaknesses: typeof data.course.weaknesses === 'string' && data.course.weaknesses.startsWith('[') ? JSON.parse(data.course.weaknesses) : data.course.weaknesses,
              recommendedLearningPlan: (data.course.topics || []).map((t: any) => ({
                stepIndex: t.stepIndex,
                stepName: t.stepName,
                stepDescription: t.stepDescription,
                grammarTopics: t.grammarTopics,
                topicsToLearn: t.topicsToLearn,
                whyLearn: t.whyLearn,
                whatToGain: t.whatToGain,
                engagementInfo: t.engagementInfo,
                areasForImprovement: t.areasForImprovement || '',
                actionsToAvoid: t.actionsToAvoid || ''
              }))
            };
            setPlan(reconstructed);
          }
        } catch (e) {
          console.error("Error loading stored plan:", e);
        } finally {
          setLoading(false);
        }
      };
      fetchStoredPlan();
    }
  }, [plan]);

  if (loading) {
    return (
      <div className="w-full min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 animate-pulse text-slate-500 font-bold dark:text-slate-400">
        লোডিং অ্যাসেসমেন্ট রিপোর্ট ও কোর্স প্ল্যান...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full p-8 text-center bg-slate-50 dark:bg-slate-950 font-sans">
        <Sparkles className="w-16 h-16 text-indigo-400 mb-6" />
        <h2 className="text-2xl font-black mb-4 dark:text-white">কোনো রিপোর্ট পাওয়া যায়নি</h2>
        <p className="text-slate-500 mb-8 max-w-sm">আপনার জন্য এখনও কোনো অ্যাসেসমেন্ট রিপোর্ট তৈরি করা হয়নি। আগে টেস্ট সম্পন্ন করুন।</p>
        <button onClick={() => navigate('/proficiency-test')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">টেস্ট শুরু করুন</button>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    setGeneratingPdf(true);

    // Give a short delay to display the loading spinner transition smoothly
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      // 1. Create native printable container offscreen
      const printContainer = document.createElement('div');
      printContainer.id = 'pdf-render-container';
      printContainer.style.position = 'fixed';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      printContainer.style.width = '794px'; // standard A4 width in pixels
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.style.fontFamily = "'Inter', 'Noto Sans Bengali', sans-serif";
      document.body.appendChild(printContainer);

      const steps = plan.recommendedLearningPlan || [];

      // Partition output across pages:
      const stepsPerPage = 2;
      const pagesData = [
        { type: "overview" },
        { type: "gaps" }
      ];

      for (let i = 0; i < steps.length; i += stepsPerPage) {
        pagesData.push({
          type: "steps",
          // @ts-ignore
          stepsList: steps.slice(i, i + stepsPerPage),
          startIndex: i
        });
      }

      const createAssessmentCardHtml = (step: any, absoluteIndex: number) => {
        return `
          <div class="card-border" style="border: 2px solid #cbd5e1; border-radius: 12px; padding: 16px; background: #ffffff; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.015);">
            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 10px;">
              <span class="text-indigo-800" style="background: #e0e7ff; color: #4f46e5; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 6px;">STEP ${absoluteIndex + 1}</span>
              <h4 class="text-indigo-900" style="font-size: 15px; font-weight: 900; color: #1e293b; margin: 0;">${step.stepName || ''}</h4>
            </div>
            
            <p class="text-slate-700" style="font-size: 12.5px; color: #334155; margin: 0 0 12px 0; line-height: 1.5; font-weight: 500;">
              ${step.stepDescription || ''}
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1.5px solid #cbd5e1;">
              ${step.grammarTopics ? `
                <div class="bg-slate-50" style="background: #f8fafc; padding: 8px; border-radius: 8px; border: 1.5px solid #cbd5e1;">
                  <strong class="text-indigo-800" style="font-size: 9px; text-transform: uppercase; color: #4f46e5; display: block; margin-bottom: 4px; font-weight: 800;">Grammar Topics</strong>
                  <span class="text-slate-700" style="font-size: 11.5px; color: #334155; font-weight: 600;">${step.grammarTopics}</span>
                </div>
              ` : ''}
              
              ${step.topicsToLearn ? `
                <div class="bg-slate-50" style="background: #f8fafc; padding: 8px; border-radius: 8px; border: 1.5px solid #cbd5e1;">
                  <strong class="text-green-800" style="font-size: 9px; text-transform: uppercase; color: #15803d; display: block; margin-bottom: 4px; font-weight: 800;">Communicative Topics</strong>
                  <span class="text-slate-700" style="font-size: 11.5px; color: #334155; font-weight: 600;">${step.topicsToLearn}</span>
                </div>
              ` : ''}

              ${step.areasForImprovement ? `
                <div class="bg-red-50" style="background: #fff5f5; padding: 8px; border-radius: 8px; grid-column: span 2; border: 1.5px solid #fca5a5;">
                  <strong class="text-red-700" style="font-size: 9px; text-transform: uppercase; color: #b91c1c; display: block; margin-bottom: 4px; font-weight: 800;">Areas for Improvement</strong>
                  <span class="text-slate-700" style="font-size: 11.5px; color: #991b1b; font-weight: 600;">${step.areasForImprovement}</span>
                </div>
              ` : ''}

              ${step.whyLearn ? `
                <div class="bg-amber-50" style="background: #fdfaf2; padding: 8px; border-radius: 8px; grid-column: span 2; border: 1.5px solid #fde047;">
                  <strong class="text-amber-800" style="font-size: 9px; text-transform: uppercase; color: #b45309; display: block; margin-bottom: 4px; font-weight: 800;">কেন এটি শেখা প্রয়োজন (Why Learn)</strong>
                  <span class="text-slate-700" style="font-size: 11.5px; color: #92400e; font-weight: 600;">${step.whyLearn}</span>
                </div>
              ` : ''}
              
              ${step.whatToGain ? `
                <div class="bg-green-50" style="background: #f0fdf4; padding: 8px; border-radius: 8px; grid-column: span 2; border: 1.5px solid #86efac;">
                  <strong class="text-green-800" style="font-size: 9px; text-transform: uppercase; color: #16a34a; display: block; margin-bottom: 4px; font-weight: 800;">শিখলে কি লাভ/উপকার হবে (Outcome)</strong>
                  <span class="text-slate-700" style="font-size: 11.5px; color: #166534; font-weight: 600;">${step.whatToGain}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      };

      const pdf = new jsPDF('p', 'mm', 'a4');
      const totalPages = pagesData.length;
      let currentPageIdx = 0;

      const languageQuotes = [
        { q: "A different language is a different vision of life.", a: "Federico Fellini" },
        { q: "Language is the road map of a culture. It tells you where its people come from and where they are going.", a: "Rita Mae Brown" },
        { q: "To have another language is to possess a second soul.", a: "Charlemagne" },
        { q: "The limits of my language mean the limits of my world.", a: "Ludwig Wittgenstein" },
        { q: "Learning another language is not only learning different words for the same things, but learning another way to think about things.", a: "Flora Lewis" }
      ];
      const randomQuote = languageQuotes[Math.floor(Math.random() * languageQuotes.length)];

      for (let i = 0; i < pagesData.length; i++) {
        const pageMeta: any = pagesData[i];

        const pageEl = document.createElement('div');
        pageEl.style.width = '794px';
        pageEl.style.height = '1120px';
        pageEl.style.padding = '40px';
        pageEl.style.boxSizing = 'border-box';
        pageEl.style.backgroundColor = '#ffffff';
        pageEl.style.display = 'flex';
        pageEl.style.flexDirection = 'column';
        pageEl.style.justifyContent = 'space-between';
        pageEl.className = 'print-page-portal pdf-force-light';

        let innerContentHtml = '';

        if (pageMeta.type === "overview") {
          innerContentHtml = `
            <div>
              <div class="bg-gradient-indigo" style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); border-radius: 16px; padding: 26px; color: #ffffff; margin-bottom: 26px;">
                <h1 class="text-white" style="font-size: 26px; font-weight: 900; tracking: -0.025em; margin: 0 0 6px 0; color: #ffffff;">AI English Assessment Report</h1>
                <p class="text-white" style="font-size: 13.5px; opacity: 0.95; margin: 0; color: #ffffff;">আপনার লাইভ ইন্টারেক্টিভ স্পিকিং টেস্টের কাস্টমাইজড মূল্যায়ন</p>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 18px; margin-bottom: 26px;">
                <div class="card-border" style="border: 2px solid #cbd5e1; border-radius: 14px; padding: 18px; background: #f8fafc; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                  <span class="text-slate-500" style="font-size: 9px; font-weight: 850; color: #64748b; text-transform: uppercase; tracking: 0.05em;">CEFR Level</span>
                  <p class="text-indigo-600" style="font-size: 32px; font-weight: 900; color: #4f46e5; margin: 6px 0;">${plan.cefrLevel || plan.proficiencyLevel || 'N/A'}</p>
                  <span class="text-slate-700" style="font-size: 10.5px; font-weight: 800; background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 12px; border: 1.5px solid #cbd5e1;">${plan.estimatedEnglishLevel || 'Assessed'}</span>
                </div>
                
                <div class="card-border" style="border: 2px solid #cbd5e1; border-radius: 14px; padding: 18px; background: #ffffff;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                     <span class="text-indigo-650" style="font-size: 14px; font-weight: 800; color: #4f46e5;">Academic Performance Scores</span>
                     <span class="text-indigo-650" style="font-size: 14px; font-weight: 950; color: #4f46e5;">Overall: ${String(plan.overallScore || '0').split('/')[0]}/100</span>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                     <div class="bg-slate-50" style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center;">
                       <span class="text-slate-550" style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold;">Grammar</span>
                       <div class="text-indigo-900" style="font-size: 13.5px; font-weight: 950; color: #1e1b4b;">${String(plan.grammarScore || '0').split('/')[0]}/25</div>
                     </div>
                     <div class="bg-slate-50" style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center;">
                       <span class="text-slate-550" style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold;">Vocabulary</span>
                       <div class="text-indigo-900" style="font-size: 13.5px; font-weight: 950; color: #1e1b4b;">${String(plan.vocabularyScore || '0').split('/')[0]}/20</div>
                     </div>
                     <div class="bg-slate-50" style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center;">
                       <span class="text-slate-550" style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold;">Fluency</span>
                       <div class="text-indigo-900" style="font-size: 13.5px; font-weight: 950; color: #1e1b4b;">${String(plan.fluencyScore || '0').split('/')[0]}/20</div>
                     </div>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                     <div class="bg-slate-50" style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center;">
                       <span class="text-slate-550" style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold;">Pronunciation</span>
                       <div class="text-indigo-900" style="font-size: 13.5px; font-weight: 950; color: #1e1b4b;">${String(plan.pronunciationScore || '0').split('/')[0]}/15</div>
                     </div>
                     <div class="bg-slate-50" style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center;">
                       <span class="text-slate-550" style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold;">Structure</span>
                       <div class="text-indigo-900" style="font-size: 13.5px; font-weight: 950; color: #1e1b4b;">${String(plan.sentenceStructureScore || '0').split('/')[0]}/10</div>
                     </div>
                     <div class="bg-slate-50" style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center;">
                       <span class="text-slate-550" style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold;">Confidence</span>
                       <div class="text-indigo-900" style="font-size: 13.5px; font-weight: 950; color: #1e1b4b;">${String(plan.confidenceScore || '0').split('/')[0]}/10</div>
                     </div>
                  </div>
                </div>
              </div>

              <div style="border: 1.5px solid #cbd5e1; background: #f8fafc; border-radius: 12px; padding: 18px; margin-bottom: 26px;">
                <h3 style="font-size: 12px; font-weight: 900; color: #1e293b; text-transform: uppercase; margin: 0 0 8px 0; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px;">CEFR Level কি এবং আপনার কোন স্তর?</h3>
                <p style="font-size: 10px; color: #475569; line-height: 1.5; margin: 0 0 12px 0; font-weight: 500;">
                  CEFR (Common European Framework of Reference for Languages) হলো ভাষা দক্ষতার একটি আন্তর্জাতিক মানদণ্ড। এটি A1 থেকে C2 পর্যন্ত ৬টি ধাপে মূল্যায়ন করে। আপনার অর্জিত ভাষা স্তর <strong>${plan.cefrLevel || 'N/A'}</strong>। সকল স্তরের ওভারভিউ নিচে দেওয়া হলো:
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  ${[
                    { level: 'A1', name: 'A1 (Beginner)', desc: 'একেবারে সহজ সাধারণ ছোট বাক্য ও মৌলিক কথা বলা।' },
                    { level: 'A2', name: 'A2 (Elementary)', desc: 'পরিচিত বিষয়ে সহজ বাক্য তৈরি করা ও কথা বলা।' },
                    { level: 'B1', name: 'B1 (Intermediate)', desc: 'দৈনন্দিন বিষয়ে স্বতঃস্ফূর্তভাবে মতামত প্রকাশ করা।' },
                    { level: 'B2', name: 'B2 (Upper Intermediate)', desc: 'জটিল ও একাডেমিক আলোচনায় সাবলীল অংশ নেওয়া।' },
                    { level: 'C1', name: 'C1/C2 (Advanced)', desc: 'কঠিন বিষয় বুঝতে পারা এবং অত্যন্ত নিখুঁত দীর্ঘ আলাপ চালানো।' }
                  ].map(item => {
                    const isUserLevel = String(plan.cefrLevel || '').toUpperCase().includes(item.level);
                    return `
                      <div style="background: ${isUserLevel ? '#eef2ff' : '#ffffff'}; padding: 8px; border-radius: 6px; border: 1px solid ${isUserLevel ? '#818cf8' : '#e2e8f0'};">
                        <strong style="font-size: 9px; color: ${isUserLevel ? '#4f46e5' : '#1e293b'};">${item.name}</strong>
                        ${isUserLevel ? '<span style="background: #10b981; color: white; font-size: 7px; padding: 2px 4px; border-radius: 4px; margin-left: 6px; font-weight: bold;">Your Level</span>' : ''}
                        <p style="font-size: 8px; color: ${isUserLevel ? '#3730a3' : '#64748b'}; margin: 2px 0 0 0;">${item.desc}</p>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 26px;">
                <div class="bg-green-50" style="border: 2px solid #86efac; background: #f0fdf4; border-radius: 12px; padding: 18px; min-height: 154px;">
                  <h4 class="text-green-800" style="color: #166534; font-size: 13.5px; font-weight: bold; margin: 0 0 8px 0; display: flex; align-items: center; gap: 4px;">🎯 Strengths (সবল দিকসমূহ)</h4>
                  ${Array.isArray(plan.strengths)
                    ? `<ul style="padding-left: 20px; font-size: 11.5px; color: #14532d; margin: 0;">${plan.strengths.map((c: any) => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}</ul>`
                    : `<p class="text-green-800" style="font-size: 11.5px; color: #14532d; line-height: 1.55; margin: 0; white-space: pre-line; font-weight: 500;">${plan.strengths || plan.analysis || 'No data available.'}</p>`}
                </div>
                <div class="bg-red-50" style="border: 2px solid #fca5a5; background: #fef2f2; border-radius: 12px; padding: 18px; min-height: 154px;">
                  <h4 class="text-red-700" style="color: #991b1b; font-size: 13.5px; font-weight: bold; margin: 0 0 8px 0; display: flex; align-items: center; gap: 4px;">⚠️ Weaknesses (দুর্বল দিকসমূহ)</h4>
                  ${Array.isArray(plan.weaknesses)
                    ? `<ul style="padding-left: 20px; font-size: 11.5px; color: #7f1d1d; margin: 0;">${plan.weaknesses.map((c: any) => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}</ul>`
                    : `<p class="text-red-700" style="font-size: 11.5px; color: #7f1d1d; line-height: 1.55; margin: 0; white-space: pre-line; font-weight: 500;">${plan.weaknesses || 'No data available.'}</p>`}
                </div>
              </div>

              <div style="background: #fffbeb; border: 1.5px solid #fde68a; padding: 18px; border-radius: 12px; text-align: center;">
                <h4 style="font-size: 14px; font-weight: 900; color: #b45309; margin: 0 0 6px 0; text-transform: uppercase;">✨ Daily Motivation</h4>
                <p style="font-size: 14px; color: #92400e; margin: 0 0 8px 0; font-style: italic; font-weight: 700;">
                  ❝ ${randomQuote.q} ❞ <br><span style="font-size: 11.5px; font-weight: 600;">— ${randomQuote.a}</span>
                </p>
                <p style="font-size: 11.5px; color: #b45309; margin: 0; font-weight: 600; line-height: 1.55; border-top: 1.5px solid #fcd34d; padding-top: 10px;">
                  আজকের একটু একটু চেষ্টাই আগামীকালের সাফল্যের চাবিকাঠি। ভুল করতে ভয় পাবেন না, কারণ ভুল থেকেই আপনি শিখবেন। নিজের ওপর বিশ্বাস রাখুন এবং প্রতিদিন প্র্যাকটিস চালিয়ে যান। আপনার সাফল্য নিশ্চিত!
                </p>
              </div>
            </div>
          `;
        } else if (pageMeta.type === "gaps") {
          innerContentHtml = `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 26px;">
                <span class="text-indigo-600" style="font-size: 12.5px; font-weight: 800; color: #4f46e5; text-transform: uppercase;">Grammar Mistakes & Vocabulary Gaps</span>
                <span class="text-slate-500" style="font-size: 11px; font-weight: 600; color: #64748b;">Detailed AI Analysis</span>
              </div>

              ${plan.commonGrammarMistakes ? `
                <div class="card-border" style="border: 2px solid #cbd5e1; border-radius: 12px; padding: 20px; background: #ffffff; margin-bottom: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.015);">
                  <h3 class="text-indigo-800" style="font-size: 14.5px; font-weight: 900; color: #3730a3; margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px;">📖 Common Grammar Mistakes (সাধারণ ব্যাকরণগত ভুল)</h3>
                  ${Array.isArray(plan.commonGrammarMistakes)
                    ? `<ul style="padding-left: 20px; font-size: 11.5px; color: #334155; margin: 0;">${plan.commonGrammarMistakes.map((c: any) => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}</ul>`
                    : `<p class="text-slate-700" style="font-size: 12.5px; color: #334155; line-height: 1.65; margin: 0; white-space: pre-line; font-weight: 500;">${plan.commonGrammarMistakes}</p>`}
                </div>
              ` : ''}

              ${plan.vocabularyGaps ? `
                <div class="card-border" style="border: 2px solid #cbd5e1; border-radius: 12px; padding: 20px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.015);">
                  <h3 class="text-green-800" style="font-size: 14.5px; font-weight: 900; color: #0f766e; margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px;">🎯 Vocabulary Gaps & Recommendations (শব্দভান্ডারের ঘাটতি)</h3>
                  ${Array.isArray(plan.vocabularyGaps)
                    ? `<ul style="padding-left: 20px; font-size: 11.5px; color: #334155; margin: 0;">${plan.vocabularyGaps.map((c: any) => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}</ul>`
                    : `<p class="text-slate-700" style="font-size: 12.5px; color: #334155; line-height: 1.65; margin: 0; white-space: pre-line; font-weight: 500;">${plan.vocabularyGaps}</p>`}
                </div>
              ` : ''}
            </div>
          `;
        } else {
          // Steps page
          innerContentHtml = `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 22px;">
                <span class="text-indigo-600" style="font-size: 12.5px; font-weight: 800; color: #4f46e5; text-transform: uppercase;">Recommended Learning Plan</span>
                <span class="text-slate-500" style="font-size: 11px; font-weight: 600; color: #64748b;">Steps ${pageMeta.startIndex + 1} - ${pageMeta.startIndex + pageMeta.stepsList.length}</span>
              </div>

              <div style="display: flex; flex-direction: column;">
                ${pageMeta.stepsList.map((s: any, idx: number) => createAssessmentCardHtml(s, pageMeta.startIndex + idx)).join('')}
              </div>
            </div>
          `;
        }

        pageEl.innerHTML = `
          ${innerContentHtml}
          <div style="border-top: 1.5px solid #cbd5e1; padding-top: 12px; font-size: 10.5px; font-weight: 800; color: #64748b; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;">
            <span class="text-slate-500">Spoken Guide AI Learning Intelligence (<a href="https://spokenguide.com" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 900;">https://spokenguide.com</a>)</span>
            <span class="text-slate-500">Page ${currentPageIdx + 1} of ${totalPages}</span>
          </div>
        `;

        printContainer.appendChild(pageEl);

        // Render page element to high-res crisp canvas
        const canvas = await html2canvas(pageEl, {
          scale: 3, // Premium ultra-crisp scaling
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        if (currentPageIdx > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

        // Overlay native clickable pdf link
        pdf.link(10, 280, 140, 12, { url: 'https://spokenguide.com' });

        currentPageIdx++;
        pageEl.remove(); // Keep DOM clean
      }

      // Download the direct PDF file
      pdf.save(`English-Assessment-Study-Guide.pdf`);
    } catch (err) {
      console.error('Error generating PDF report:', err);
      alert('পিডিএফ ডাউনলোড করার সময় সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      // Clean up the temporary offscreen rendering container
      const printEl = document.getElementById('pdf-render-container');
      if (printEl) {
        printEl.remove();
      }
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 dark:bg-slate-950 font-sans pb-20 transition-all duration-300">
      
      {/* Dynamic sticky navigation header bar */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-40 print:hidden transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs md:text-sm transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4"/> ফিরে যান
          </button>
          <button 
            disabled={generatingPdf}
            onClick={handleDownloadPDF} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs md:text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer"
          >
            {generatingPdf ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                পিডিএফ ডাউনলোড হচ্ছে...
              </>
            ) : (
              <>
                <Download className="w-4 h-4"/> পিডিএফ ডাউনলোড
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-6 px-4">
        <div ref={printRef} className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 md:p-8 shadow-xl border border-slate-150 dark:border-slate-800 text-slate-900 dark:text-slate-100 overflow-hidden relative" style={{ fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif" }}>

          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
             <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
               <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
             </div>
             <div>
               <h1 className="text-xl md:text-2xl font-black tracking-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>AI Assessment Report</h1>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">আপনার লাইভ কনভারসেশনের মূল্যায়ন</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="col-span-1 border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 flex flex-col justify-center items-center text-center">
               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">CEFR Level</span>
               <p className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">{plan.cefrLevel || plan.proficiencyLevel || 'N/A'}</p>
               <span className="text-[10px] font-bold text-slate-500 mt-1.5 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{plan.estimatedEnglishLevel || 'Unknown'}</span>
            </div>
            
            <div className="col-span-1 md:col-span-3 border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl p-4">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                   <Activity className="w-4 h-4" />
                   <h3>Performance Scores</h3>
                 </div>
                 <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                   {String(plan.overallScore || '0').split('/')[0]}/100
                 </div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                 {[
                   { label: 'Grammar', score: plan.grammarScore, max: 25 },
                   { label: 'Vocabulary', score: plan.vocabularyScore, max: 20 },
                   { label: 'Fluency', score: plan.fluencyScore, max: 20 },
                   { label: 'Pronunciation', score: plan.pronunciationScore, max: 15 },
                   { label: 'Structure', score: plan.sentenceStructureScore, max: 10 },
                   { label: 'Confidence', score: plan.confidenceScore, max: 10 }
                 ].map((item, idx) => item.score !== undefined && item.score !== null && (
                   <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-755/50 rounded-lg p-2 flex flex-col">
                     <span className="text-[9px] text-slate-550 dark:text-slate-400 font-bold uppercase">{item.label}</span>
                     <span className="text-sm font-black text-slate-850 dark:text-white">{String(item.score).split('/')[0]}/{item.max}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* CEFR Levels explanation table */}
          <div className="border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-5 mb-8 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              CEFR Level কি এবং আপনার কোন স্তর? (Understand CEFR Levels)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              CEFR (Common European Framework of Reference for Languages) হলো ভাষা দক্ষতার একটি আন্তর্জাতিক মানদণ্ড। এটি A1 থেকে C2 পর্যন্ত ৬টি ধাপে ইংরেজি ভাষার দক্ষতা মূল্যায়ন করে। নিচে আপনার অর্জিত ভাষা স্তর (<strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{plan.cefrLevel || 'N/A'}</strong>) সহ সকল স্তরের চমৎকার ওভারভিউ বা বিস্তারিত ব্যাখ্যা নিচে তুলে ধরা হলো, যেন আপনি সহজেই এই আন্তর্জাতিক স্কোর বুঝতে পারেন:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                { level: 'A1', name: 'Beginner (প্রাথমিক)', desc: 'একেবারে সহজ সাধারণ ছোট বাক্য ও দৈনন্দิน অতিপ্রয়োজনীয় মৌলিক কথা ধীরগতিতে বলা এবং বোঝা।' },
                { level: 'A2', name: 'Elementary (প্রাথমিক উচ্চ)', desc: 'পরিচিত বিষয়ে সহজ বাক্য তৈরি করা, বেসিক কেনাকাটা, নিজের পরিচয় দেওয়া ও সাধারণ বাক্য আদান-প্রদান করা।' },
                { level: 'B1', name: 'Intermediate (মধ্যম)', desc: 'কাজ, স্কুল, দৈনন্দিন ভ্রমণ সম্পর্কিত আলোচনা মূল ভাব বুঝতে ও স্বতঃস্ফূর্তভাবে কোনো ঘটনায় মতামত বা আবেগ প্রকাশ করা।' },
                { level: 'B2', name: 'Upper Intermediate (উচ্চ মধ্যম)', desc: 'জটিল ও একাডেমিক আলোচনায় অংশ নেওয়া এবং নিজের পরিচিত ফিল্ডে যেকোনো বিষয়ে সাবলীলভাবে কথা বলা কোনো জড়তা ছাড়াই।' },
                { level: 'C1', name: 'Advanced (উন্নত)', desc: 'কঠিন বিষয় বুঝতে পারা এবং শব্দ হাতড়ানো ছাড়াই অত্যন্ত নিখুঁতভাবে দীর্ঘ আলাপ চালানো যেকোনো কঠিন ফিল্ডে।' },
                { level: 'C2', name: 'Mastery (সর্বোচ্চ দক্ষতা বা মাতৃভাষার সমতুল্য)', desc: 'মাতৃভাষার মতো যেকোনো জটিল টেক্সট বা লেকচার বুঝতে পারা এবং অত্যন্ত সাবলীল ও নিখুঁত উপায়ে সূক্ষ্ম আবেগ বা যুক্তি প্রকাশ করা।' }
              ].map((item) => {
                const isStudentLevel = String(plan.cefrLevel || '').toUpperCase().includes(item.level);
                return (
                  <div 
                    key={item.level} 
                    className={`p-3.5 rounded-2xl border text-xs leading-normal transition-all duration-200 ${
                      isStudentLevel 
                        ? 'bg-indigo-55/70 dark:bg-indigo-950/20 border-indigo-500 dark:border-indigo-500/80 shadow-md ring-1 ring-indigo-400/30' 
                        : 'bg-slate-50/50 dark:bg-slate-800/10 border-slate-100/50 dark:border-slate-800/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs flex items-center gap-1.5">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black ${
                          isStudentLevel ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300'
                        }`}>
                          {item.level}
                        </span>
                        <span className={isStudentLevel ? 'text-indigo-700 dark:text-indigo-300 font-extrabold' : 'text-slate-800 dark:text-slate-200 font-bold'}>
                          {item.name}
                        </span>
                      </span>
                      {isStudentLevel && (
                        <span className="bg-[#10b981] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full select-none tracking-wider flex items-center gap-1 shrink-0">
                          <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
                          Your Level (আপনার স্তর)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-550 dark:text-slate-400 font-semibold leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
             <div className="border border-green-150 dark:border-green-500/20 bg-green-50/40 dark:bg-green-500/5 rounded-xl p-4">
               <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-bold mb-2 text-sm">
                 <CheckCircle2 className="w-4 h-4" />
                 <h3>Strengths</h3>
               </div>
               <p className="text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
                 {Array.isArray(plan.strengths) ? (
                   <ul className="list-disc pl-4 space-y-1">
                     {plan.strengths.map((c: any, i: number) => <li key={i}>{c}</li>)}
                   </ul>
                 ) : (
                   plan.strengths || plan.analysis || 'No data available.'
                 )}
               </p>
             </div>
             <div className="border border-red-150 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5 rounded-xl p-4">
               <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold mb-2 text-sm">
                 <AlertTriangle className="w-4 h-4" />
                 <h3>Weaknesses</h3>
               </div>
               <p className="text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
                 {Array.isArray(plan.weaknesses) ? (
                   <ul className="list-disc pl-4 space-y-1">
                     {plan.weaknesses.map((c: any, i: number) => <li key={i}>{c}</li>)}
                   </ul>
                 ) : (
                   plan.weaknesses || 'No data available.'
                 )}
               </p>
             </div>
          </div>

          {(plan.commonGrammarMistakes || plan.vocabularyGaps) && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {plan.commonGrammarMistakes && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      Common Grammar Mistakes
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-300 border border-slate-150 dark:border-slate-800/60 whitespace-pre-line font-medium leading-relaxed">
                      {Array.isArray(plan.commonGrammarMistakes) ? (
                        <ul className="list-disc pl-4 space-y-1">
                          {plan.commonGrammarMistakes.map((c: any, i: number) => <li key={i}>{c}</li>)}
                        </ul>
                      ) : (
                        plan.commonGrammarMistakes
                      )}
                    </div>
                  </div>
                )}
                {plan.vocabularyGaps && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-2">
                      <Target className="w-3.5 h-3.5 text-indigo-500" />
                      Vocabulary Gaps
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-300 border border-slate-150 dark:border-slate-800/60 whitespace-pre-line font-medium leading-relaxed">
                      {Array.isArray(plan.vocabularyGaps) ? (
                        <ul className="list-disc pl-4 space-y-1">
                          {plan.vocabularyGaps.map((c: any, i: number) => <li key={i}>{c}</li>)}
                        </ul>
                      ) : (
                        plan.vocabularyGaps
                      )}
                    </div>
                  </div>
                )}
             </div>
          )}

          <div className="mb-4 flex items-center gap-2 border-t border-slate-150 dark:border-slate-800 pt-6">
             <Map className="w-5 h-5 text-slate-400" />
             <h2 className="text-lg md:text-xl font-black" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>Recommended Learning Plan</h2>
          </div>

          <div className="space-y-4">
            {Array.isArray(plan.recommendedLearningPlan) ? (
              plan.recommendedLearningPlan.map((step: any, idx: number) => (
              <div key={idx} className="flex gap-4 group relative md:flex-row flex-col animate-in fade-in duration-3000" style={{ animationDelay: `${idx * 50}ms` }}>
                 <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-750 absolute left-6 top-12 bottom-0 group-last:hidden"></div>
                 <div className="relative z-10 w-12 h-12 shrink-0 bg-white dark:bg-slate-800 border border-indigo-500 rounded-xl flex flex-col items-center justify-center shadow-xs text-indigo-600 dark:text-indigo-400">
                    <span className="text-[10px] font-black uppercase">STEP</span>
                    <span className="text-base font-black leading-none">{idx + 1}</span>
                 </div>
                 
                 <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-750/50 rounded-xl p-4 shadow-xs hover:border-indigo-250 dark:hover:border-indigo-850/50 transition-colors space-y-3">
                    <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white leading-snug">
                      Step {idx + 1}: {step.stepName}
                    </h3>
                    <div className="text-[11px] md:text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line">
                       {step.stepDescription}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                      {step.topicsToLearn && (
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800/40">
                          <strong className="text-[9px] uppercase tracking-wide text-indigo-500 dark:text-indigo-400 block mb-0.5">Subjects to Learn (কোন বিষয়গুলো শিখতে হবে)</strong>
                          <span className="text-[11px] text-slate-750 dark:text-slate-200 font-semibold">{step.topicsToLearn}</span>
                        </div>
                      )}
                      
                      {step.grammarTopics && (
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800/40">
                          <strong className="text-[9px] uppercase tracking-wide text-indigo-500 dark:text-indigo-400 block mb-0.5">Grammar Topics (গ্রামার টপিক)</strong>
                          <span className="text-[11px] text-slate-750 dark:text-slate-200 font-medium">{step.grammarTopics}</span>
                        </div>
                      )}

                      {step.areasForImprovement && (
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800/40">
                          <strong className="text-[9px] uppercase tracking-wide text-rose-500 dark:text-rose-400 block mb-0.5">Areas for Improvement (যে বিষয়গুলোর উন্নতি দরকার)</strong>
                          <span className="text-[11px] text-slate-750 dark:text-slate-200 font-medium">{step.areasForImprovement}</span>
                        </div>
                      )}

                      {step.actionsToAvoid && (
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800/40">
                          <strong className="text-[9px] uppercase tracking-wide text-slate-400 block mb-0.5">Actions to Avoid (বর্জনীয় আচরণ)</strong>
                          <span className="text-[11px] text-slate-750 dark:text-slate-200 font-medium">{step.actionsToAvoid}</span>
                        </div>
                      )}

                      {step.whyLearn && (
                        <div className="bg-indigo-50/20 dark:bg-indigo-950/10 p-2.5 rounded-lg border border-indigo-100/20 dark:border-indigo-900/20 md:col-span-2">
                          <strong className="text-[9px] uppercase tracking-wide text-indigo-500 dark:text-indigo-400 block mb-0.5">Why Learn? (কেন শিখতে হবে?)</strong>
                          <span className="text-[11px] text-slate-750 dark:text-slate-200 leading-relaxed block font-semibold">{step.whyLearn}</span>
                        </div>
                      )}

                      {step.whatToGain && (
                        <div className="bg-emerald-50/20 dark:bg-emerald-950/10 p-2.5 rounded-lg border border-emerald-100/20 dark:border-emerald-900/20 md:col-span-2">
                          <strong className="text-[9px] uppercase tracking-wide text-emerald-500 dark:text-emerald-400 block mb-0.5">What'll be gained? (শিখলে কি লাভ/উপকার হবে?)</strong>
                          <span className="text-[11px] text-slate-750 dark:text-slate-200 leading-relaxed block font-semibold">{step.whatToGain}</span>
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            ))
            ) : (
                <div />
            )}
            
            {plan.courseOutline && plan.courseOutline.length > 0 && (
              <div className="mt-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center text-slate-500">
                <p>Fallback old format plan available. Please retake the test to see the new dashboard format.</p>
              </div>
            )}
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-sm font-bold text-slate-400 flex flex-col items-center justify-center gap-2">
            {isAlreadyConverted ? (
              <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-400 p-6 rounded-2xl max-w-xl text-center shadow-lg flex flex-col items-center justify-center">
                <p className="font-black text-base md:text-lg mb-1 flex items-center gap-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> এই কোর্সটি অলরেডি আপনার পার্সোনাল কোর্সে যুক্ত আছে!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-4">
                  (You have already made this your personal active Spoken course.)
                </p>
                <button 
                  onClick={() => navigate('/my-course')}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  কোর্স ড্যাশবোর্ডে যান (Go to Course Dashboard)
                </button>
              </div>
            ) : (
              <button 
                onClick={async () => {
                   const token = localStorage.getItem('auth_token');
                   if (!token) {
                      alert("Please login first to create and save your personal course.");
                      return;
                   }
                   try {
                      // Force a save if it was previously not saved (e.g. taken anonymously but logged in later, or just to satisfy the explicit save action)
                      await fetch('/api/user/course/import', {
                         method: 'POST',
                         headers: {
                           'Content-Type': 'application/json',
                           'Authorization': `Bearer ${token}`
                         },
                         body: JSON.stringify({ plan })
                      });
                   } catch(e) {}
                   navigate('/my-course');
                }} 
                className="mb-4 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-3 cursor-pointer hover:shadow-indigo-500/30 duration-300"
              >
                <BookOpen className="w-5 h-5"/> Make it my personal course
              </button>
            )}
            <Sparkles className="w-5 h-5 opacity-50" />
            Generated with AI Studio Learning Intelligence
          </div>

        </div>
        {/* Printable Area Ends */}
      </div>

      {/* Floating CTA Button with Float Animation */}
      {plan && !isAlreadyConverted && (
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 animate-float-btn">
          <button 
            type="button"
            onClick={async () => {
               const token = localStorage.getItem('auth_token');
               if (!token) {
                  alert("Please login first to create and save your personal course.");
                  return;
               }
               try {
                  await fetch('/api/user/course/import', {
                     method: 'POST',
                     headers: {
                       'Content-Type': 'application/json',
                       'Authorization': `Bearer ${token}`
                     },
                     body: JSON.stringify({ plan })
                  });
               } catch(e) {}
               navigate('/my-course');
            }} 
            className="group relative px-6 md:px-8 py-3.5 md:py-4 bg-gradient-to-r from-indigo-600 via-rose-500 to-indigo-700 hover:from-indigo-500 hover:via-rose-400 hover:to-indigo-600 text-white rounded-full font-black text-xs md:text-sm active:scale-95 transition-all duration-300 flex items-center gap-2.5 shadow-[0_12px_40px_-4px_rgba(99,102,241,0.5)] hover:shadow-[0_20px_50px_rgba(244,63,94,0.6)] cursor-pointer border border-white/20 select-none overflow-hidden ring-4 ring-indigo-500/25 dark:ring-indigo-500/35"
          >
            {/* Shimmer reflection */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
            
            <Sparkles className="w-4 h-4 md:w-5 h-5 text-indigo-100 animate-pulse" />
            <span className="tracking-wide text-xs font-black select-none uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
              Make it my personal course
            </span>
            <BookOpen className="w-4 h-4 md:w-5 h-5 group-hover:scale-125 transition-transform duration-300" />
          </button>
        </div>
      )}
    </div>
  );
};
