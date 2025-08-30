import os
import json
import re
import google.generativeai as genai
from typing import List, Optional, Dict, Any

class GeminiGroundingService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Data directory path
        self.data_dir = os.path.join(os.path.dirname(__file__), "data")
    
    def _read_supporting_materials(self) -> str:
        """Read all supporting material files and combine them into a single context."""
        supporting_dir = os.path.join(self.data_dir, "supporting-material")
        
        if not os.path.exists(supporting_dir):
            return ""
        
        combined_content = ""
        for filename in sorted(os.listdir(supporting_dir)):
            if filename.endswith('.md'):
                file_path = os.path.join(supporting_dir, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        combined_content += f"\n\n## {filename}\n\n{content}"
                except Exception as e:
                    print(f"Error reading {filename}: {e}")
                    continue
        
        return combined_content
    
    def _read_main_document(self) -> str:
        """Read the main summary document."""
        main_file = os.path.join(self.data_dir, "0_Summary.md")
        
        if not os.path.exists(main_file):
            return ""
        
        try:
            with open(main_file, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading main document: {e}")
            return ""
    
    def _parse_grounding_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the Gemini response into structured data."""
        try:
            # Extract grounding percentage - look for multiple patterns
            percentage_patterns = [
                r'(\d+)%.*(?:grounded|claims)',
                r'Percentage.*?(\d+)%',
                r'grounding.*?(\d+)%',
                r'well-grounded.*?(\d+)%'
            ]
            
            grounding_percentage = 0
            for pattern in percentage_patterns:
                percentage_match = re.search(pattern, response_text, re.IGNORECASE)
                if percentage_match:
                    grounding_percentage = int(percentage_match.group(1))
                    break
            
            # Extract reliability rating
            rating_pattern = r'(FULLY GROUNDED|MOSTLY GROUNDED|PARTIALLY GROUNDED|POORLY GROUNDED|NOT GROUNDED)'
            rating_match = re.search(rating_pattern, response_text, re.IGNORECASE)
            reliability_rating = rating_match.group(1).upper() if rating_match else 'NOT GROUNDED'
            
            # Extract evidence (simplified parsing)
            evidence_section = re.search(r'\*\*1\. ALIGNMENT EVIDENCE:\*\*(.*?)(?=\*\*2\.|$)', response_text, re.DOTALL)
            alignment_evidence = []
            if evidence_section:
                evidence_text = evidence_section.group(1)
                # Look for bullet points or structured evidence
                evidence_items = re.split(r'[-•]\s*(?=.*?:)', evidence_text)
                for item in evidence_items:
                    if len(item.strip()) > 50:  # Filter out short fragments
                        alignment_evidence.append({
                            "claim": item.strip()[:200] + "..." if len(item) > 200 else item.strip(),
                            "supporting_quote": "See full analysis",
                            "source_file": "Supporting Materials",
                            "source_section": "Various",
                            "explanation": "See detailed analysis below"
                        })
            
            # Extract violations
            violations_section = re.search(r'\*\*2\. VIOLATIONS/INACCURACIES:\*\*(.*?)(?=\*\*3\.|$)', response_text, re.DOTALL)
            violations = []
            if violations_section:
                violations_text = violations_section.group(1)
                # Check if it explicitly says "None" or similar
                if re.search(r'(None|No violations|No inaccuracies)', violations_text, re.IGNORECASE):
                    violations = []
                else:
                    violation_items = re.split(r'[-•]\s*(?=.*?:)', violations_text)
                    for item in violation_items:
                        if len(item.strip()) > 50:
                            violations.append({
                                "unsupported_claim": item.strip()[:200] + "..." if len(item) > 200 else item.strip(),
                                "actual_evidence": "See analysis",
                                "source_file": "Supporting Materials",
                                "source_section": "Various",
                                "explanation": "See detailed analysis below"
                            })
            
            # Extract missing context
            context_section = re.search(r'\*\*3\. MISSING CONTEXT:\*\*(.*?)(?=\*\*4\.|$)', response_text, re.DOTALL)
            missing_context = []
            if context_section:
                context_text = context_section.group(1)
                if not re.search(r'(None|No missing|No important)', context_text, re.IGNORECASE):
                    context_items = re.split(r'[-•]\s*', context_text)
                    missing_context = [item.strip() for item in context_items if len(item.strip()) > 20]
            
            # Extract recommendations
            recommendations_section = re.search(r'recommendations.*?:(.*?)$', response_text, re.DOTALL | re.IGNORECASE)
            recommendations = []
            if recommendations_section:
                rec_text = recommendations_section.group(1)
                rec_items = re.split(r'[-•]\s*', rec_text)
                recommendations = [item.strip() for item in rec_items if len(item.strip()) > 10]
            
            # Apply grounding logic validation
            if len(alignment_evidence) == 0:
                grounding_percentage = 0
                reliability_rating = "NOT GROUNDED"
            elif len(violations) > 0:
                # If there are violations, grounding cannot be 100%
                grounding_percentage = min(grounding_percentage, 85)
                if grounding_percentage >= 90:
                    grounding_percentage = 75  # Force down from near-perfect
            
            # Ensure rating matches percentage
            if grounding_percentage >= 90 and len(violations) == 0:
                reliability_rating = "FULLY GROUNDED"
            elif grounding_percentage >= 70:
                reliability_rating = "MOSTLY GROUNDED"
            elif grounding_percentage >= 50:
                reliability_rating = "PARTIALLY GROUNDED"
            elif grounding_percentage >= 25:
                reliability_rating = "POORLY GROUNDED"
            else:
                reliability_rating = "NOT GROUNDED"
            
            return {
                "alignment_evidence": alignment_evidence,
                "violations": violations,
                "missing_context": missing_context,
                "grounding_percentage": grounding_percentage,
                "reliability_rating": reliability_rating,
                "recommendations": recommendations,
                "full_analysis_text": response_text
            }
        except Exception as e:
            print(f"Error parsing grounding response: {e}")
            return {
                "alignment_evidence": [],
                "violations": [],
                "missing_context": [],
                "grounding_percentage": 0,
                "reliability_rating": "NOT GROUNDED",
                "recommendations": ["Error occurred during analysis"],
                "full_analysis_text": response_text
            }
    
    async def ground_text(self, highlighted_text: str) -> Dict[str, Any]:
        """
        Ground the highlighted text against supporting materials using Gemini API.
        
        Args:
            highlighted_text: The text that was highlighted for justification
            
        Returns:
            Structured grounding analysis
        """
        try:
            # Read supporting materials
            supporting_materials = self._read_supporting_materials()
            main_document = self._read_main_document()
            
            if not supporting_materials:
                return {
                    "alignment_evidence": [],
                    "violations": [{"unsupported_claim": "No supporting materials found", "actual_evidence": "", "source_file": "", "source_section": "", "explanation": ""}],
                    "missing_context": [],
                    "grounding_percentage": 0,
                    "reliability_rating": "NOT GROUNDED",
                    "recommendations": ["Add supporting materials for analysis"],
                    "full_analysis_text": "Error: No supporting materials found for grounding analysis."
                }
            
            # Construct the prompt
            prompt = f"""You are an expert fact-checker analyzing whether highlighted text from a summary document is accurately grounded in supporting materials. You must provide detailed evidence and specific citations.

**TASK:** Analyze if the highlighted text below is grounded in reality based on the supporting materials provided.

**MAIN DOCUMENT (Summary):**
{main_document}

**SUPPORTING MATERIALS:**
{supporting_materials}

**HIGHLIGHTED TEXT TO ANALYZE:**
"{highlighted_text}"

**REQUIRED ANALYSIS FORMAT:**

**1. ALIGNMENT EVIDENCE:**
For each claim in the highlighted text that IS supported by the materials, provide:
- The specific claim from the highlighted text
- Direct quote from supporting material that supports it
- File name and section where the evidence is found
- Explanation of how they align

**2. VIOLATIONS/INACCURACIES:**
For each claim in the highlighted text that is NOT supported or contradicted:
- The specific unsupported claim
- What the supporting materials actually say (with quotes)
- File name and section of the contradicting information
- Explanation of the discrepancy

**3. MISSING CONTEXT:**
Identify any important context or nuances from supporting materials that the highlighted text omits or oversimplifies.

**4. OVERALL ASSESSMENT:**

**CRITICAL GROUNDING CALCULATION RULES:**
- If there are NO concrete alignment evidence items found: grounding = 0%
- If there are ANY violations/inaccuracies found: grounding CANNOT be 100%
- Grounding percentage = (Number of supported claims / Total number of claims) × 100
- Only claims with CONCRETE supporting evidence count as "supported"
- Claims with violations, contradictions, or no evidence count as "unsupported"
- 100% grounding is ONLY possible when ALL claims are supported AND there are ZERO violations AND ZERO missing critical context

Calculate:
- Total number of distinct claims in the highlighted text: [NUMBER]
- Number of claims with concrete supporting evidence: [NUMBER]
- Number of claims with violations/contradictions: [NUMBER]
- Number of claims with no supporting evidence: [NUMBER]
- Percentage of claims that are well-grounded: [0-100]%

Overall reliability rating based on grounding percentage:
- 90-100%: FULLY GROUNDED (only if zero violations)
- 70-89%: MOSTLY GROUNDED
- 50-69%: PARTIALLY GROUNDED
- 25-49%: POORLY GROUNDED
- 0-24%: NOT GROUNDED

Key recommendations for improvement

**CITATION FORMAT:** Use [FileName.md - Section] for all references.

**EVIDENCE REQUIREMENTS:** Every claim must be backed by direct quotes from the supporting materials. Generic statements like "this is supported" are not acceptable - you must provide specific quotes and citations."""
            
            # Call Gemini API
            response = self.model.generate_content(prompt)
            
            if response.text:
                return self._parse_grounding_response(response.text)
            else:
                return {
                    "alignment_evidence": [],
                    "violations": [{"unsupported_claim": "No response from AI", "actual_evidence": "", "source_file": "", "source_section": "", "explanation": ""}],
                    "missing_context": [],
                    "grounding_percentage": 0,
                    "reliability_rating": "NOT GROUNDED",
                    "recommendations": ["Retry analysis"],
                    "full_analysis_text": "Error: No response generated from Gemini API."
                }
                
        except Exception as e:
            return {
                "alignment_evidence": [],
                "violations": [{"unsupported_claim": "Analysis error", "actual_evidence": str(e), "source_file": "", "source_section": "", "explanation": ""}],
                "missing_context": [],
                "grounding_percentage": 0,
                "reliability_rating": "NOT GROUNDED",
                "recommendations": ["Check system configuration"],
                "full_analysis_text": f"Error during grounding analysis: {str(e)}"
            }
