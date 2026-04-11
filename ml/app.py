from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def calculate_risk(sleep_hours, soreness_level, mood, numbness,
                   intensity, duration_min, heart_rate_avg):
    """
    Rule-based injury risk scoring engine.
    Score range: 0 (no risk) → 100 (very high risk).
    Designed to be swapped with a trained ML model later.
    """
    score = 0.0

    # ── Sleep (poor sleep = higher risk) ──────────────────────
    if sleep_hours < 5:
        score += 25
    elif sleep_hours < 6:
        score += 18
    elif sleep_hours < 7:
        score += 10
    elif sleep_hours >= 8:
        score += 0
    else:
        score += 5

    # ── Soreness (1–10 scale) ──────────────────────────────────
    score += (soreness_level / 10) * 25

    # ── Mood ──────────────────────────────────────────────────
    mood_penalty = {
        'Excellent': 0, 'Good': 2, 'Neutral': 6,
        'Tired': 12, 'Anxious': 10, 'Poor': 15
    }
    score += mood_penalty.get(mood, 6)

    # ── Numbness (binary flag) ─────────────────────────────────
    if numbness:
        score += 15

    # ── Training intensity (1–10 scale) ───────────────────────
    score += (intensity / 10) * 20

    # ── Duration (long sessions increase risk) ────────────────
    if duration_min > 120:
        score += 10
    elif duration_min > 90:
        score += 6
    elif duration_min > 60:
        score += 3

    # ── Heart rate (elevated resting HR = fatigue signal) ─────
    if heart_rate_avg > 100:
        score += 10
    elif heart_rate_avg > 85:
        score += 5

    # Clamp to 0–100
    score = max(0.0, min(100.0, round(score, 2)))

    # Risk level thresholds
    if score < 35:
        risk_level = 'Low'
    elif score < 65:
        risk_level = 'Medium'
    else:
        risk_level = 'High'

    return score, risk_level


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'AfyaNexus ML service is running.', 'model': 'v1.0-rule-based'})


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    required = ['sleep_hours', 'soreness_level', 'mood', 'intensity', 'duration_min']
    missing = [f for f in required if f not in data]
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

    # Validate ranges
    if not (0 <= sleep_hours <= 24):
        return jsonify({'error': 'sleep_hours must be between 0 and 24.'}), 400
    if not (1 <= soreness_level <= 10):
        return jsonify({'error': 'soreness_level must be between 1 and 10.'}), 400
    if not (1 <= intensity <= 10):
        return jsonify({'error': 'intensity must be between 1 and 10.'}), 400

    risk_score, risk_level = calculate_risk(
        sleep_hours, soreness_level, mood, numbness,
        intensity, duration_min, heart_rate_avg
    )

    return jsonify({
        'risk_score': risk_score,
        'risk_level': risk_level,
        'model_version': 'v1.0-rule-based',
        'inputs': {
            'sleep_hours': sleep_hours,
            'soreness_level': soreness_level,
            'mood': mood,
            'numbness': numbness,
            'intensity': intensity,
            'duration_min': duration_min,
            'heart_rate_avg': heart_rate_avg,
        }
    })


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=False)
