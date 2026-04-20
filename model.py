import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

# TRAINED MODEL (simplified example)
model = RandomForestClassifier()

def predict_risk(features):

    # features:
    # [amount, days_left, past_missed, avg_delay]

    amount = features[0]
    days_left = features[1]
    missed = features[2]
    delay = features[3]

    score = (
        (amount / 1000) +
        (10 - days_left) +
        missed * 2 +
        delay
    )

    if score > 15:
        return "HIGH_RISK"
    elif score > 8:
        return "MEDIUM_RISK"
    else:
        return "LOW_RISK"