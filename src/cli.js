import { getCityStats, insertWeatherLog, listWeatherLogs } from './db.js';
import { fetchCurrentWeather } from './weather.js';

const usage = `Usage:
  node src/cli.js add "<city>"
  node src/cli.js list [--limit N]
  node src/cli.js stats "<city>"`;

// Format rows as a compact, aligned text table.
function printTable(rows) {
  const columns = [
    ['CITY', 'city'],
    ['COUNTRY', 'country'],
    ['TEMP C', 'temperature_c'],
    ['HUMIDITY %', 'humidity'],
    ['WIND KM/H', 'wind_kmh'],
    ['CONDITION', 'condition'],
    ['CREATED AT', 'created_at']
  ];
  const values = rows.map((row) => columns.map(([, key]) => String(row[key] ?? '')));
  const widths = columns.map(([label], index) =>
    Math.max(label.length, ...values.map((row) => row[index].length))
  );
  const formatRow = (cells) => cells.map((cell, index) => cell.padEnd(widths[index])).join('  ');

  console.log(formatRow(columns.map(([label]) => label)));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const row of values) {
    console.log(formatRow(row));
  }
}

// Parse and validate the optional result limit.
function parseLimit(args) {
  if (args.length === 0) {
    return 10;
  }
  if (args.length !== 2 || args[0] !== '--limit' || !/^\d+$/.test(args[1])) {
    throw new Error('Use list [--limit N] with a positive integer N.');
  }

  const limit = Number(args[1]);
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('The list limit must be a positive integer.');
  }
  return limit;
}

// Dispatch a CLI command and print user-facing results.
async function main(args) {
  const [command, ...commandArgs] = args;

  if (command === 'add') {
    const city = commandArgs.join(' ').trim();
    if (!city) {
      throw new Error(`Provide a city name.\n\n${usage}`);
    }

    const weather = await fetchCurrentWeather(city);
    const id = insertWeatherLog(weather);
    console.log(
      `Logged ${weather.city}, ${weather.country}: ${weather.temperature_c} C, ` +
      `${weather.condition} (id ${id}).`
    );
    return;
  }

  if (command === 'list') {
    const limit = parseLimit(commandArgs);
    const rows = listWeatherLogs(limit);
    if (rows.length === 0) {
      console.log('No weather logs found.');
      return;
    }
    printTable(rows);
    return;
  }

  if (command === 'stats') {
    const city = commandArgs.join(' ').trim();
    if (!city) {
      throw new Error(`Provide a city name.\n\n${usage}`);
    }

    const stats = getCityStats(city);
    if (stats.count === 0) {
      console.log(`No weather logs found for "${city}".`);
      return;
    }
    console.log(
      `${city}: ${stats.count} logs, min ${stats.minimum} C, ` +
      `max ${stats.maximum} C, average ${stats.average.toFixed(1)} C.`
    );
    return;
  }

  throw new Error(usage);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});