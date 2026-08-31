"""
Crowd/occupancy prediction. Rule-based today: projects current occupancy
forward using an average net boarding rate per remaining stop. Replace with
a trained model (e.g. RandomForestRegressor with features
[currentOccupancyPercent, stopsRemaining, timeOfDayHour, dayOfWeek, routeId,
historicalBoardingPattern]) once historical ticket data is available.
"""

CROWD_THRESHOLDS = {"low": 40, "moderate": 75}


def crowd_level_for(percent: float) -> str:
    if percent <= CROWD_THRESHOLDS["low"]:
        return "LOW"
    if percent <= CROWD_THRESHOLDS["moderate"]:
        return "MODERATE"
    return "HIGH"


def predict_crowd_percent(
    current_occupancy_percent: float,
    stops_remaining: int,
    avg_boarding_per_stop: float = 6.0,
    avg_alighting_per_stop: float = 4.0,
) -> tuple[float, str]:
    net_per_stop = avg_boarding_per_stop - avg_alighting_per_stop
    projected = current_occupancy_percent + net_per_stop * max(stops_remaining, 0)
    projected = max(0.0, min(100.0, projected))
    return round(projected, 1), crowd_level_for(projected)
