"""
CivicSense Integrated NLP Pipeline (Phase I: Concepts 1 + 2 + 3)
Connects:
1. Multilingual Processing & Language Detection
2. Text Preprocessing & TF-IDF Feature Extraction
3. Multiclass Softmax Logistic Regression Classification
4. Domain-Specific Named Entity Recognition (NER)
"""

import os
import sys
from typing import Dict, Any, List

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from backend.app.nlp.multilingual import multilingual_processor
from backend.app.nlp.preprocessing import preprocess_text
from backend.app.nlp.classifier import civic_classifier
from backend.app.nlp.ner import civic_ner
from backend.app.nlp.translation import machine_translator
from backend.app.nlp.verification import complaint_verifier




class CivicNLPIntegratedPipeline:
    """Unified Phase I NLP Pipeline."""

    def __init__(self):
        # Ensure classifier model is loaded
        try:
            civic_classifier.load()
        except Exception:
            # Model might not be trained yet during initial setup
            pass

    def process_complaint(self, raw_text: str, user_location: str = "") -> Dict[str, Any]:
        """
        Executes complete integrated Phase I NLP pipeline:
        1. Detects Language (English / Tamil / Tanglish)
        2. Preserves raw complaint while generating normalized common representation
        3. Preprocesses text
        4. Predicts Civic Issue Category & Confidence Score
        5. Extracts Entities (LOCATION, INFRASTRUCTURE, DURATION, DEPARTMENT)
        6. Assembles structured complaint record
        """
        if not raw_text or not raw_text.strip():
            return {
                "error": "Empty complaint text provided."
            }
            
        clean_input = raw_text.strip()
        
        # STEP 1: Multilingual Detection & Representation
        detected_language = multilingual_processor.detect_language(clean_input)
        original_text, normalized_text = multilingual_processor.normalize_multilingual(clean_input, detected_language)

        # STEP 1.5: Machine Translation (Tamil/Tanglish -> English)
        translation_result = machine_translator.translate_to_english(clean_input, source_lang=detected_language)
        translated_text = translation_result["translated_text"]

        # STEP 2: NLP Preprocessing
        preprocessed_for_ml = preprocess_text(normalized_text)

        # STEP 3: Text Classification (Concept 1)
        classification_result = civic_classifier.predict_single(normalized_text)
        predicted_category = classification_result["predicted_category"]
        confidence = classification_result["confidence"]

        # STEP 4: Named Entity Recognition
        entities_original = civic_ner.extract_entities(clean_input, predicted_category=predicted_category)

        # Extract location entity if found
        extracted_location = None
        for ent in entities_original:
            if ent["entity_type"] == "LOCATION":
                extracted_location = ent["entity_text"]
                break

        primary_location = user_location.strip() if user_location and user_location.strip() else (extracted_location or "")

        # STEP 5: Complaint Truthfulness & Geographic Verifiability Check
        verification = complaint_verifier.verify_complaint(
            text=clean_input,
            location=primary_location,
            predicted_category=predicted_category,
            confidence=confidence,
            entities=entities_original
        )

        # Structure final integrated result
        return {
            "original_text": original_text,
            "language": detected_language,
            "translated_text": translated_text,
            "translation_info": translation_result,
            "normalized_processing_text": normalized_text,
            "preprocessed_tokens": preprocessed_for_ml,
            "predicted_category": predicted_category,
            "confidence": confidence,
            "model_version": classification_result.get("model_version", "v1.0.0"),
            "class_probabilities": classification_result.get("class_probabilities", {}),
            "entities": entities_original,
            "extracted_location": extracted_location,
            "primary_location": primary_location or "Unspecified Location",
            "verification": verification,
            "source": "User_Submitted",
            "status": "New"
        }




# Global singleton pipeline instance
nlp_pipeline = CivicNLPIntegratedPipeline()


if __name__ == "__main__":
    print("================ INTEGRATED NLP PIPELINE DEMONSTRATION ================")
    
    samples = [
        "The streetlight near the bus stand has been off for four days.",
        "There is a huge pothole near Anna Nagar junction causing vehicle damage for past 2 weeks.",
        "Bus stand pakkathula streetlight 4 days ah work aagala.",
        "எங்கள் பகுதியில் மூன்று நாட்களாக குடிநீர் வரவில்லை.",
        "Severe sewage manhole overflow at 7th Ave and 34th St since yesterday morning."
    ]
    
    for s in samples:
        result = nlp_pipeline.process_complaint(s)
        print("\n" + "-"*60)
        print(f"INPUT COMPLAINT : {result['original_text']}")
        print(f"LANGUAGE        : {result['language']}")
        print(f"PREDICTED CAT   : {result['predicted_category']} (Confidence: {result['confidence']*100:.1f}%)")
        print(f"ENTITIES EXTRACTED:")
        for e in result["entities"]:
            print(f"  * {e['entity_type'].ljust(15)}: {e['entity_text']}")
