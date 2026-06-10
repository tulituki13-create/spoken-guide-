import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Lock, Play, Download, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const MyCourse = () => {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [converting, setConverting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourse();
  }, []);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/user/course', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      setCourse(data.course);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/user/course/convert', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (data.success) {
        await fetchCourse();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConverting(false);
    }
  };

  const downloadReport = async () => {
    if (!course) return;
    setGeneratingPdf(true);

    // Give a short delay to display the loading spinner transition smoothly
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      // 1. Create off-screen container for rendering
      const printContainer = document.createElement('div');
      printContainer.id = 'pdf-render-container';
      printContainer.style.position = 'fixed';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      printContainer.style.width = '794px'; // standard A4 width in pixels
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.style.fontFamily = "'Inter', 'Noto Sans Bengali', sans-serif";
      document.body.appendChild(printContainer);

      const steps = course.topics || [];
      
      const pagesData = [
        { type: "overview" }
      ];

      for (let i = 0; i < steps.length; i += 2) {
        pagesData.push({
          type: "steps",
          // @ts-ignore
          stepsList: steps.slice(i, i + 2),
          startIndex: i
        });
      }

      const createCardHtml = (step: any, absoluteIndex: number) => {
        return `
          <div class="card-border" style="border: 2px solid #cbd5e1; border-radius: 12px; padding: 18px; background: #ffffff; display: flex; gap: 16px; align-items: start; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.02)">
            <div class="bg-green-50 text-green-800" style="width: 42px; height: 42px; border-radius: 10px; background: #e0e7ff; border: 2px solid #4f46e5; color: #4f46e5; font-weight: 950; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${absoluteIndex + 1}
            </div>
            <div style="flex: 1;">
              <h4 class="text-indigo-900" style="font-size: 16.5px; font-weight: 900; color: #1e1b4b; margin: 0 0 6px 0; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;">
                Step ${absoluteIndex + 1}: ${step.stepName || ''}
              </h4>
              <p class="text-slate-700" style="font-size: 13.5px; color: #334155; margin: 0 0 10px 0; line-height: 1.5; font-weight: 500;">
                ${step.stepDescription || ''}
              </p>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1.5px solid #cbd5e1;">
                ${step.grammarTopics ? `
                  <div class="bg-slate-50" style="background: #f8fafc; padding: 8px; border-radius: 8px; border: 1.5px solid #cbd5e1;">
                    <strong class="text-indigo-800" style="font-size: 9.5px; text-transform: uppercase; color: #4f46e5; display: block; margin-bottom: 4px; font-weight: 800;">Grammar Topics</strong>
                    <span class="text-slate-700" style="font-size: 12px; color: #334155; font-weight: 600;">${step.grammarTopics}</span>
                  </div>
                ` : ''}
                
                ${step.topicsToLearn ? `
                  <div class="bg-slate-50" style="background: #f8fafc; padding: 8px; border-radius: 8px; border: 1.5px solid #cbd5e1;">
                    <strong class="text-green-800" style="font-size: 9.5px; text-transform: uppercase; color: #15803d; display: block; margin-bottom: 4px; font-weight: 800;">Communicative Topics</strong>
                    <span class="text-slate-700" style="font-size: 12px; color: #334155; font-weight: 600;">${step.topicsToLearn}</span>
                  </div>
                ` : ''}

                ${step.areasForImprovement ? `
                  <div class="bg-red-50" style="background: #fff5f5; padding: 8px; border-radius: 8px; grid-column: span 2; border: 1.5px solid #fca5a5;">
                    <strong class="text-red-700" style="font-size: 9.5px; text-transform: uppercase; color: #b91c1c; display: block; margin-bottom: 4px; font-weight: 800;">Areas for Improvement</strong>
                    <span class="text-slate-700" style="font-size: 12px; color: #991b1b; font-weight: 600;">${step.areasForImprovement}</span>
                  </div>
                ` : ''}

                ${step.whyLearn ? `
                  <div class="bg-amber-50" style="background: #fdfaf2; padding: 8px; border-radius: 8px; grid-column: span 2; border: 1.5px solid #fde047;">
                    <strong class="text-amber-800" style="font-size: 9.5px; text-transform: uppercase; color: #b45309; display: block; margin-bottom: 4px; font-weight: 800;">কেন এটি শেখা প্রয়োজন (Why Learn)</strong>
                    <span class="text-slate-700" style="font-size: 12px; color: #92400e; font-weight: 600;">${step.whyLearn}</span>
                  </div>
                ` : ''}
                
                ${step.whatToGain ? `
                  <div class="bg-green-50" style="background: #f0fdf4; padding: 8px; border-radius: 8px; grid-column: span 2; border: 1.5px solid #86efac;">
                    <strong class="text-green-800" style="font-size: 9.5px; text-transform: uppercase; color: #16a34a; display: block; margin-bottom: 4px; font-weight: 800;">শিখলে কি লাভ/উপকার হবে (Outcome)</strong>
                    <span class="text-slate-700" style="font-size: 12px; color: #166534; font-weight: 600;">${step.whatToGain}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      };

      const pdf = new jsPDF('p', 'mm', 'a4');
      const totalPages = pagesData.length;
      let currentPageIdx = 0;

      for (let i = 0; i < pagesData.length; i++) {
        const pageMeta: any = pagesData[i];

        const pageEl = document.createElement('div');
        pageEl.style.width = '794px';
        pageEl.style.height = '1120px'; // standard A4 aspect
        pageEl.style.padding = '40px';
        pageEl.style.boxSizing = 'border-box';
        pageEl.style.backgroundColor = '#ffffff';
        pageEl.style.display = 'flex';
        pageEl.style.flexDirection = 'column';
        pageEl.style.justifyContent = 'space-between';
        pageEl.className = 'print-page pdf-force-light';

        let innerContentHtml = '';

        if (pageMeta.type === "overview") {
          // Page 1: Main elegant header & score report
          innerContentHtml = `
            <div>
              <div class="bg-gradient-indigo" style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); border-radius: 16px; padding: 28px; color: #ffffff; margin-bottom: 26px;">
                <h1 class="text-white" style="font-size: 26px; font-weight: 900; tracking: -0.025em; margin: 0 0 6px 0; color: #ffffff;">Spoken Guide Learning Report</h1>
                <p class="text-white" style="font-size: 13.5px; opacity: 0.95; margin: 0; color: #ffffff;">আপনার ইংরেজি ভাষা শিক্ষার কাস্টমাইজড ৩০টি ধাপের পূর্ণাঙ্গ গাইডলাইন</p>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 18px; margin-bottom: 26px;">
                <div class="card-border" style="border: 2px solid #cbd5e1; border-radius: 14px; padding: 18px; background: #f8fafc; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                  <span class="text-slate-500" style="font-size: 9px; font-weight: 850; color: #64748b; text-transform: uppercase; tracking: 0.05em;">CEFR Level</span>
                  <p class="text-indigo-600" style="font-size: 32px; font-weight: 900; color: #4f46e5; margin: 6px 0;">${course.cefrLevel || 'N/A'}</p>
                  <span class="text-slate-700" style="font-size: 10.5px; font-weight: 800; background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 12px; border: 1.5px solid #cbd5e1;">Assessed Level</span>
                </div>
                <div class="card-border" style="border: 2px solid #cbd5e1; border-radius: 14px; padding: 18px; background: #f5f3ff;">
                  <h3 class="text-indigo-800" style="font-size: 14.5px; font-weight: 900; color: #3730a3; margin: 0 0 8px 0;">Course Roadmap Overview</h3>
                  <p class="text-slate-700" style="font-size: 12.5px; color: #334155; margin: 0 0 10px 0; line-height: 1.55; font-weight: 500;">
                     This highly personalized curriculum consists of exactly 30 chronological steps designed by Spoken Guide AI based on your voice assessment transcript.
                  </p>
                  <div class="text-indigo-600" style="font-size: 11.5px; font-weight: bold; color: #4f46e5;">Overall Performance Score: ${course.overallScore || 0}/100</div>
                </div>
              </div>

              <div style="margin-top: 10px; border: 2px solid #e2e8f0; border-radius: 14px; padding: 22px; background: #ffffff;">
                <h3 style="font-size: 16px; font-weight: 800; color: #1e293b; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 20px;">💡</span> আপনার শেখার গাইডলাইন ও নিয়মাবলী
                </h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px;">
                  <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; padding: 16px; border-radius: 12px;">
                    <h4 style="font-size: 13.5px; font-weight: 900; color: #166534; margin: 0 0 10px 0; display: flex; align-items: center; border-bottom: 1.5px solid #dcece3; padding-bottom: 6px;">✔️ কী করবেন (DOs)</h4>
                    <ul style="font-size: 11.5px; color: #15803d; line-height: 1.6; margin: 0; padding-left: 18px; font-weight: 600;">
                      <li style="margin-bottom: 6px;">প্রতিদিন অন্তত ২০-৩০ মিনিট AI-এর সাথে প্র্যাকটিস করুন।</li>
                      <li style="margin-bottom: 6px;">ভুল হলেও কথা চালিয়ে যান, জড়তা কাটানো সবচেয়ে জরুরি।</li>
                      <li style="margin-bottom: 6px;">নতুন শব্দগুলো খাতায় লিখে রাখুন এবং বাক্যে ব্যবহার করুন।</li>
                      <li style="margin-bottom: 0;">প্রতিটি ধাপ বুঝে শেষ করে তবেই পরের ধাপে যান।</li>
                    </ul>
                  </div>
                  <div style="background: #fef2f2; border: 1.5px solid #fecaca; padding: 16px; border-radius: 12px;">
                    <h4 style="font-size: 13.5px; font-weight: 900; color: #991b1b; margin: 0 0 10px 0; display: flex; align-items: center; border-bottom: 1.5px solid #fce8e8; padding-bottom: 6px;">❌ কী করবেন না (DON'Ts)</h4>
                    <ul style="font-size: 11.5px; color: #b91c1c; line-height: 1.6; margin: 0; padding-left: 18px; font-weight: 600;">
                      <li style="margin-bottom: 6px;">গ্রামার ভুল হবে ভেবে কথা বলা থেকে বিরত থাকবেন না।</li>
                      <li style="margin-bottom: 6px;">ধাপগুলো বাদ দিয়ে লাফিয়ে লাফিয়ে এগোবেন না।</li>
                      <li style="margin-bottom: 6px;">কথা বলার সময় বাংলায় অনুবাদ করে ভাববেন না।</li>
                      <li style="margin-bottom: 0;">খুব দ্রুত কথা বলার চেষ্টা করবেন না, স্পষ্টতায় জোর দিন।</li>
                    </ul>
                  </div>
                </div>

                <div style="background: #f8fafc; border-left: 5px solid #6366f1; padding: 16px 20px; border-radius: 8px; margin-bottom: 22px; border-top: 1.5px solid #e2e8f0; border-right: 1.5px solid #e2e8f0; border-bottom: 1.5px solid #e2e8f0;">
                  <h4 style="font-size: 14px; font-weight: 900; color: #3730a3; margin: 0 0 8px 0; display: flex; align-items: center;">🤖 Spoken Guide AI কীভাবে আপনাকে সাহায্য করবে?</h4>
                  <p style="font-size: 12px; color: #475569; line-height: 1.65; margin: 0; font-weight: 500;">
                    আপনার এই স্পোকেন ইংলিশ যাত্রায় Spoken Guide AI আপনার <strong>পকেট মেন্টর (Personal Mentor)</strong> হিসেবে ২৪ ঘণ্টা কাজ করবে। আপনি প্রতিটি ধাপে AI-কে কল করে সরাসরি কথা বলতে পারবেন। সে আপনার উচ্চারণ ও গ্রামারের ভুলগুলো ধরিয়ে দেবে, সঠিক পদ্ধতি শেখাবে এবং ঠিক একজন পেশাদার শিক্ষকের মতো আপনার সাথে ইংরেজিতে কথোপকথন চালিয়ে যাবে। কোনো জড়তা বা সংকোচ ছাড়াই আপনি আপনার স্মার্টফোনেই প্র্যাকটিস করতে পারবেন। 
                  </p>
                </div>

                <div style="background: #fffbeb; border: 1.5px solid #fde68a; padding: 18px; border-radius: 12px; text-align: center;">
                  <h4 style="font-size: 15px; font-weight: 900; color: #b45309; margin: 0 0 8px 0; font-style: italic;">❝ The expert in anything was once a beginner. ❞</h4>
                  <p style="font-size: 12px; color: #92400e; margin: 0; font-weight: 600; line-height: 1.6;">
                    আজকের একটু একটু চেষ্টাই আগামীকালের সাফল্যের চাবিকাঠি। ভুল করতে ভয় পাবেন না, কারণ ভুল থেকেই আপনি শিখবেন। নিজের ওপর বিশ্বাস রাখুন এবং প্রতিদিন প্র্যাকটিস চালিয়ে যান। আপনার সাফল্য নিশ্চিত!
                  </p>
                </div>
              </div>
            </div>
          `;
        } else {
          // Sequential learning steps
          const stepsHtml = pageMeta.stepsList.map((s: any, idx: number) => createCardHtml(s, pageMeta.startIndex + idx)).join('');
          
          innerContentHtml = `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 22px;">
                <span class="text-indigo-600" style="font-size: 13px; font-weight: 900; color: #4f46e5; text-transform: uppercase;">Roadmap Study Guide</span>
                <span class="text-slate-500" style="font-size: 11.5px; font-weight: 800; color: #64748b;">Steps ${pageMeta.startIndex + 1} - ${pageMeta.startIndex + pageMeta.stepsList.length}</span>
              </div>

              <div style="display: flex; flex-direction: column;">
                ${stepsHtml}
              </div>

              ${(pageMeta.startIndex + pageMeta.stepsList.length) === steps.length ? `
                <div class="card-border" style="margin-top: 18px; border: 2.5px dashed #a855f7; border-radius: 12px; padding: 18px; background: #faf5ff; text-align: center;">
                  <h4 class="text-indigo-900" style="font-size: 14px; font-weight: 900; color: #6b21a8; margin: 0 0 6px 0;">🎉 Roadmap Completed!</h4>
                  <p class="text-slate-700" style="font-size: 11.5px; color: #581c87; margin: 0; line-height: 1.5; font-weight: 600;">
                    ধারাবাহিকভাবে প্রতিটি ধাপ সম্পন্ন করুন এবং ৮০ বা তার বেশি স্কোর পাওয়ার মাধ্যমে পরবর্তী ধাপ উন্মুক্ত করুন।
                  </p>
                </div>
              ` : ''}
            </div>
          `;
        }

        // Add standard footer to each A4 page with styled fully-clickable link
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
          scale: 3, // Ultra high resolution crisp rendering (300 DPI equivalent)
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

        // Add the crisp vector-equivalent image layout
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

        // Overlay a real, native clickable link on top of the footer text coordinates on this page
        pdf.link(10, 280, 140, 12, { url: 'https://spokenguide.com' });

        currentPageIdx++;
        pageEl.remove(); // Keep DOM clean
      }

      // 4. Download file
      pdf.save(`English-Course-Roadmap.pdf`);
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

  if (loading) {
    return (
      <div className="w-full min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 animate-pulse text-slate-500 font-bold dark:text-slate-400">
        লোডিং কোর্স রোডম্যাপ...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 w-full text-center mx-auto flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-950">
        <h2 className="text-2xl font-black mb-4 dark:text-white">কোনো কোর্স রোডম্যাপ খুঁজে পাওয়া যায়নি</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Tailored কোর্স জেনারেট করতে অনুগ্রহ করে সর্বপ্রথমে একটি এসেসমেন্ট টেস্ট সম্পন্ন করুন।</p>
        <button onClick={() => navigate('/proficiency-test')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md">
          টেস্ট শুরু করুন
        </button>
      </div>
    );
  }

  if (course.isConverted === 0) {
    return (
      <div className="w-full min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans pb-12 transition-colors duration-300">
        <div className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-950 dark:to-indigo-900 p-6 text-white text-center shadow-lg relative rounded-b-3xl">
          <button onClick={() => navigate('/')} className="absolute left-6 top-6 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/50 hover:bg-indigo-500 dark:bg-indigo-900/40 dark:hover:bg-indigo-800/80 transition shadow-sm text-xs md:text-sm font-bold text-white">
            <ArrowLeft className="w-4 h-4"/> Back
          </button>
          <BookOpen className="w-12 h-12 text-indigo-200 mx-auto mt-6 mb-3" />
          <h1 className="text-2xl md:text-3.5xl font-black mb-2 tracking-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            আপনার কোর্স প্ল্যান প্রস্তুত!
          </h1>
          <p className="opacity-95 max-w-xl mx-auto text-xs md:text-sm">
            পরীক্ষার ফলাফল ও সুপারিশকৃত ৩০ ধাপের শেখার পরিকল্পনা সফলভাবে তৈরি হয়েছে।
          </p>
        </div>

        <div className="max-w-2xl mx-auto w-full px-4 mt-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-150 dark:border-slate-800/80 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/40">
              <div>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Target Proficiency Level</p>
                <div className="text-2xl font-black text-indigo-950 dark:text-indigo-150">{course.cefrLevel}</div>
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Overall Assessment Score</p>
                <div className="text-2xl font-black text-indigo-950 dark:text-indigo-150">
                  {String(course.overallScore || '0').replace(/\/100$/, '').replace(/\/100\/100$/, '')} / 100
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  আপনার সবল দিকসমূহ (Strengths)
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium pl-4 border-l-2 border-emerald-500">
                  {course.strengths}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  উন্নতির জায়গা (Weaknesses)
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium pl-4 border-l-2 border-rose-500">
                  {course.weaknesses}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
              <button
                disabled={converting}
                onClick={handleConvert}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg active:scale-98 transition text-xs md:text-sm"
              >
                {converting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    কোর্স প্ল্যানে রূপান্তর করা হচ্ছে...
                  </span>
                ) : (
                  'কোর্সে রূপান্তর করুন (Convert into Active Course)'
                )}
              </button>
              
              <button
                onClick={() => navigate('/learning-plan', { state: { plan: { 
                  cefrLevel: course.cefrLevel,
                  overallScore: course.overallScore,
                  strengths: course.strengths,
                  weaknesses: course.weaknesses,
                  recommendedLearningPlan: course.topics
                } } })}
                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl active:scale-98 transition text-xs md:text-sm"
              >
                বিস্তারিত রিপোর্ট দেখুন
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans pb-12 transition-colors duration-300">
      
      {/* Header Banner */}
      <div className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-950 dark:to-indigo-900 p-6 text-white text-center shadow-lg relative rounded-b-3xl">
         <button onClick={() => navigate('/')} className="absolute left-6 top-6 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/50 hover:bg-indigo-500 dark:bg-indigo-900/40 dark:hover:bg-indigo-800/80 transition shadow-sm text-xs md:text-sm font-bold text-white">
            <ArrowLeft className="w-4 h-4"/> Back
        </button>
        <h1 className="text-2xl md:text-3.5xl font-black mb-2 mt-12 md:mt-0 tracking-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
          My Personalized English Course
        </h1>
        <p className="opacity-90 max-w-xl mx-auto text-xs md:text-sm">
          Target Level: <span className="font-extrabold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md">{course.cefrLevel}</span> • Overall Performance: <span className="font-extrabold text-indigo-200 bg-indigo-400/20 px-2 py-0.5 rounded-md">{String(course.overallScore || '0').replace(/\/100$/, '').replace(/\/100\/100$/, '')}/100</span>
        </p>

        <div className="mt-5 mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
          <button 
            disabled={generatingPdf}
            onClick={downloadReport} 
            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2.5 rounded-xl font-black shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all text-xs md:text-sm disabled:opacity-50"
          >
            {generatingPdf ? (
              <>
                <span className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Generating Clear PDF Study Guide...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download PDF Report
              </>
            )}
          </button>
          
          <button
            onClick={() => navigate('/learning-plan', { state: { plan: { 
              cefrLevel: course.cefrLevel,
              overallScore: course.overallScore,
              grammarScore: course.grammarScore,
              vocabularyScore: course.vocabularyScore,
              fluencyScore: course.fluencyScore,
              pronunciationScore: course.pronunciationScore,
              sentenceStructureScore: course.sentenceStructureScore,
              confidenceScore: course.confidenceScore,
              strengths: course.strengths,
              weaknesses: course.weaknesses,
              commonGrammarMistakes: course.commonGrammarMistakes,
              vocabularyGaps: course.vocabularyGaps,
              recommendedLearningPlan: course.topics
            } } })}
            className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-white border border-indigo-400/30 px-5 py-2.5 rounded-xl font-black shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all text-xs md:text-sm"
          >
            <BarChart2 className="w-4 h-4" /> বিস্তারিত রিপোর্ট দেখুন
          </button>
        </div>
      </div>

      {/* Main Roadmap Steps List */}
      <div className="max-w-4xl mx-auto w-full px-4 mt-8 flex flex-col gap-4">
        {course.topics && course.topics.map((topic: any, index: number) => {
          // Check if previous topic is complete (score >= 80 or marked completed) to unlock this one
          const isUnlocked = index === 0 || (course.topics[index - 1].highestScore >= 80) || (course.topics[index - 1].isCompleted === 1);
          const allPreviewsCompleted = index === 0 || course.topics.slice(0, index).every((t:any) => t.isCompleted === 1 || t.highestScore >= 80);
          const isCurrentTopic = isUnlocked && allPreviewsCompleted && (!topic.isCompleted && (topic.highestScore || 0) < 80);
          
          return (
            <div 
              key={topic.id} 
              className={`bg-white dark:bg-slate-900 rounded-3xl shadow-xs border p-5 md:p-6 flex flex-col md:flex-row gap-5 items-start md:items-center transition-all duration-200 ${
                !isUnlocked 
                  ? 'opacity-60 border-slate-200 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-900/30' 
                  : isCurrentTopic
                    ? 'border-indigo-400 dark:border-indigo-500/80 ring-2 ring-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10'
                    : 'border-slate-150 dark:border-slate-800/80 hover:border-indigo-250 dark:hover:border-indigo-800/80 hover:shadow-md'
              }`}
            >
               {/* Numerical Circle Indicator */}
               <div className={`w-12 h-12 rounded-2xl flex shrink-0 items-center justify-center font-extrabold text-lg transition-colors relative ${
                 isUnlocked 
                   ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/40' 
                   : 'bg-slate-150/40 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border border-slate-200/40 dark:border-slate-700/30'
               }`}>
                 {isCurrentTopic && (
                   <span className="absolute inset-0 rounded-2xl border-2 border-indigo-400 dark:border-indigo-500 animate-ping opacity-20"></span>
                 )}
                 {(topic.isCompleted || topic.highestScore >= 80) ? <CheckCircle className="w-6 h-6 text-emerald-500 dark:text-emerald-400" /> : index + 1}
               </div>
               
               {/* Step textual description details */}
               <div className="flex-1 space-y-2">
                 <div className="flex items-center gap-2 flex-wrap">
                   <h3 className="font-extrabold text-base md:text-lg text-slate-900 dark:text-slate-100 leading-tight">
                     {topic.stepName}
                   </h3>
                   {!isUnlocked && <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                 </div>
                 
                 <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
                   {topic.stepDescription}
                 </p>
                 
                 
                  <div className="flex flex-wrap gap-2 pt-1">
                    {topic.grammarTopics && (
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold border transition-colors ${
                        isUnlocked 
                          ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-100/50 dark:border-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100/60 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-700/20 text-slate-500 dark:text-slate-400'
                      }`}>
                        Grammar: {topic.grammarTopics}
                      </span>
                    )}
                    {topic.topicsToLearn && (
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold border transition-colors ${
                        isUnlocked
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100/60 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-700/20 text-slate-500 dark:text-slate-400'
                      }`}>
                        Topics: {topic.topicsToLearn}
                      </span>
                    )}
                  </div>
               </div>

               {/* Action triggers */}
               <div className="shrink-0 w-full md:w-auto flex flex-col gap-2 items-stretch md:items-end">
                  {isUnlocked ? (
                    <button 
                       onClick={() => navigate('/course-room', { state: { topic } })}
                       className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md cursor-pointer text-xs md:text-sm active:scale-95 transition-all"
                    >
                      <Play className="w-4 h-4" /> 
                      {topic.isCompleted ? 'Review' : 'Start Topic'}
                    </button>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center gap-2 text-center py-2 px-3 bg-slate-100/40 dark:bg-slate-800/10 rounded-xl border border-slate-200/10 dark:border-slate-700/5">
                      Completed previous to unlock
                    </span>
                  )}
                  {topic.highestScore > 0 && (
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center md:text-right">
                      Highest score: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{topic.highestScore}%</span>
                    </div>
                  )}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
