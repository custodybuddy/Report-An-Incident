
import { GoogleGenAI, Type } from "@google/genai";
import type { IncidentData, ReportData } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder. Please set your API key for the app to function.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "YOUR_API_KEY_HERE" });

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "Brief descriptive title of the incident" },
        category: { type: Type.STRING, description: "One of: Child Safety/Welfare Concern, Communication Issues, Schedule Violations, Breach of Court Order, Parental Alienation, Inappropriate Behavior, Financial Disputes, or Other" },
        severity: { type: Type.STRING, description: "Low, Medium, or High" },
        severityJustification: { type: Type.STRING, description: "1-2 sentence explanation of why this severity level was assigned" },
        professionalSummary: { type: Type.STRING, description: "Comprehensive 2-3 paragraph professional summary removing emotional language while preserving all factual details, dates, times, and specific actions" },
        observedImpact: { type: Type.STRING, description: "1-2 paragraph analysis of the potential or observed impact on the children involved" },
        legalInsights: { type: Type.STRING, description: "2-3 paragraph analysis of relevant family law principles, jurisdictional considerations, and legal implications specific to the provided jurisdiction" },
        sources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3-5 potential legal or informational sources like 'justice.gc.ca'" },
        aiNotes: { type: Type.STRING, description: "Brief notes about documentation completeness and recommendations for evidence collection" },
    },
    required: ["title", "category", "severity", "severityJustification", "professionalSummary", "observedImpact", "legalInsights", "sources", "aiNotes"]
};

export const generateIncidentReport = async (incidentData: IncidentData): Promise<ReportData> => {
    const prompt = `You are a legal documentation AI specialist. Analyze this co-parenting incident and generate a comprehensive report in JSON format.

    INCIDENT DETAILS:
    - Date: ${incidentData.date}
    - Time: ${incidentData.time}
    - Jurisdiction: ${incidentData.jurisdiction}
    - Parties Involved: ${incidentData.parties.join(', ')}
    - Children Present/Affected: ${incidentData.children.join(', ') || 'None specified'}
    - Evidence Attached: ${incidentData.evidence.length} file(s)
    - Original Account: ${incidentData.narrative}

    Analyze the incident details and generate a JSON object that strictly adheres to the provided schema. Focus on objective, factual reporting suitable for legal review.
    For the legalInsights, provide analysis specific to family law in ${incidentData.jurisdiction}.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: reportSchema,
        },
    });

    const responseText = response.text;
    const parsedData = JSON.parse(responseText);
    return parsedData as ReportData;
};
