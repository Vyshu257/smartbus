"""
ETA prediction. Rule-based today (distance / speed); replace `predict_eta_minutes`
with a call to a trained model (e.g. GradientBoostingRegressor with features
[distanceRemainingKm, avgSpeedKmph, timeOfDayHour, dayOfWeek, routeId,
stopSequenceIndex, historicalAvgDelayMinutes]) once enough historical trip
data has been collected.
"""


def predict_eta_minutes(distance_remaining_km: float, avg_speed_kmph: float = 32.0) -> int:
    if distance_remaining_km <= 0:
        return 0
    hours = distance_remaining_km / max(avg_speed_kmph, 1e-6)
    return round(hours * 60)
