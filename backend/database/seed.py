import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()
from backend.database.snowflake import execute_query

NOW = datetime.utcnow()


def random_timestamp():
    return NOW - timedelta(hours=random.uniform(0, 24))


route_sql = """
    INSERT INTO ROUTE_EVENTS (timestamp, route_mode, score, temperature, precipitation, user_fatigue)
    VALUES (%s, %s, %s, %s, %s, %s)
"""

risk_sql = """
    INSERT INTO ENVIRONMENTAL_RISK (timestamp, temperature, wind_speed, precipitation, risk_score)
    VALUES (%s, %s, %s, %s, %s)
"""

for _ in range(50):
    mode = random.choice(["safe", "fast", "comfortable"])
    score = round(random.uniform(0.3, 0.9), 4)
    temp = round(random.uniform(28, 45), 2)
    precip = round(random.uniform(0, 8), 2)
    fatigue = round(random.uniform(0, 1), 4)
    execute_query(route_sql, (random_timestamp(), mode, score, temp, precip, fatigue))

print("Seeded 50 rows into ROUTE_EVENTS")

for _ in range(50):
    temp = round(random.uniform(28, 45), 2)
    wind = round(random.uniform(5, 30), 2)
    precip = round(random.uniform(0, 8), 2)
    risk_score = round(
        (0.4 if temp < 32 else 0.1) + (0.2 if wind > 20 else 0) + (0.3 if precip > 5 else 0),
        4,
    )
    execute_query(risk_sql, (random_timestamp(), temp, wind, precip, risk_score))

print("Seeded 50 rows into ENVIRONMENTAL_RISK")
