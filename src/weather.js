const weatherConditions = new Map([
  [0, 'Clear'],
  [1, 'Mainly clear'],
  [2, 'Partly cloudy'],
  [3, 'Cloudy'],
  [45, 'Fog'],
  [48, 'Depositing rime fog'],
  [51, 'Light drizzle'],
  [53, 'Drizzle'],
  [55, 'Heavy drizzle'],
  [56, 'Freezing drizzle'],
  [57, 'Heavy freezing drizzle'],
  [61, 'Light rain'],
  [63, 'Rain'],
  [65, 'Heavy rain'],
  [66, 'Freezing rain'],
  [67, 'Heavy freezing rain'],
  [71, 'Light snow'],
  [73, 'Snow'],
  [75, 'Heavy snow'],
  [77, 'Snow grains'],
  [80, 'Light rain showers'],
  [81, 'Rain showers'],
  [82, 'Heavy rain showers'],
  [85, 'Light snow showers'],
  [86, 'Heavy snow showers'],
  [95, 'Thunderstorm'],
  [96, 'Thunderstorm with light hail'],
  [99, 'Thunderstorm with heavy hail']
]);

// Convert a WMO weather code into a readable condition.
export function describeWeatherCode(code) {
  return weatherConditions.get(code) ?? `Unknown condition (${code})`;
}

// Fetch the city's coordinates and current weather from Open-Meteo.
export async function fetchCurrentWeather(city) {
  const geocodingUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
  geocodingUrl.searchParams.set('name', city);
  geocodingUrl.searchParams.set('count', '1');

  let geocodingResponse;
  try {
    geocodingResponse = await fetch(geocodingUrl);
  } catch {
    throw new Error('Could not reach Open-Meteo geocoding. Check your network and try again.');
  }
  if (!geocodingResponse.ok) {
    throw new Error(`Open-Meteo geocoding returned HTTP ${geocodingResponse.status}.`);
  }

  let geocodingData;
  try {
    geocodingData = await geocodingResponse.json();
  } catch {
    throw new Error('Open-Meteo geocoding returned an invalid response.');
  }

  const place = geocodingData.results?.[0];
  if (!place) {
    throw new Error(`Unknown city: "${city}". Check the spelling and try again.`);
  }

  const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
  weatherUrl.searchParams.set('latitude', String(place.latitude));
  weatherUrl.searchParams.set('longitude', String(place.longitude));
  weatherUrl.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code'
  );
  weatherUrl.searchParams.set('temperature_unit', 'celsius');
  weatherUrl.searchParams.set('wind_speed_unit', 'kmh');

  let weatherResponse;
  try {
    weatherResponse = await fetch(weatherUrl);
  } catch {
    throw new Error('Could not reach Open-Meteo weather. Check your network and try again.');
  }
  if (!weatherResponse.ok) {
    throw new Error(`Open-Meteo weather returned HTTP ${weatherResponse.status}.`);
  }

  let weatherData;
  try {
    weatherData = await weatherResponse.json();
  } catch {
    throw new Error('Open-Meteo weather returned an invalid response.');
  }

  const current = weatherData.current;
  if (
    !current ||
    !Number.isFinite(current.temperature_2m) ||
    !Number.isInteger(current.relative_humidity_2m) ||
    !Number.isFinite(current.wind_speed_10m) ||
    !Number.isInteger(current.weather_code)
  ) {
    throw new Error('Open-Meteo weather response is missing current conditions.');
  }

  return {
    city: place.name,
    country: place.country ?? null,
    latitude: place.latitude,
    longitude: place.longitude,
    temperature_c: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    wind_kmh: current.wind_speed_10m,
    condition: describeWeatherCode(current.weather_code),
    weather_code: current.weather_code
  };
}