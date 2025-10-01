import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, Camera, FileText, Download, Users, MapPin, Clock, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, User, Baby, PlusCircle, Trash2, ShieldCheck, Scale, BrainCircuit, BookOpen, Lightbulb } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useIncidentReport } from './hooks/useIncidentReport';

// --- Custom DatePicker Component ---
interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value + 'T00:00:00') : new Date());
  const pickerRef = useRef<HTMLDivElement>(null);
  
  const selectedDate = useMemo(() => value ? new Date(value + 'T00:00:00') : null, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (value) {
      const newViewDate = new Date(value + 'T00:00:00');
      if (!isNaN(newViewDate.getTime())) {
        setViewDate(newViewDate);
      }
    } else {
        setViewDate(new Date());
    }
  }, [value]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const formattedDate = newDate.toISOString().split('T')[0];
    onChange(formattedDate);
    setIsOpen(false);
  };
  
  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const today = new Date();
    today.setHours(0,0,0,0);
    const futureDateCutoff = new Date();

    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: numDays }, (_, i) => i + 1);

    const dayCells = [...blanks, ...days].map((day, index) => {
      if (!day) return <div key={`blank-${index}`} className="w-10 h-10"></div>;

      const currentDate = new Date(year, month, day);
      const isSelected = selectedDate && currentDate.getTime() === selectedDate.getTime();
      const isToday = currentDate.getTime() === today.getTime();
      const isFuture = currentDate > futureDateCutoff;
      
      const classNames = [
        "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 text-sm",
        isFuture ? "text-[#888888] cursor-not-allowed" : "cursor-pointer",
        !isFuture && !isSelected && "hover:bg-[#00BFFF]/20",
        isSelected && "bg-[#00BFFF] text-white font-bold shadow-[0_0_15px_#00BFFF]",
        !isSelected && isToday && "border-2 border-[#00BFFF]",
        !isSelected && !isToday && "text-[#CCCCCC]"
      ].filter(Boolean).join(" ");
      
      return <div key={day} className={classNames} onClick={() => !isFuture && handleDayClick(day)}>{day}</div>;
    });

    return (
      <div className="absolute top-full left-0 mt-2 w-80 bg-black/80 backdrop-blur-md border border-[#00BFFF]/30 p-4 rounded-xl shadow-2xl z-10">
        <div className="flex justify-between items-center mb-4"><button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-[#444444] text-[#00BFFF]"><ChevronLeft size={20} /></button><div className="font-semibold text-[#F0F0F0]">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div><button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-[#444444] text-[#00BFFF]"><ChevronRight size={20} /></button></div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#00BFFF] mb-2 font-medium">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">{dayCells}</div>
      </div>
    );
  };
  
  return (
    <div className="relative" ref={pickerRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-4 bg-black/50 border-2 border-[#00BFFF]/50 rounded-xl focus:shadow-[0_0_15px_#00BFFF] focus:border-[#00BFFF] transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_#00BFFF66] flex items-center justify-between text-left"><span className={value ? 'text-[#F0F0F0]' : 'text-[#A0A0A0]'}>{value ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date'}</span><Calendar className="w-5 h-5 text-[#00BFFF]" /></button>
      {isOpen && renderCalendar()}
    </div>
  );
};

// --- Custom TimePicker Component ---
interface TimePickerProps {
    value: string;
    onChange: (time: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hour, minute] = value ? value.split(':').map(Number) : [NaN, NaN];
    const pickerRef = useRef<HTMLDivElement>(null);
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (hourRef.current && !isNaN(hour)) hourRef.current.scrollTop = hour * 40;
            if (minuteRef.current && !isNaN(minute)) minuteRef.current.scrollTop = minute * 40;
        }
    }, [isOpen, hour, minute]);

    const selectTime = (h: number | null, m: number | null) => {
        const newHour = h !== null ? h : (isNaN(hour) ? 0 : hour);
        const newMinute = m !== null ? m : (isNaN(minute) ? 0 : minute);
        onChange(`${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`);
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const renderPicker = () => (
        <div className="absolute top-full left-0 mt-2 w-48 bg-black/80 backdrop-blur-md border border-[#00BFFF]/30 rounded-xl shadow-2xl z-10 flex h-56 overflow-hidden">
            <div ref={hourRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00BFFF #111' }}>{hours.map(h => (<div key={h} onClick={() => selectTime(h, null)} className={`flex items-center justify-center h-10 cursor-pointer text-sm transition-all ${h === hour ? 'bg-[#00BFFF] text-white font-bold' : 'hover:bg-[#00BFFF]/20 text-[#CCCCCC]'}`}>{String(h).padStart(2, '0')}</div>))}</div>
            <div ref={minuteRef} className="flex-1 overflow-y-auto border-l border-[#00BFFF]/30" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00BFFF #111' }}>{minutes.map(m => (<div key={m} onClick={() => selectTime(null, m)} className={`flex items-center justify-center h-10 cursor-pointer text-sm transition-all ${m === minute ? 'bg-[#00BFFF] text-white font-bold' : 'hover:bg-[#00BFFF]/20 text-[#CCCCCC]'}`}>{String(m).padStart(2, '0')}</div>))}</div>
        </div>
    );

    return (
        <div className="relative" ref={pickerRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-4 bg-black/50 border-2 border-[#00BFFF]/50 rounded-xl focus:shadow-[0_0_15px_#00BFFF] focus:border-[#00BFFF] transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_#00BFFF66] flex items-center justify-between text-left"><span className={value ? 'text-[#F0F0F0]' : 'text-[#A0A0A0]'}>{value || 'Select a time'}</span><Clock className="w-5 h-5 text-[#00BFFF]" /></button>
            {isOpen && renderPicker()}
        </div>
    );
};


// --- Main App Component ---
const predefinedParties = ['Ex-spouse', 'Co-parent', 'Their new partner', 'Grandparent', 'Other family member'];
const predefinedChildren = ['Child 1', 'Child 2', 'Child 3'];
const jurisdictions = ['Ontario, Canada', 'British Columbia, Canada', 'Alberta, Canada', 'Quebec, Canada', 'Other Canadian Province', 'US State - Please specify'];

const steps = [
  { number: 1, title: 'Date & Time', icon: Clock },
  { number: 2, title: 'What Happened', icon: FileText },
  { number: 3, title: 'Who Was Involved', icon: Users },
  { number: 4, title: 'Location & Evidence', icon: MapPin },
  { number: 5, title: 'Review & Export', icon: CheckCircle2 }
];

const App: React.FC = () => {
  const {
    currentStep,
    incidentData,
    reportData,
    isGeneratingSummary,
    isGeneratingPDF,
    customParty,
    customChild,
    setCustomParty,
    setCustomChild,
    handleInputChange,
    handleArrayChange,
    addCustomItem,
    handleFileUpload,
    removeEvidence,
    generateAISummary,
    restart,
    nextStep,
    prevStep,
    canProceed,
    dateValidationMessage,
    setIsGeneratingPDF
  } = useIncidentReport();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const exportToPDF = () => {
    if (!reportData) return;
    setIsGeneratingPDF(true);
    
    try {
        const doc = new jsPDF();
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const usableWidth = pageWidth - margin * 2;
        let y = 20;

        const addText = (text: string, size: number, style: 'bold' | 'normal', options: { align?: 'center' | 'left' | 'right', isTitle?: boolean } = {}) => {
            const { align = 'left', isTitle = false } = options;
            doc.setFontSize(size);
            doc.setFont('helvetica', style);
            
            if (isTitle) {
                doc.setTextColor(0, 123, 255);
            }

            const lines = doc.splitTextToSize(text, usableWidth);
            if (y + (lines.length * 5) > 280) { // Check for page break
                doc.addPage();
                y = 20;
            }
            doc.text(lines, align === 'center' ? pageWidth / 2 : margin, y, { align });
            y += (lines.length * (size * 0.4)) + 3;
            
            if(isTitle) {
              doc.setTextColor(0, 0, 0); // Reset color
            }
        };

        // Title
        addText(reportData.title, 18, 'bold', { align: 'center' });
        y += 5;

        // Sub-details
        addText(`Incident Date: ${new Date(incidentData.date + 'T00:00:00').toLocaleDateString()} | Time: ${incidentData.time} | Jurisdiction: ${incidentData.jurisdiction}`, 10, 'normal', { align: 'center'});
        y += 10;
        
        // Sections
        addText("AI Analysis", 14, 'bold', { isTitle: true });
        addText(`Category: ${reportData.category}`, 11, 'normal');
        addText(`Severity: ${reportData.severity}`, 11, 'normal');
        addText(`Justification: ${reportData.severityJustification}`, 11, 'normal');
        y += 5;

        addText("Professional Summary", 14, 'bold', { isTitle: true });
        addText(reportData.professionalSummary, 11, 'normal');
        y += 5;

        addText("Observed Impact on Child(ren)", 14, 'bold', { isTitle: true });
        addText(reportData.observedImpact, 11, 'normal');
        y += 5;

        addText("Parties Involved", 12, 'bold');
        addText(`Other Parties: ${incidentData.parties.join(', ') || 'None specified'}`, 11, 'normal');
        addText(`Children Present/Affected: ${incidentData.children.join(', ') || 'None specified'}`, 11, 'normal');
        y += 5;

        addText("Original Account", 12, 'bold');
        addText(`"${incidentData.narrative}"`, 11, 'normal');
        y += 5;
        
        if (incidentData.evidence.length > 0) {
            addText("Supporting Evidence", 12, 'bold');
            addText(incidentData.evidence.map(e => e.name).join(', '), 11, 'normal');
            y += 5;
        }

        addText("Legal Insights (Not Legal Advice)", 14, 'bold', { isTitle: true });
        addText(reportData.legalInsights, 11, 'normal');
        y += 5;
        
        addText("AI Notes & Recommendations", 12, 'bold');
        addText(reportData.aiNotes, 11, 'normal');
        y += 5;
        
        addText("Sources", 12, 'bold');
        addText(reportData.sources.join(', '), 11, 'normal');
        y += 10;

        // Disclaimer
        doc.setDrawColor(255, 123, 0);
        doc.rect(margin, y, usableWidth, 20);
        addText("Disclaimer: This document was generated with AI assistance for informational and documentation purposes only. It does not constitute legal advice. Always consult with a qualified legal professional for advice on your specific situation.", 9, 'normal');

        doc.save(`Incident-Report-${incidentData.date}.pdf`);
    } catch(error) {
        console.error("Failed to generate PDF:", error);
        alert("There was an error generating the PDF. Please try again.");
    } finally {
        setIsGeneratingPDF(false);
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: {
        return (
          <div className="space-y-8">
              <div className="text-center mb-8">
                  <div className={`w-16 h-16 bg-gradient-to-br from-[#007BFF] to-[#FF00FF] shadow-[0_0_20px_#007BFF] rounded-2xl flex items-center justify-center mx-auto mb-4 relative`}>
                      <div className="absolute inset-0 bg-inherit rounded-2xl blur-md opacity-75 animate-pulse"></div>
                      <Calendar className="w-8 h-8 text-white relative" />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-[#007BFF] to-[#FF00FF] bg-clip-text text-transparent mb-2 [text-shadow:0_0_8px_#007BFF66]">When did this incident occur?</h2>
                  <p className="text-[#A0A0A0] max-w-md mx-auto">Provide the date and time for accurate documentation.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                  <div>
                    <label className="block text-sm font-semibold text-[#00BFFF] mb-3">Incident Date *</label>
                    <DatePicker value={incidentData.date} onChange={(date) => handleInputChange('date', date)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#00BFFF] mb-3">Incident Time *</label>
                    <TimePicker value={incidentData.time} onChange={(time) => handleInputChange('time', time)} />
                  </div>
              </div>
              {dateValidationMessage && (
                <p className="text-center text-red-500 text-sm mt-4 -mb-4 [text-shadow:0_0_8px_rgba(255,0,0,0.5)]">{dateValidationMessage}</p>
              )}
          </div>
        );
      }
      case 2: return (
          <div className="space-y-8">
              <div className="text-center mb-8">
                  <div className={`w-16 h-16 bg-gradient-to-br from-[#FF00FF] to-[#FF69B4] shadow-[0_0_20px_#FF00FF] rounded-2xl flex items-center justify-center mx-auto mb-4 relative`}>
                      <div className="absolute inset-0 bg-inherit rounded-2xl blur-md opacity-75 animate-pulse"></div>
                      <FileText className="w-8 h-8 text-white relative" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#FF00FF] mb-2 [text-shadow:0_0_8px_#FF00FF66]">What happened?</h2>
                  <p className="text-[#A0A0A0] max-w-md mx-auto">Describe the incident objectively. Our AI will create a professional summary.</p>
              </div>
              <div className="max-w-3xl mx-auto">
                  <label className="block text-sm font-semibold text-[#FF00FF] mb-3">Incident Description *</label>
                  <div className="relative">
                      <textarea value={incidentData.narrative} onChange={(e) => handleInputChange('narrative', e.target.value)} rows={10} placeholder="Describe what happened in detail. Include specific actions, words said, and your observations." className="w-full p-6 bg-black/50 border-2 border-[#FF00FF]/50 rounded-xl focus:shadow-[0_0_15px_#FF00FF] focus:border-[#FF00FF] transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_#FF00FF66] resize-none text-[#CCCCCC] placeholder-[#888888]" />
                      <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1 rounded-full text-xs text-[#FF00FF]">{incidentData.narrative.length} characters</div>
                  </div>
                  <div className="mt-3 flex items-center text-sm text-[#00BFFF]/80 p-3 bg-[#00BFFF]/10 border border-[#00BFFF]/30 rounded-lg shadow-[0_0_10px_#00BFFF1A]"><AlertCircle className="w-4 h-4 mr-2 text-[#00BFFF]" />Your description will be converted into professional, objective language.</div>
              </div>
          </div>
      );
      case 3: return (
        <div className="space-y-8">
            <div className="text-center mb-8"><div className={`w-16 h-16 bg-gradient-to-br from-[#8A2BE2] to-[#007BFF] shadow-[0_0_20px_#8A2BE2] rounded-2xl flex items-center justify-center mx-auto mb-4 relative`}><div className="absolute inset-0 bg-inherit rounded-2xl blur-md opacity-75 animate-pulse"></div><Users className="w-8 h-8 text-white relative" /></div><h2 className="text-2xl font-bold text-[#9370DB] mb-2 [text-shadow:0_0_8px_#8A2BE266]">Who was involved?</h2><p className="text-[#A0A0A0] max-w-md mx-auto">Select all parties and children who were present or affected.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="space-y-4 p-4 border border-[#8A2BE2]/30 rounded-lg"><h3 className="text-lg font-bold text-[#9370DB] flex items-center"><User className="w-5 h-5 mr-2" />Other Parties Involved *</h3><div className="grid grid-cols-2 gap-3">{predefinedParties.map(p => (<button key={p} onClick={() => handleArrayChange('parties', p)} className={`p-3 rounded-lg border-2 text-left transition-all duration-300 ${incidentData.parties.includes(p) ? 'bg-[#8A2BE2]/30 border-[#9370DB] shadow-[0_0_10px_#8A2BE280]' : 'bg-black/30 hover:bg-[#8A2BE2]/20 border-[#8A2BE2]/30'}`}><span className="font-medium text-[#CCCCCC] text-sm">{p}</span></button>))}</div><div className="flex gap-2 pt-2"><input type="text" value={customParty} onChange={(e) => setCustomParty(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomItem('parties', customParty, setCustomParty)} placeholder="Other..." className="flex-1 p-3 bg-black/50 border-2 border-[#8A2BE2]/50 rounded-lg focus:shadow-[0_0_15px_#8A2BE280] focus:border-[#9370DB] text-[#CCCCCC]" /><button onClick={() => addCustomItem('parties', customParty, setCustomParty)} className="px-4 py-3 bg-[#8A2BE2]/80 text-white rounded-lg hover:bg-[#8A2BE2] transition-colors hover:shadow-[0_0_15px_#8A2BE2]"><PlusCircle size={20} /></button></div></div>
                <div className="space-y-4 p-4 border border-[#FF00FF]/30 rounded-lg"><h3 className="text-lg font-bold text-[#FF69B4] flex items-center"><Baby className="w-5 h-5 mr-2" />Children Present/Affected</h3><div className="grid grid-cols-2 gap-3">{predefinedChildren.map(c => (<button key={c} onClick={() => handleArrayChange('children', c)} className={`p-3 rounded-lg border-2 text-left transition-all duration-300 ${incidentData.children.includes(c) ? 'bg-[#FF00FF]/30 border-[#FF69B4] shadow-[0_0_10px_#FF00FF80]' : 'bg-black/30 hover:bg-[#FF00FF]/20 border-[#FF00FF]/30'}`}><span className="font-medium text-[#CCCCCC] text-sm">{c}</span></button>))}</div><div className="flex gap-2 pt-2"><input type="text" value={customChild} onChange={(e) => setCustomChild(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomItem('children', customChild, setCustomChild)} placeholder="Child name..." className="flex-1 p-3 bg-black/50 border-2 border-[#FF00FF]/50 rounded-lg focus:shadow-[0_0_15px_#FF00FF] focus:border-[#FF69B4] text-[#CCCCCC]" /><button onClick={() => addCustomItem('children', customChild, setCustomChild)} className="px-4 py-3 bg-[#FF00FF]/80 text-white rounded-lg hover:bg-[#FF00FF] transition-colors hover:shadow-[0_0_15px_#FF00FF]"><PlusCircle size={20} /></button></div></div>
            </div>
        </div>
      );
      case 4: return (
        <div className="space-y-8">
            <div className="text-center mb-8"><div className={`w-16 h-16 bg-gradient-to-br from-[#007BFF] to-[#FF00FF] shadow-[0_0_20px_#007BFF] rounded-2xl flex items-center justify-center mx-auto mb-4 relative`}><div className="absolute inset-0 bg-inherit rounded-2xl blur-md opacity-75 animate-pulse"></div><MapPin className="w-8 h-8 text-white relative" /></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#007BFF] to-[#FF00FF] bg-clip-text text-transparent mb-2 [text-shadow:0_0_8px_#007BFF66]">Location & Evidence</h2><p className="text-[#A0A0A0] max-w-md mx-auto">Specify jurisdiction and attach supporting evidence.</p></div>
            <div className="max-w-2xl mx-auto mb-8"><label className="block text-sm font-semibold text-[#00BFFF] mb-3">Jurisdiction *</label><select value={incidentData.jurisdiction} onChange={(e) => handleInputChange('jurisdiction', e.target.value)} className="w-full p-4 bg-black/50 border-2 border-[#00BFFF]/50 rounded-xl focus:shadow-[0_0_15px_#00BFFF] focus:border-[#00BFFF] transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_#00BFFF66] text-[#CCCCCC]"><option value="" className="bg-[#222222]">Select jurisdiction...</option>{jurisdictions.map(j => (<option key={j} value={j} className="bg-[#222222] text-[#CCCCCC]">{j}</option>))}</select></div>
            <div className="max-w-2xl mx-auto"><label className="block text-sm font-semibold text-[#FF00FF] mb-3">Evidence (Optional)</label><div className="border-2 border-dashed border-[#FF00FF]/50 rounded-xl p-8 text-center bg-black/30 hover:bg-[#FF00FF]/10 transition-colors hover:border-[#FF00FF] hover:shadow-[0_0_20px_#FF00FF4c]"><Camera className="w-12 h-12 text-[#FF00FF]/70 mx-auto mb-3" /><p className="text-[#A0A0A0] mb-4">Upload photos, screenshots, documents.</p><input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-[#FF00FF]/80 text-white rounded-xl hover:bg-[#FF00FF] transition-colors font-medium hover:shadow-[0_0_15px_#FF00FF]">Choose Files</button></div>{incidentData.evidence.length > 0 && (<div className="mt-6 space-y-3">{incidentData.evidence.map((file, index) => (<div key={index} className="flex items-center justify-between p-4 bg-black/50 rounded-xl border border-[#00BFFF]/30 shadow-sm"><div className="flex items-center gap-3"><FileText className="w-6 h-6 text-[#00BFFF]" /><div className="text-sm"><p className="font-semibold text-[#F0F0F0]">{file.name}</p><p className="text-[#A0A0A0]">{(file.size / 1024).toFixed(1)} KB</p></div></div><button onClick={() => removeEvidence(index)} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full"><Trash2 size={18} /></button></div>))}</div>)}</div>
        </div>
      );
      case 5: return (
        <div className="space-y-6">
          {isGeneratingSummary && !reportData ? (
            <div className="text-center py-10 bg-black/50 rounded-2xl">
              <div className="relative flex items-center justify-center mb-8">
                  <div className="animate-spin rounded-full h-24 w-24 border-4 border-[#444444] border-t-[#00BFFF]" style={{ filter: 'drop-shadow(0 0 8px #00BFFF)' }}></div>
                  <BrainCircuit className="absolute w-12 h-12 text-[#00BFFF]" style={{ filter: 'drop-shadow(0 0 8px #00BFFF)' }}/>
              </div>
              <div className="max-w-md mx-auto text-white">
                  <h2 className="text-2xl font-bold mb-3 text-[#00BFFF]" style={{ textShadow: '0 0 8px #00BFFF' }}>Analyzing Incident...</h2>
                  <p className="text-[#CCCCCC] mb-6">AI is processing details and generating legal analysis...</p>
                  <div className="flex justify-center space-x-4 mb-6">
                      <div className="w-3 h-3 bg-[#00BFFF] rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-[#FF00FF] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-3 h-3 bg-[#8A2BE2] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <div className="text-sm text-[#A0A0A0] space-y-2 text-left w-60 mx-auto">
                      <p className="flex items-center"><CheckCircle2 size={16} className="text-[#00BFFF] mr-2"/> Categorizing incident type</p>
                      <p className="flex items-center"><CheckCircle2 size={16} className="text-[#FF00FF] mr-2"/> Assessing severity level</p>
                      <p className="flex items-center"><CheckCircle2 size={16} className="text-[#8A2BE2] mr-2"/> Analyzing legal implications</p>
                      <p className="flex items-center"><CheckCircle2 size={16} className="text-[#00BFFF] mr-2"/> Generating summary</p>
                  </div>
              </div>
          </div>
          ) : reportData ? (
              <div className="bg-black/70 backdrop-blur-sm border border-[#00BFFF]/30 rounded-2xl shadow-[0_0_30px_#00BFFF33]">
                  <div className="p-6 border-b border-[#444444]">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[#007BFF] to-[#FF00FF] bg-clip-text text-transparent mb-1 [text-shadow:0_0_10px_#007BFF4c]">{reportData.title}</h1>
                    <p className="text-sm text-[#A0A0A0]">AI-Generated Incident Analysis</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-[#111111]/50 p-4 rounded-lg border border-[#00BFFF]/30 text-center"><div className="text-sm text-[#00BFFF] mb-1 font-bold bg-gradient-to-r from-[#007BFF] to-[#FF00FF] bg-clip-text text-transparent">Category</div><div className="font-semibold text-[#F0F0F0]">{reportData.category}</div></div>
                        <div className={`p-4 rounded-lg border text-center ${reportData.severity === 'High' ? 'bg-red-900/30 border-red-500/40' : reportData.severity === 'Medium' ? 'bg-amber-900/30 border-amber-500/40' : 'bg-green-900/30 border-green-500/40'}`}><div className={`text-sm mb-1 ${reportData.severity === 'High' ? 'text-red-400' : reportData.severity === 'Medium' ? 'text-amber-400' : 'text-green-400'}`}>Severity</div><div className={`font-semibold ${reportData.severity === 'High' ? 'text-red-400' : reportData.severity === 'Medium' ? 'text-amber-400' : 'text-green-400'}`}>{reportData.severity}</div></div>
                        <div className="bg-[#111111]/50 p-4 rounded-lg border border-[#00BFFF]/30 text-center"><div className="text-sm text-[#00BFFF] mb-1 font-bold bg-gradient-to-r from-[#007BFF] to-[#FF00FF] bg-clip-text text-transparent">Incident Date</div><div className="font-semibold text-[#F0F0F0]">{new Date(incidentData.date + 'T00:00:00').toLocaleDateString()}</div></div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="bg-[#111111]/50 p-5 rounded-lg border border-[#444444]"><h3 className="font-bold text-[#00BFFF] mb-2 flex items-center bg-gradient-to-r from-[#007BFF] to-[#FF00FF] bg-clip-text text-transparent"><ShieldCheck className="w-5 h-5 mr-2 text-[#00BFFF]" />Severity Justification</h3><p className="text-[#CCCCCC] text-sm leading-relaxed">{reportData.severityJustification}</p></div>
                        <div className="bg-[#111111]/50 p-5 rounded-lg border border-[#444444]"><h3 className="font-bold text-[#00BFFF] mb-2 flex items-center bg-gradient-to-r from-[#007BFF] to-[#FF00FF] bg-clip-text text-transparent"><FileText className="w-5 h-5 mr-2 text-[#00BFFF]" />Professional Summary</h3><p className="text-[#CCCCCC] text-sm leading-relaxed whitespace-pre-line">{reportData.professionalSummary}</p></div>
                        <div className="bg-[#111111]/50 p-5 rounded-lg border border-[#444444]"><h3 className="font-bold text-[#00BFFF] mb-2 flex items-center bg-gradient-to-r from-[#007BFF] to-[#FF00FF] bg-clip-text text-transparent"><Baby className="w-5 h-5 mr-2 text-[#00BFFF]" />Observed Impact on Child(ren)</h3><p className="text-[#CCCCCC] text-sm leading-relaxed whitespace-pre-line">{reportData.observedImpact}</p></div>
                        <div className="bg-[#8A2BE2]/10 border-l-4 border-[#8A2BE2] p-5 rounded-r-lg"><h3 className="font-bold text-[#9370DB] mb-2 flex items-center"><Scale className="w-5 h-5 mr-2" />Legal Insights (Not Legal Advice)</h3><p className="text-[#E0BBE4] text-sm whitespace-pre-line leading-relaxed">{reportData.legalInsights}</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#111111]/50 p-4 rounded-lg border border-[#444444]"><h4 className="font-semibold text-[#00BFFF] mb-1 text-sm flex items-center"><BookOpen className="w-4 h-4 mr-2"/>Sources:</h4><p className="text-[#A0A0A0] text-xs">{reportData.sources.join(', ')}</p></div>
                            <div className="bg-[#111111]/50 p-4 rounded-lg border border-[#444444]"><h4 className="font-semibold text-[#00BFFF] mb-1 text-sm flex items-center"><Lightbulb className="w-4 h-4 mr-2"/>AI Notes & Recommendations:</h4><p className="text-[#A0A0A0] text-xs">{reportData.aiNotes}</p></div>
                        </div>
                    </div>
                  </div>
              </div>
          ) : null}
      </div>
      );
      default: return null;
    }
  };


  return (
    <div className="min-h-screen bg-black text-[#F0F0F0] font-sans">
      <header className="bg-black/50 backdrop-blur-md border-b border-[#333333] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center space-x-4">
          <div className="w-11 h-11 bg-gradient-to-br from-[#007BFF] to-[#FF00FF] rounded-xl flex items-center justify-center shadow-[0_0_15px_#007BFF66]">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F0F0F0] drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">CoParent Documentation</h1>
            <p className="text-[#00BFFF]/80">Professional Incident Reporting Assistant</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-10">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center text-center w-20">
                  <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                    ${isCompleted ? 'bg-[#FF00FF]/30 border-[#FF00FF] text-[#FF00FF] shadow-[0_0_15px_#FF00FF66]' : ''}
                    ${isActive ? 'bg-gradient-to-br from-[#007BFF] to-[#FF00FF] border-[#007BFF] text-white shadow-[0_0_20px_#007BFF99] scale-110' : ''}
                    ${!isActive && !isCompleted ? 'bg-[#222222] border-[#444444] text-[#888888]' : ''}
                  `}>
                    {isActive && <div className="absolute inset-0 rounded-full bg-[#007BFF] blur-lg opacity-50 animate-pulse"></div>}
                    {isCompleted ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                  </div>
                  <p className={`text-xs mt-2 font-semibold transition-colors
                    ${isCompleted ? 'text-[#FF00FF]' : ''}
                    ${isActive ? 'bg-gradient-to-r from-[#007BFF] to-[#FF00FF] bg-clip-text text-transparent' : ''}
                    ${!isActive && !isCompleted ? 'text-[#888888]' : ''}
                  `}>{step.title}</p>
                </div>
                {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 transition-colors duration-500 rounded-full ${isCompleted ? 'bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2]' : 'bg-[#333333]'}`} />}
              </React.Fragment>
            );
          })}
        </div>

        <div className="bg-[#111111]/50 backdrop-blur-md rounded-2xl shadow-[0_0_30px_#8A2BE233] border border-[#8A2BE2]/30 p-6 sm:p-8 transition-all duration-300 min-h-[450px]">
          {renderStepContent()}
        </div>

        <div className="flex justify-between items-center mt-8">
          {currentStep > 1 && currentStep <= 5 ? (
            <button onClick={prevStep} className="inline-flex items-center px-6 py-3 bg-[#222222]/50 border-2 border-[#444444] text-[#CCCCCC] rounded-xl hover:bg-[#333333] hover:border-[#888888] hover:text-white transition-all duration-200 font-medium">
              <ArrowLeft className="w-5 h-5 mr-2" /> Previous
            </button>
          ) : <div/>}

          {currentStep < 5 ? (
            <button onClick={nextStep} disabled={!canProceed} className="inline-flex items-center px-8 py-3 bg-gradient-to-br from-[#007BFF] to-[#FF00FF] text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_#007BFF66] hover:shadow-[0_0_30px_#FF00FF66] font-semibold disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100">
              {currentStep === 4 ? 'Analyze Incident' : 'Continue'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <div className="flex flex-wrap gap-3 justify-end w-full">
                <button onClick={restart} className="inline-flex items-center px-5 py-2.5 bg-[#111111]/80 border-2 border-[#8A2BE2]/50 text-[#9370DB] rounded-lg hover:bg-[#8A2BE2]/20 hover:text-[#E0BBE4] font-medium transition-all hover:shadow-[0_0_15px_#8A2BE280]">New Report</button>
                <button onClick={generateAISummary} disabled={isGeneratingSummary} className="inline-flex items-center px-5 py-2.5 bg-[#111111]/80 border-2 border-[#FF00FF]/50 text-[#FF69B4] rounded-lg hover:bg-[#FF00FF]/20 hover:text-[#FF00FF] font-medium transition-all hover:shadow-[0_0_15px_#FF00FF80] disabled:opacity-20"><RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingSummary ? 'animate-spin' : ''}`} />Regenerate</button>
                <button onClick={exportToPDF} disabled={!reportData || isGeneratingPDF} className="inline-flex items-center px-6 py-2.5 bg-gradient-to-br from-[#007BFF] to-[#FF00FF] text-white rounded-lg hover:opacity-90 font-semibold shadow-[0_0_15px_#007BFF66] disabled:opacity-50 disabled:shadow-none disabled:cursor-wait">
                  <Download className="w-4 h-4 mr-2" />{isGeneratingPDF ? 'Generating PDF...' : 'Export PDF'}
                </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;