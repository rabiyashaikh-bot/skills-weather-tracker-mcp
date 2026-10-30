import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let database;

// Open the workspace database and ensure its checked-in schema is installed.
function getDatabase() {
  if (!database) {
    database = new Database(fileURLToPath(new URL('../weather.db', import.meta.url)));
    const schema = readFileSync(fileURLToPath(new URL('../db/schema.sql', import.meta.url)), 'utf8');
    database.exec(schema);
  }

  return database;
}

// Insert a weather observation using bound parameters.
export function insertWeatherLog(weather) {
  const statement = getDatabase().prepare(`
    INSERT INTO weather_logs (
      city, country, latitude, longitude, temperature_c,
      humidity, wind_kmh, condition, weather_code
    ) VALUES (
      @city, @country, @latitude, @longitude, @temperature_c,
      @humidity, @wind_kmh, @condition, @weather_code
    )
  `);

  return statement.run(weather).lastInsertRowid;
}

// Return the newest observations, limited by a caller-validated count.
export function listWeatherLogs(limit) {
  return getDatabase().prepare(`
    SELECT city, country, temperature_c, humidity, wind_kmh, condition, created_at
    FROM weather_logs
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT ?
  `).all(limit);
}

// Aggregate temperature readings for a city without regard to letter case.
export function getCityStats(city) {
  return getDatabase().prepare(`
    SELECT COUNT(*) AS count,
           MIN(temperature_c) AS minimum,
           MAX(temperature_c) AS maximum,
           AVG(temperature_c) AS average
    FROM weather_logs
    WHERE city = ? COLLATE NOCASE
  `).get(city);
}