export interface Evidence {
  claim: string;
  supporting_quote: string;
  source_file: string;
  source_section: string;
  explanation: string;
}

export interface Violation {
  unsupported_claim: string;
  actual_evidence: string;
  source_file: string;
  source_section: string;
  explanation: string;
}

export interface GroundingAnalysis {
  alignment_evidence: Evidence[];
  violations: Violation[];
  missing_context: string[];
  grounding_percentage: number;
  reliability_rating: string;
  recommendations: string[];
  full_analysis_text: string;
}

export interface HighlightedText {
  text: string;
  startIndex: number;
  endIndex: number;
  type: 'justify' | 'thumbs-up' | 'thumbs-down' | 'comment';
  id: string;
  comment?: string; // Optional comment text for comment type highlights
  grounding_analysis?: GroundingAnalysis; // AI grounding analysis for justify highlights
}
