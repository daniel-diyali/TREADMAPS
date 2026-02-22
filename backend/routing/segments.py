SEGMENTS = [
    {
        'id': 'seg_01',
        'name': 'Library Road',
        'distance': 320,
        'incline': 10,
        'exposure': 0.7,
        'roof_coverage': 0.3,
        'surface': 'concrete',
        'risk_score': 0.55   # steep + exposed, icy in winter
    },
    {
        'id': 'seg_02',
        'name': 'Glenn Terrell Mall',
        'distance': 350,
        'incline': 4,
        'exposure': 0.9,
        'roof_coverage': 0.2,
        'surface': 'brick',
        'risk_score': 0.70   # brick gets slippery, fully exposed wind tunnel
    },
    {
        'id': 'seg_03',
        'name': 'Fulmer Hall 2nd Floor Hallway',
        'distance': 80,
        'incline': 0,
        'exposure': 0.0,
        'roof_coverage': 1.0,
        'surface': 'tile',
        'risk_score': 0.05   # indoor, flat, fully covered
    },
    {
        'id': 'seg_04',
        'name': 'Todd Hall Stairs (1st to 3rd)',
        'distance': 40,
        'incline': 25,
        'exposure': 0.0,
        'roof_coverage': 1.0,
        'surface': 'tile',
        'risk_score': 0.30   # indoor but steep — fall risk, bad when fatigued
    },
    {
        'id': 'seg_05',
        'name': 'Todd Hall 3rd Floor Exit Path',
        'distance': 120,
        'incline': 2,
        'exposure': 0.1,
        'roof_coverage': 0.8,
        'surface': 'tile',
        'risk_score': 0.08   # mostly covered, nearly flat
    },
    {
        'id': 'seg_06',
        'name': 'CUB to Todd Connector',
        'distance': 200,
        'incline': 1,
        'exposure': 0.5,
        'roof_coverage': 0.0,
        'surface': 'concrete',
        'risk_score': 0.25   # flat but zero cover — bad in rain/snow
    },
    {
        'id': 'seg_07',
        'name': 'NE Spokane St',
        'distance': 450,
        'incline': 2,
        'exposure': 0.5,
        'roof_coverage': 0.2,
        'surface': 'concrete',
        'risk_score': 0.35   # long, moderate exposure
    },
]