#!/usr/bin/env python3

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the backend directory to the path
sys.path.append('/Users/banafshehnasiri/interviews/socratic/backend-ai-content-review')

from gemini_service import GeminiGroundingService

async def test_grounding_logic():
    """Test the grounding logic with different scenarios."""
    
    try:
        service = GeminiGroundingService()
        
        # Test cases with different expected outcomes
        test_cases = [
            {
                "name": "Perfect Match",
                "text": "Small fires (< 100 acres) were once California's ecological maintenance crew.",
                "expected": "Should have high grounding if supporting materials contain this"
            },
            {
                "name": "Partially Correct",
                "text": "In 2023 California had 10,000 wildfires that burned 500,000 acres.",
                "expected": "Should have partial grounding with some violations if numbers are wrong"
            },
            {
                "name": "Completely False",
                "text": "California has never experienced any wildfires in its history.",
                "expected": "Should have 0% grounding with violations"
            }
        ]
        
        print("=== TESTING GROUNDING LOGIC ===\n")
        
        for i, case in enumerate(test_cases, 1):
            print(f"Test {i}: {case['name']}")
            print(f"Text: {case['text']}")
            print(f"Expected: {case['expected']}")
            print("-" * 60)
            
            try:
                result = await service.ground_text(case['text'])
                
                print(f"Grounding Percentage: {result['grounding_percentage']}%")
                print(f"Reliability Rating: {result['reliability_rating']}")
                print(f"Evidence Count: {len(result['alignment_evidence'])}")
                print(f"Violations Count: {len(result['violations'])}")
                print(f"Missing Context Count: {len(result['missing_context'])}")
                
                # Validate logic
                if result['grounding_percentage'] == 100 and len(result['violations']) > 0:
                    print("❌ LOGIC ERROR: 100% grounding with violations!")
                elif result['grounding_percentage'] > 0 and len(result['alignment_evidence']) == 0:
                    print("❌ LOGIC ERROR: >0% grounding with no evidence!")
                else:
                    print("✅ Logic validation passed")
                
                print(f"\nFirst 200 chars of analysis:\n{result['full_analysis_text'][:200]}...\n")
                
            except Exception as e:
                print(f"❌ Error testing case: {e}")
            
            print("=" * 80)
            print()
    
    except Exception as e:
        print(f"Failed to initialize service: {e}")
        return

if __name__ == "__main__":
    asyncio.run(test_grounding_logic())
