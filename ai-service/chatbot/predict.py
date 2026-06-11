import pickle
import nltk
from nltk.stem import LancasterStemmer
import json

stemmer = LancasterStemmer()

# Load trained model + vectorizer
with open('chatbot/model/chatbot_model.pkl', 'rb') as f:
    model = pickle.load(f)

with open('chatbot/model/vectorizer.pkl', 'rb') as f:
    vectorizer = pickle.load(f)

# Load intents for responses
with open('chatbot/data/intents.json', 'r') as f:
    data = json.load(f)

def predict_intent(message):
    try:
        # Clean + stem message
        words   = nltk.word_tokenize(message.lower())
        stemmed = ' '.join([stemmer.stem(w) for w in words])

        # Vectorize
        X = vectorizer.transform([stemmed])

        # Predict intent
        intent = model.predict(X)[0]

        # Find response for this intent
        for i in data['intents']:
            if i['tag'] == intent:
                return {
                    "intent": intent,
                    "reply":  i['response']
                }

        return {
            "intent": "unknown",
            "reply":  "I did not understand that. Can you rephrase?"
        }

    except Exception as e:
        print(f"❌ predict error: {e}")
        return {
            "intent": "unknown",
            "reply":  "Sorry I am having trouble. Try again."
        }
