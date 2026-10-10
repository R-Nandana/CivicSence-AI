"""
CivicSense NLP Concept 1: Text Classification Engine
Implements TF-IDF Feature Extraction and Multiclass Softmax Logistic Regression
using high-performance NumPy matrix operations with full explainability.
"""

import os
import math
import pickle
import numpy as np
from collections import Counter, defaultdict
from typing import List, Dict, Any, Tuple, Optional

from backend.app.nlp.preprocessing import preprocess_text

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
MODELS_DIR = os.path.join(ROOT_DIR, "models")


class CivicTfidfVectorizer:
    """
    TF-IDF Vectorizer with N-gram (1,2) support, sublinear TF scaling,
    smooth IDF weighting, and L2 vector normalization.
    """
    def __init__(self, max_features: int = 3500, min_df: int = 1, ngram_range: Tuple[int, int] = (1, 2)):
        self.max_features = max_features
        self.min_df = min_df
        self.ngram_range = ngram_range
        self.vocabulary: Dict[str, int] = {}
        self.idf_diag: Optional[np.ndarray] = None
        self.feature_names: List[str] = []

    def _extract_ngrams(self, tokens: List[str]) -> List[str]:
        ngrams = []
        n_min, n_max = self.ngram_range
        for n in range(n_min, n_max + 1):
            for i in range(len(tokens) - n + 1):
                ngram = " ".join(tokens[i:i + n])
                ngrams.append(ngram)
        return ngrams

    def fit(self, raw_documents: List[str]):
        """Fits vocabulary and IDF weights on corpus."""
        doc_count = len(raw_documents)
        df_counter = Counter()
        
        tokenized_docs = []
        for doc in raw_documents:
            tokens = doc.split()
            ngrams = set(self._extract_ngrams(tokens))
            tokenized_docs.append(ngrams)
            for ngram in ngrams:
                df_counter[ngram] += 1
                
        # Filter by min_df and select top max_features
        valid_ngrams = [term for term, freq in df_counter.items() if freq >= self.min_df]
        valid_ngrams.sort(key=lambda t: (-df_counter[t], t))
        selected_ngrams = valid_ngrams[:self.max_features]
        
        self.vocabulary = {term: idx for idx, term in enumerate(selected_ngrams)}
        self.feature_names = selected_ngrams
        
        # Calculate Smooth IDF: idf(t) = ln((1 + N) / (1 + df(t))) + 1.0
        idf_values = np.zeros(len(self.vocabulary), dtype=np.float64)
        for term, idx in self.vocabulary.items():
            df = df_counter[term]
            idf_values[idx] = math.log((1.0 + doc_count) / (1.0 + df)) + 1.0
            
        self.idf_diag = idf_values
        return self

    def transform(self, raw_documents: List[str]) -> np.ndarray:
        """Transforms documents into L2-normalized TF-IDF matrix."""
        n_docs = len(raw_documents)
        n_features = len(self.vocabulary)
        matrix = np.zeros((n_docs, n_features), dtype=np.float64)
        
        for doc_idx, doc in enumerate(raw_documents):
            tokens = doc.split()
            ngrams = self._extract_ngrams(tokens)
            term_counts = Counter(ngrams)
            
            for term, count in term_counts.items():
                if term in self.vocabulary:
                    term_idx = self.vocabulary[term]
                    # Sublinear TF: tf = 1 + ln(count)
                    tf = 1.0 + math.log(count)
                    matrix[doc_idx, term_idx] = tf * self.idf_diag[term_idx]
                    
            # L2 Normalization
            norm = np.linalg.norm(matrix[doc_idx])
            if norm > 0:
                matrix[doc_idx] /= norm
                
        return matrix

    def fit_transform(self, raw_documents: List[str]) -> np.ndarray:
        return self.fit(raw_documents).transform(raw_documents)


class CivicLogisticRegressionClassifier:
    """
    Multiclass Softmax Logistic Regression with L2 regularization
    and Mini-batch Gradient Descent optimizer.
    """
    def __init__(self, learning_rate: float = 0.5, l2_reg: float = 0.0001, max_epochs: int = 300, batch_size: int = 32):
        self.learning_rate = learning_rate
        self.l2_reg = l2_reg
        self.max_epochs = max_epochs
        self.batch_size = batch_size
        self.classes_: List[str] = []
        self.class_to_idx: Dict[str, int] = {}
        self.weights: Optional[np.ndarray] = None
        self.bias: Optional[np.ndarray] = None

    def _softmax(self, z: np.ndarray) -> np.ndarray:
        # Numerically stable softmax
        shift_z = z - np.max(z, axis=1, keepdims=True)
        exps = np.exp(shift_z)
        return exps / np.sum(exps, axis=1, keepdims=True)

    def fit(self, X: np.ndarray, y_labels: List[str]):
        """Fits model parameters (W, b) on training matrix X and labels."""
        self.classes_ = sorted(list(set(y_labels)))
        self.class_to_idx = {c: i for i, c in enumerate(self.classes_)}
        
        n_samples, n_features = X.shape
        n_classes = len(self.classes_)
        
        # One-hot encode targets
        Y = np.zeros((n_samples, n_classes), dtype=np.float64)
        for i, label in enumerate(y_labels):
            Y[i, self.class_to_idx[label]] = 1.0
            
        # Class weighting for balanced gradient steps
        class_counts = np.sum(Y, axis=0)
        class_weights = n_samples / (n_classes * (class_counts + 1e-5))
        
        # Initialize weights with small random Gaussian
        np.random.seed(42)
        self.weights = np.random.randn(n_features, n_classes) * 0.01
        self.bias = np.zeros(n_classes, dtype=np.float64)
        
        indices = np.arange(n_samples)
        
        for epoch in range(self.max_epochs):
            np.random.shuffle(indices)
            X_shuffled = X[indices]
            Y_shuffled = Y[indices]
            
            lr = self.learning_rate * (1.0 / (1.0 + 0.005 * epoch))
            
            for start in range(0, n_samples, self.batch_size):
                end = min(start + self.batch_size, n_samples)
                X_batch = X_shuffled[start:end]
                Y_batch = Y_shuffled[start:end]
                m_batch = end - start
                
                # Forward Pass: Z = X * W + b
                logits = np.dot(X_batch, self.weights) + self.bias
                probs = self._softmax(logits)
                
                # Apply class weights to error
                error = (probs - Y_batch)
                sample_weights = np.dot(Y_batch, class_weights)[:, None]
                weighted_error = error * sample_weights
                
                # Gradients with L2 regularization
                grad_W = (np.dot(X_batch.T, weighted_error) / m_batch) + (self.l2_reg * self.weights)
                grad_b = np.sum(weighted_error, axis=0) / m_batch
                
                # Gradient Descent update
                self.weights -= lr * grad_W
                self.bias -= lr * grad_b
                
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Returns softmax class probabilities."""
        logits = np.dot(X, self.weights) + self.bias
        return self._softmax(logits)

    def predict(self, X: np.ndarray) -> List[str]:
        """Predicts class labels for input matrix X."""
        probs = self.predict_proba(X)
        pred_indices = np.argmax(probs, axis=1)
        return [self.classes_[idx] for idx in pred_indices]


class CivicClassifierModel:
    """Complete Classifier wrapper managing Vectorizer, Classifier, and Persistence."""
    def __init__(self, model_version: str = "v1.0.0"):
        self.model_version = model_version
        self.vectorizer = CivicTfidfVectorizer()
        self.classifier = CivicLogisticRegressionClassifier()
        self.is_trained = False

    def train(self, texts: List[str], labels: List[str]):
        """Preprocesses text, fits TF-IDF, and trains logistic regression classifier."""
        preprocessed_texts = [preprocess_text(t) for t in texts]
        X = self.vectorizer.fit_transform(preprocessed_texts)
        self.classifier.fit(X, labels)
        self.is_trained = True
        return self

    def predict_single(self, text: str) -> Dict[str, Any]:
        """Predicts civic category and confidence score for a complaint."""
        if not self.is_trained:
            self.load()
            
        preprocessed = preprocess_text(text)
        X = self.vectorizer.transform([preprocessed])
        probs = self.classifier.predict_proba(X)[0]
        
        top_idx = int(np.argmax(probs))
        predicted_category = self.classifier.classes_[top_idx]
        confidence = float(probs[top_idx])
        
        all_scores = {
            cls_name: round(float(probs[idx]), 4)
            for idx, cls_name in enumerate(self.classifier.classes_)
        }
        
        return {
            "predicted_category": predicted_category,
            "confidence": round(confidence, 4),
            "model_version": self.model_version,
            "class_probabilities": all_scores
        }

    def save(self, model_path: Optional[str] = None, vec_path: Optional[str] = None):
        """Saves trained model and TF-IDF vectorizer to disk."""
        os.makedirs(MODELS_DIR, exist_ok=True)
        m_path = model_path or os.path.join(MODELS_DIR, "civic_classifier_v1.pkl")
        v_path = vec_path or os.path.join(MODELS_DIR, "tfidf_vectorizer_v1.pkl")
        
        with open(m_path, "wb") as f:
            pickle.dump({
                "classifier": self.classifier,
                "model_version": self.model_version,
                "classes": self.classifier.classes_
            }, f)
            
        with open(v_path, "wb") as f:
            pickle.dump(self.vectorizer, f)
            
        print(f"[Model-Save] Saved classifier to {m_path}")
        print(f"[Model-Save] Saved TF-IDF vectorizer to {v_path}")

    def load(self, model_path: Optional[str] = None, vec_path: Optional[str] = None):
        """Loads model and vectorizer from disk."""
        m_path = model_path or os.path.join(MODELS_DIR, "civic_classifier_v1.pkl")
        v_path = vec_path or os.path.join(MODELS_DIR, "tfidf_vectorizer_v1.pkl")
        
        if not os.path.exists(m_path) or not os.path.exists(v_path):
            raise FileNotFoundError(f"Model files not found at {m_path} or {v_path}. Please train first.")
            
        with open(m_path, "rb") as f:
            m_data = pickle.load(f)
            self.classifier = m_data["classifier"]
            self.model_version = m_data.get("model_version", "v1.0.0")
            
        with open(v_path, "rb") as f:
            self.vectorizer = pickle.load(f)
            
        self.is_trained = True
        return self


# Global singleton classifier instance
civic_classifier = CivicClassifierModel()
