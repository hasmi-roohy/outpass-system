import json
import pickle
import numpy as np
import nltk # type: ignore
from nltk.stem import LancasterStemmer
from sklearn.linear_model import LogisticRegression # pyright: ignore[reportMissingModuleSource]
from sklearn.feature_extraction.text import TfidfVectorizer

# Download nltk data
nltk.download('punkt')
nltk.download('punkt_tab')

# Stemmer — reduces words to root
# "applying" → "apply"
# "applied"  → "apply"
stemmer = LancasterStemmer()

# ─────────────────────────────────────
# Load intents.json
# ─────────────────────────────────────
with open('chatbot/data/intents.json', 'r') as f:
    data = json.load(f)

# ─────────────────────────────────────
# Prepare training data
# ─────────────────────────────────────
sentences = []   # all patterns
labels    = []   # their intent tags

for intent in data['intents']:
    for pattern in intent['patterns']:
        # Stem each word in pattern
        words    = nltk.word_tokenize(pattern.lower())
        stemmed  = ' '.join([stemmer.stem(w) for w in words])
        sentences.append(stemmed)
        labels.append(intent['tag'])

print(f"✅ Total training samples: {len(sentences)}")
print(f"✅ Total intents: {len(set(labels))}")

# ─────────────────────────────────────
# Vectorize sentences
# ─────────────────────────────────────
# TF-IDF converts text to numbers
# so ML model can understand it
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(sentences)
y = labels

# ─────────────────────────────────────
# Train model
# ─────────────────────────────────────
model = LogisticRegression(max_iter=1000)
model.fit(X, y)

print("✅ Model trained successfully!")

# ─────────────────────────────────────
# Save model + vectorizer
# ─────────────────────────────────────
with open('chatbot/model/chatbot_model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('chatbot/model/vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)

print("✅ Model saved to chatbot/model/")
print("✅ Vectorizer saved to chatbot/model/")
print("🎉 Training complete!")
