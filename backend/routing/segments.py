SEGMENTS = [
    {
        'id': 'seg_01',
        'name': 'Library Road → CUB',
        'destination_key': 'cub',
        'distance': 402,
        'incline': 8,
        'exposure': 0.95,
        'roof_coverage': 0.05,
        'surface': 'asphalt',
        'risk_score': 0.25,
        'waypoints': [],
        'path': [
            {'lat': 46.7339, 'lng': -117.1745},  # Spark
            {'lat': 46.7330, 'lng': -117.1752},  # entering Library Road
            {'lat': 46.7320, 'lng': -117.1763},  # mid Library Road
            {'lat': 46.7310, 'lng': -117.1778},  # upper Library Road, near Holland Library
            {'lat': 46.7303, 'lng': -117.1779},  # approaching CUB
            {'lat': 46.7298, 'lng': -117.1775},  # CUB entrance
        ],
    },
    {
        'id': 'seg_02',
        'name': 'Library Rd → Todd Hall (Elevator) → CUB',
        'destination_key': 'cub',
        'distance': 581,
        'incline': 5,
        'exposure': 0.30,
        'roof_coverage': 0.60,
        'surface': 'asphalt/tile',
        'risk_score': 0.15,
        'waypoints': [],
        'path': [
            {'lat': 46.7339, 'lng': -117.1745},  # Spark
            {'lat': 46.7330, 'lng': -117.1752},  # entering Library Road
            {'lat': 46.7320, 'lng': -117.1763},  # mid Library Road
            {'lat': 46.7316, 'lng': -117.1797},  # Todd Hall south entrance
            {'lat': 46.7312, 'lng': -117.1793},  # Todd Hall interior — elevator
            {'lat': 46.7307, 'lng': -117.1787},  # Todd Hall exit (upper floor)
            {'lat': 46.7303, 'lng': -117.1781},  # path to CUB
            {'lat': 46.7298, 'lng': -117.1775},  # CUB entrance
        ],
    },
    {
        'id': 'seg_03',
        'name': 'Library Rd → Chinook Stairs → Northside Cafe',
        'destination_key': 'northside_cafe',
        'distance': 1411,
        'incline': 10,
        'exposure': 1.0,
        'roof_coverage': 0.0,
        'surface': 'concrete',
        'risk_score': 0.65,
        'waypoints': [],
        'path': [
            {'lat': 46.7339, 'lng': -117.1745},  # Spark
            {'lat': 46.7330, 'lng': -117.1752},  # Library Road
            {'lat': 46.7320, 'lng': -117.1763},  # mid Library Road
            {'lat': 46.7310, 'lng': -117.1778},  # upper Library Road
            {'lat': 46.7318, 'lng': -117.1795},  # turn before Chinook
            {'lat': 46.7335, 'lng': -117.1808},  # top of Chinook stairs
            {'lat': 46.7348, 'lng': -117.1802},  # bottom of stairs, crossing street
            {'lat': 46.7362, 'lng': -117.1793},  # Northside Cafe
        ],
    },
    {
        'id': 'seg_04',
        'name': 'CUB Elevator → Northside Cafe',
        'destination_key': 'northside_cafe',
        'distance': 1245,
        'incline': 4,
        'exposure': 0.50,
        'roof_coverage': 0.50,
        'surface': 'concrete/tile',
        'risk_score': 0.25,
        'waypoints': [],
        'path': [
            {'lat': 46.7339, 'lng': -117.1745},  # Spark
            {'lat': 46.7330, 'lng': -117.1752},  # Library Road
            {'lat': 46.7310, 'lng': -117.1778},  # upper Library Road
            {'lat': 46.7298, 'lng': -117.1775},  # CUB
            {'lat': 46.7300, 'lng': -117.1782},  # CUB elevator, north exit
            {'lat': 46.7320, 'lng': -117.1790},  # road north of CUB
            {'lat': 46.7345, 'lng': -117.1793},  # continuing north
            {'lat': 46.7362, 'lng': -117.1793},  # Northside Cafe
        ],
    },
    {
        'id': 'seg_05',
        'name': 'Todd Hall → Parking Garage → Northside Cafe',
        'destination_key': 'northside_cafe',
        'distance': 1494,
        'incline': 2,
        'exposure': 0.15,
        'roof_coverage': 0.85,
        'surface': 'tile/concrete',
        'risk_score': 0.10,
        'waypoints': [],
        'path': [
            {'lat': 46.7339, 'lng': -117.1745},  # Spark
            {'lat': 46.7325, 'lng': -117.1768},  # path toward Todd
            {'lat': 46.7316, 'lng': -117.1797},  # Todd Hall entrance
            {'lat': 46.7312, 'lng': -117.1793},  # Todd Hall interior
            {'lat': 46.7318, 'lng': -117.1810},  # Todd Hall west exit
            {'lat': 46.7328, 'lng': -117.1823},  # Glenn Terrell Parking Garage
            {'lat': 46.7340, 'lng': -117.1815},  # out of garage, heading north
            {'lat': 46.7355, 'lng': -117.1800},  # path north
            {'lat': 46.7362, 'lng': -117.1793},  # Northside Cafe
        ],
    },
]
