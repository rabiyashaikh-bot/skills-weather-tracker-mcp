# Open-Meteo API Notes

## Geocoding

Endpoint: `https://geocoding-api.open-meteo.com/v1/search`

Query parameters used: `name=Pune` and `count=1`.

Fields used from `results[0]`:

- `name` -> `city`
- `country` -> `country`
- `latitude` -> `latitude`
- `longitude` -> `longitude`

Trimmed live response:

```json
{
  "results": [
    {
      "name": "Pune",
      "latitude": 18.51957,
      "longitude": 73.85535,
      "country": "India"
    }
  ]
}
```

## Current Weather

Endpoint: `https://api.open-meteo.com/v1/forecast`

Query parameters used: `latitude`, `longitude`, and
`current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`.

Fields used from `current`:

- `temperature_2m` -> `temperature_c` (degrees Celsius)
- `relative_humidity_2m` -> `humidity` (percent)
- `wind_speed_10m` -> `wind_kmh` (kilometres per hour; confirm via `current_units`)
- `weather_code` -> `weather_code`; `condition` can be derived from this code

The fetch MCP server denied access to this endpoint via its `robots.txt` policy,
so no live weather response was available. This is the expected trimmed response
shape, not a captured response:

```json
{
  "current_units": {
    "temperature_2m": "<unit>",
    "relative_humidity_2m": "%",
    "wind_speed_10m": "<unit>",
    "weather_code": "wmo code"
  },
  "current": {
    "temperature_2m": "<value>",
    "relative_humidity_2m": "<value>",
    "wind_speed_10m": "<value>",
    "weather_code": "<value>"
  }
}
```