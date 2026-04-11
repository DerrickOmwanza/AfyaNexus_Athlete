"""
AfyaNexus ML Training Script
Generates synthetic athlete injury risk data and trains a Random Forest model.
Run once: python train_model.py
Output: model.pkl + scaler.pkl
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
import joblib
import random

random.seed(42)
np.random.seed(42)

# ── Feature definitions ────────────────────────────────────────────────────────
MOODS        = ['Excellent', 'Good', 'Neutral', 'Tired', 'Anxious', 'Poor']
MOOD_SCORES  = {'Excellent': 0, 'Good': 1, 'Neutral': 2, 'Tired': 3, 'Anxious': 3, 'Poor': 4}

def rule_based_score(sleep_hours, soreness_level, mood, numbness,
                     intensity, duration_min, heart_rate_avg):
    """Mirrors the existing rule-based engine to generate ground-truth labels."""
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

    score = max(0.0, min(100.0, score))

    # Add realistic noise to prevent overfitting to exact rule boundaries
    noise = np.random.normal(0, 3)
    score = max(0.0, min(100.0, score + noise))

    if score < 35:   return score, 0  # Low
    elif score < 65: return score, 1  # Medium
    else:            return score, 2  # High

# ── Generate synthetic dataset ─────────────────────────────────────────────────
print("Generating synthetic training data...")

N = 8000
records = []

for _ in range(N):
    # Realistic athlete distributions
    sleep_hours    = np.random.normal(7.0, 1.5)
    sleep_hours    = np.clip(sleep_hours, 3.0, 12.0)

    soreness_level = int(np.clip(np.random.normal(4, 2.5), 1, 10))
    mood           = np.random.choice(MOODS, p=[0.15, 0.35, 0.25, 0.15, 0.05, 0.05])
    numbness       = int(np.random.choice([0, 1], p=[0.85, 0.15]))
    intensity      = int(np.clip(np.random.normal(6, 2), 1, 10))
    duration_min   = int(np.clip(np.random.normal(75, 30), 15, 180))
    heart_rate_avg = int(np.clip(np.random.normal(75, 15), 45, 130))

    score, label = rule_based_score(
        sleep_hours, soreness_level, mood, numbness,
        intensity, duration_min, heart_rate_avg
    )

    records.append({
        'sleep_hours':    round(sleep_hours, 1),
        'soreness_level': soreness_level,
        'mood_score':     MOOD_SCORES[mood],
        'numbness':       numbness,
        'intensity':      intensity,
        'duration_min':   duration_min,
        'heart_rate_avg': heart_rate_avg,
        'risk_score':     round(score, 2),
        'risk_label':     label,
    })

df = pd.DataFrame(records)
print(f"Dataset: {len(df)} records")
print(f"Class distribution:\n{df['risk_label'].value_counts().sort_index()}")
print(f"  0=Low: {(df['risk_label']==0).sum()}")
print(f"  1=Medium: {(df['risk_label']==1).sum()}")
print(f"  2=High: {(df['risk_label']==2).sum()}")

# ── Features and target ────────────────────────────────────────────────────────
FEATURES = ['sleep_hours', 'soreness_level', 'mood_score', 'numbness',
            'intensity', 'duration_min', 'heart_rate_avg']

X = df[FEATURES].values
y = df['risk_label'].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── Scale features ─────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

# ── Train Random Forest ────────────────────────────────────────────────────────
print("\nTraining Random Forest Classifier...")
rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train_scaled, y_train)

rf_preds = rf_model.predict(X_test_scaled)
rf_acc   = accuracy_score(y_test, rf_preds)
print(f"Random Forest Accuracy: {rf_acc:.4f} ({rf_acc*100:.1f}%)")

# ── Train Gradient Boosting as comparison ──────────────────────────────────────
print("\nTraining Gradient Boosting Classifier...")
gb_model = GradientBoostingClassifier(
    n_estimators=150,
    max_depth=5,
    learning_rate=0.1,
    random_state=42
)
gb_model.fit(X_train_scaled, y_train)

gb_preds = gb_model.predict(X_test_scaled)
gb_acc   = accuracy_score(y_test, gb_preds)
print(f"Gradient Boosting Accuracy: {gb_acc:.4f} ({gb_acc*100:.1f}%)")

# ── Select best model ──────────────────────────────────────────────────────────
best_model = rf_model if rf_acc >= gb_acc else gb_model
best_name  = "RandomForest" if rf_acc >= gb_acc else "GradientBoosting"
best_acc   = max(rf_acc, gb_acc)

print(f"\nSelected: {best_name} (accuracy: {best_acc*100:.1f}%)")
print("\nClassification Report:")
print(classification_report(y_test, best_model.predict(X_test_scaled),
                             target_names=['Low', 'Medium', 'High']))

# ── Cross-validation ───────────────────────────────────────────────────────────
cv_scores = cross_val_score(best_model, X_train_scaled, y_train, cv=5, scoring='accuracy')
print(f"5-Fold CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ── Feature importance ─────────────────────────────────────────────────────────
if hasattr(best_model, 'feature_importances_'):
    print("\nFeature Importances:")
    for feat, imp in sorted(zip(FEATURES, best_model.feature_importances_),
                             key=lambda x: x[1], reverse=True):
        print(f"  {feat:<20} {imp:.4f}")

# ── Save model and scaler ──────────────────────────────────────────────────────
joblib.dump(best_model, 'model.pkl')
joblib.dump(scaler,     'scaler.pkl')

print(f"\n✅ Model saved: model.pkl")
print(f"✅ Scaler saved: scaler.pkl")
print(f"✅ Model version: v2.0-{best_name.lower()}")
print(f"✅ Training complete — accuracy: {best_acc*100:.1f}%")
