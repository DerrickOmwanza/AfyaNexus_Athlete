from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# ── Load trained model and scaler ─────────────────────────────────────────────
MODEL_PATH  = os.path.join(os.path.dirname(__file__), 'model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), 'scaler.pkl')

MOOD_SCORES = {
    'Excellent': 0, 'Good': 1, 'Neutral': 2,
    'Tired': 3, 'Anxious': 3, 'Poor': 4
}

RISK_LABELS = {0: 'Low', 1: 'Medium', 2: 'High'}

# Fallback rule-based engine if model files are missing
def rule_based_score(sleep_hours, soreness_level, mood, numbness,
                     intensity, duration_min, heart_rate_avg):
    score = 0.0
    if sleep_hours < 5:      score += 25
    elif sleep_hours < 6:    score += 18
    elif sleep_hours < 7:    score += 10
    elif sleep_hours >= 8:   score += 0
    else:                    score += 5
    score += (soreness_level / 10) * 25
    mood_penalty = {'Excellent': 0, 'Good': 2, 'Neutral': 6,
                    'Tired': 12, 'Anxious': 10, 'Poor': 15}
    score += mood_penalty.get(mood, 6)
    if numbness:             score += 15
    score += (intensity / 10) * 20
    if duration_min > 120:   score += 10
    elif duration_min > 90:  score += 6
    elif duration_min > 60:  score += 3
    if heart_rate_avg > 100: score += 10
    elif heart_rate_avg > 85: score += 5
    score = max(0.0, min(100.0, round(score, 2)))
    if score < 35:   risk_level = 'Low'
    elif score < 65: risk_level = 'Medium'
    else:            risk_level = 'High'
    return score, risk_level

# Load model
try:
    model  = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    MODEL_VERSION = 'v2.0-ml-gradientboosting'
    USE_ML = True
    print('AfyaNexus ML: Loaded trained scikit-learn model (v2.0)')
except Exception as e:
    model  = None
    scaler = None
    MODEL_VERSION = 'v1.0-rule-based-fallback'
    USE_ML = False
    print(f'AfyaNexus ML: Model not found, using rule-based fallback. ({e})')


def ml_predict(sleep_hours, soreness_level, mood, numbness,
               intensity, duration_min, heart_rate_avg):
    """Run inference using the trained scikit-learn model."""
    mood_score = MOOD_SCORES.get(mood, 2)

    features = np.array([[
        sleep_hours, soreness_level, mood_score,
        int(numbness), intensity, duration_min, heart_rate_avg
    ]])

    features_scaled = scaler.transform(features)

    # Predicted class
    label_idx = int(model.predict(features_scaled)[0])

    # Probability scores for all 3 classes
    proba = model.predict_proba(features_scaled)[0]

    # Convert class probability to a 0-100 risk score
    # Weighted: Low=0-34, Medium=35-64, High=65-100
    risk_score = (proba[0] * 17) + (proba[1] * 49) + (proba[2] * 82)
    risk_score = round(float(np.clip(risk_score, 0, 100)), 2)

    risk_level = RISK_LABELS[label_idx]

    return risk_score, risk_level, proba.tolist()


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'AfyaNexus ML service is running.',
        'model': MODEL_VERSION,
        'ml_active': USE_ML,
    })


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    required = ['sleep_hours', 'soreness_level', 'mood', 'intensity', 'duration_min']
    missing  = [f for f in required if f not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    try:
        sleep_hours    = float(data['sleep_hours'])
        soreness_level = int(data['soreness_level'])
        mood           = str(data.get('mood', 'Good'))
        numbness       = bool(data.get('numbness', False))
        intensity      = int(data['intensity'])
        duration_min   = int(data['duration_min'])
        heart_rate_avg = int(data.get('heart_rate_avg', 70))
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid data types: {str(e)}'}), 400

    if not (0 <= sleep_hours <= 24):
        return jsonify({'error': 'sleep_hours must be between 0 and 24.'}), 400
    if not (1 <= soreness_level <= 10):
        return jsonify({'error': 'soreness_level must be between 1 and 10.'}), 400
    if not (1 <= intensity <= 10):
        return jsonify({'error': 'intensity must be between 1 and 10.'}), 400
    if not (40 <= heart_rate_avg <= 220):
        return jsonify({'error': 'heart_rate_avg must be between 40 and 220 bpm.'}), 400

    if USE_ML:
        risk_score, risk_level, probabilities = ml_predict(
            sleep_hours, soreness_level, mood, numbness,
            intensity, duration_min, heart_rate_avg
        )
        confidence = {
            'low':    round(probabilities[0] * 100, 1),
            'medium': round(probabilities[1] * 100, 1),
            'high':   round(probabilities[2] * 100, 1),
        }
    else:
        risk_score, risk_level = rule_based_score(
            sleep_hours, soreness_level, mood, numbness,
            intensity, duration_min, heart_rate_avg
        )
        confidence = None

    response = {
        'risk_score':    risk_score,
        'risk_level':    risk_level,
        'model_version': MODEL_VERSION,
        'inputs': {
            'sleep_hours':    sleep_hours,
            'soreness_level': soreness_level,
            'mood':           mood,
            'numbness':       numbness,
            'intensity':      intensity,
            'duration_min':   duration_min,
            'heart_rate_avg': heart_rate_avg,
        }
    }

    if confidence:
        response['confidence'] = confidence

    return jsonify(response)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
