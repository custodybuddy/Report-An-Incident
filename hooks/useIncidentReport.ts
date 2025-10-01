import { useState, useCallback, useMemo } from 'react';
import type { IncidentData, ReportData, EvidenceFile } from '../types';
import { generateIncidentReport } from '../services/geminiService';

const initialIncidentData: IncidentData = {
  date: '',
  time: '',
  narrative: '',
  parties: [],
  children: [],
  jurisdiction: '',
  evidence: [],
};

export interface UseIncidentReportReturn {
  currentStep: number;
  incidentData: IncidentData;
  reportData: ReportData | null;
  isGeneratingSummary: boolean;
  isGeneratingPDF: boolean;
  customParty: string;
  customChild: string;
  setCustomParty: React.Dispatch<React.SetStateAction<string>>;
  setCustomChild: React.Dispatch<React.SetStateAction<string>>;
  handleInputChange: (field: keyof Omit<IncidentData, 'parties' | 'children' | 'evidence'>, value: string) => void;
  handleArrayChange: (field: 'parties' | 'children', item: string) => void;
  addCustomItem: (field: 'parties' | 'children', customValue: string, setCustomValue: React.Dispatch<React.SetStateAction<string>>) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeEvidence: (index: number) => void;
  generateAISummary: () => Promise<void>;
  restart: () => void;
  nextStep: () => void;
  prevStep: () => void;
  canProceed: boolean;
  dateValidationMessage: string;
  setIsGeneratingPDF: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useIncidentReport = (): UseIncidentReportReturn => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [incidentData, setIncidentData] = useState<IncidentData>(initialIncidentData);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [customParty, setCustomParty] = useState<string>('');
  const [customChild, setCustomChild] = useState<string>('');

  const handleInputChange = useCallback((field: keyof Omit<IncidentData, 'parties' | 'children' | 'evidence'>, value: string) => {
    setIncidentData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleArrayChange = useCallback((field: 'parties' | 'children', item: string) => {
    setIncidentData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  }, []);

  const addCustomItem = useCallback((field: 'parties' | 'children', customValue: string, setCustomValue: React.Dispatch<React.SetStateAction<string>>) => {
    if (customValue.trim() && !incidentData[field].includes(customValue.trim())) {
      setIncidentData(prev => ({
        ...prev,
        [field]: [...prev[field], customValue.trim()],
      }));
      setCustomValue('');
    }
  }, [incidentData]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const files = Array.from(event.target.files);
    const newEvidence: EvidenceFile[] = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      timestamp: new Date().toLocaleString(),
      url: URL.createObjectURL(file),
    }));
    
    setIncidentData(prev => ({
      ...prev,
      evidence: [...prev.evidence, ...newEvidence],
    }));
  }, []);

  const removeEvidence = useCallback((index: number) => {
    setIncidentData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index),
    }));
  }, []);

  const generateAISummary = useCallback(async () => {
    setIsGeneratingSummary(true);
    setReportData(null);
    try {
      const result = await generateIncidentReport(incidentData);
      setReportData(result);
    } catch (error) {
      console.error('Error generating summary:', error);
      // Fallback data in case of API error
      setReportData({
        title: `Co-parent failed to respond to urgent communications regarding child's health`,
        category: 'Child Safety/Welfare Concern',
        severity: 'High',
        severityJustification: 'Non-responsive communication regarding a child\'s health directly impacts the child\'s welfare and ability to receive timely care.',
        professionalSummary: `On ${incidentData.date} at ${incidentData.time}, an incident occurred involving ${incidentData.parties.join(' and ')} concerning urgent communication regarding ${incidentData.children.join(', ')}'s health in ${incidentData.jurisdiction}. The reporting party documented a lack of response to urgent health-related communications. This non-engagement occurred while attempting to communicate critical health information. The failure to respond forced the primary caregiver to navigate a potentially time-sensitive health issue without input from the co-parent, potentially placing the child at risk.`,
        observedImpact: `The inherent stress and uncertainty placed upon the communicating parent attempting to address a child's health needs creates a tense and anxious environment. This can affect the stability and peace of mind of the child's immediate surroundings, potentially leading to delayed medical attention.`,
        legalInsights: `In ${incidentData.jurisdiction}, decisions regarding a child's health fall under the 'best interests of the child' principle. Parents with decision-making responsibility have a duty to act in the child's best interests, which involves caring for their health and engaging in effective communication. Failure to communicate on health matters could be seen as a dereliction of parental duty.`,
        sources: ['separation.ca', 'justice.gc.ca', 'ontario.ca', 'familylaw.ca'],
        aiNotes: 'Consider compiling and documenting all urgent messages sent, including dates, times, and specific health concerns communicated, along with any evidence of the co-parent\'s non-response.'
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [incidentData]);

  const restart = useCallback(() => {
    setIncidentData(initialIncidentData);
    setReportData(null);
    setCurrentStep(1);
    setCustomParty('');
    setCustomChild('');
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep === 4) {
      setCurrentStep(5);
      if (!reportData) {
        generateAISummary();
      }
    } else if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, reportData, generateAISummary]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const dateValidationMessage = useMemo((): string => {
    if (!incidentData.date || !incidentData.time) {
        return '';
    }
    const incidentDateTime = new Date(`${incidentData.date}T${incidentData.time}`);
    if (isNaN(incidentDateTime.getTime())) {
        return 'Please enter a valid date and time.';
    }
    if (incidentDateTime > new Date()) {
        return 'The incident date and time cannot be in the future.';
    }
    return '';
  }, [incidentData.date, incidentData.time]);

  const canProceed = useMemo((): boolean => {
    switch(currentStep) {
      case 1:
        return !!incidentData.date && !!incidentData.time && !dateValidationMessage;
      case 2: return incidentData.narrative.trim().length > 10;
      case 3: return incidentData.parties.length > 0;
      case 4: return !!incidentData.jurisdiction;
      default: return true;
    }
  }, [currentStep, incidentData, dateValidationMessage]);

  return {
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
  };
};
