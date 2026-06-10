import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Lock, Play, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

export const MyCourse = () => {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourse();
  }, []);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('token');
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

  const downloadReport = () => {
    if (!course) return;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(22);
    doc.text("English Proficiency & Learning Plan", 20, 20);
    
    // Summary
    doc.setFontSize(14);
    doc.text(`CEFR Level: ${course.cefrLevel || 'N/A'}`, 20, 40);
    doc.text(`Overall Score: ${course.overallScore || 0}/100`, 20, 50);
    
    doc.setFontSize(12);
    const wrapStrengths = doc.splitTextToSize(`Strengths: ${course.strengths || ''}`, 170);
    doc.text(wrapStrengths, 20, 70);
    
    let nextY = 70 + (wrapStrengths.length * 7) + 10;
    const wrapWeaknesses = doc.splitTextToSize(`Weaknesses: ${course.weaknesses || ''}`, 170);
    doc.text(wrapWeaknesses, 20, nextY);

    nextY += (wrapWeaknesses.length * 7) + 20;

    doc.setFontSize(16);
    doc.text("Step-by-Step Learning Topics:", 20, nextY);
    nextY += 10;
    
    if (course.topics) {
      course.topics.forEach((t: any, i: number) => {
        if (nextY > 270) {
          doc.addPage();
          nextY = 20;
        }
        doc.setFontSize(12);
        const txt = `${i+1}. ${t.stepName} - ${t.stepDescription}`;
        const wrapTxt = doc.splitTextToSize(txt, 170);
        doc.text(wrapTxt, 20, nextY);
        nextY += wrapTxt.length * 7 + 5;
      });
    }

    doc.save("Learning-Report.pdf");
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Loading course...</div>;
  }

  if (!course) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4">No Course Found</h2>
        <p className="text-slate-500 mb-6">You have not completed an assessment yet to generate a tailored course.</p>
        <button onClick={() => navigate('/proficiency-test')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">
          Take Assessment Now
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-slate-50 flex flex-col font-sans pb-12">
      <div className="w-full bg-indigo-600 p-6 text-white text-center shadow-lg relative">
         <button onClick={() => navigate('/')} className="absolute left-6 top-6 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/50 hover:bg-indigo-500 transition shadow-sm text-sm">
            <ArrowLeft className="w-4 h-4"/> Back
        </button>
        <h1 className="text-3xl font-black mb-2 mt-4 md:mt-0">My Personalized English Course</h1>
        <p className="opacity-90 max-w-xl mx-auto text-sm">Target Level: {course.cefrLevel} • Overall Performance: {course.overallScore}/100</p>
        <button onClick={downloadReport} className="mt-4 mx-auto flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold shadow-md hover:scale-105 transition-all text-sm">
          <Download className="w-4 h-4" /> Download PDF Report
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 mt-8 flex flex-col gap-4">
        {course.topics && course.topics.map((topic: any, index: number) => {
          // Check if previous topic is complete to unlock this one
          const isUnlocked = index === 0 || (course.topics[index - 1].isCompleted === 1);
          
          return (
            <div key={topic.id} className={`bg-white rounded-2xl shadow-sm border p-5 flex flex-col md:flex-row gap-4 items-start md:items-center ${!isUnlocked ? 'opacity-60 border-slate-200' : 'border-indigo-100 hover:border-indigo-300'}`}>
               <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center font-bold text-lg ${isUnlocked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                 {topic.isCompleted ? <CheckCircle className="w-6 h-6 text-green-500" /> : index + 1}
               </div>
               
               <div className="flex-1">
                 <div className="flex items-center gap-2">
                   <h3 className="font-bold text-lg text-slate-800">{topic.stepName}</h3>
                   {!isUnlocked && <Lock className="w-4 h-4 text-slate-400" />}
                 </div>
                 <p className="text-slate-500 text-sm mt-1">{topic.stepDescription}</p>
                 {isUnlocked && (
                   <div className="mt-3 text-xs flex flex-wrap gap-2">
                     <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md">Grammar: {topic.grammarTopics}</span>
                     <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">Topics: {topic.topicsToLearn}</span>
                   </div>
                 )}
               </div>

               <div className="shrink-0 w-full md:w-auto text-right">
                  {isUnlocked ? (
                    <button 
                       onClick={() => navigate('/course-room', { state: { topic } })}
                       className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-[0_4px_0_rgb(67,56,202)] hover:translate-y-[2px] hover:shadow-[0_2px_0_rgb(67,56,202)] active:translate-y-[4px] active:shadow-none transition-all">
                      <Play className="w-4 h-4" /> 
                      {topic.isCompleted ? 'Review' : 'Start Topic'}
                    </button>
                  ) : (
                    <span className="text-slate-400 text-sm font-semibold flex items-center justify-center gap-2">
                      Score >80% on previous<br/>topic to unlock
                    </span>
                  )}
                  {topic.highestScore > 0 && <div className="text-xs font-bold text-slate-500 mt-2 text-center md:text-right">Highest: {topic.highestScore}%</div>}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
