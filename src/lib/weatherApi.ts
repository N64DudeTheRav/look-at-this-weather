export interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    pressure: number;
    visibility: number;
    cloudCover: number;
    weatherCode: number;
    uvIndex: number;
    dewPoint: number;
  };
  hourly: Array<{
    time: string;
    timeISO: string;
    temperature: number;
    weatherCode: number;
    precipitation: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    humidity: number;
  }>;
  daily: Array<{
    date: string;
    temperatureMax: number;
    temperatureMin: number;
    weatherCode: number;
    sunrise: string;
    sunset: string;
  }>;
  currentTime: string;
}

export async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
  console.log("Fetching weather for coordinates:", { latitude, longitude });
  
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-tropometrics.odspieg.nl';

  const response = await fetch(`${BASE_URL}/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m,wind_direction_10m,wind_gusts_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`);

  
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Calculate visibility (Open-Meteo doesn't provide it, so we'll estimate based on conditions)
  const visibility = data.current.cloud_cover < 50 ? 44.2 : data.current.cloud_cover < 80 ? 20 : 10;
  
  // Calculate dew point (approximation)
  const temp = data.current.temperature_2m;
  const humidity = data.current.relative_humidity_2m;
  const dewPoint = temp - ((100 - humidity) / 5);

  return {
    current: {
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      windDirection: data.current.wind_direction_10m,
      windGusts: Math.round(data.current.wind_gusts_10m),
      pressure: Math.round(data.current.pressure_msl),
      visibility: visibility,
      cloudCover: data.current.cloud_cover,
      weatherCode: data.current.weather_code,
      uvIndex: data.current.uv_index || 0,
      dewPoint: Math.round(dewPoint),
    },
    hourly: data.hourly.time.slice(0, 24).map((time: string, index: number) => ({
      time: new Date(time).toLocaleTimeString('en-US', { hour: 'numeric' }),
      timeISO: time,
      temperature: Math.round(data.hourly.temperature_2m[index]),
      weatherCode: data.hourly.weather_code[index],
      precipitation: data.hourly.precipitation_probability[index] || 0,
      windSpeed: Math.round(data.hourly.wind_speed_10m[index]),
      windDirection: data.hourly.wind_direction_10m[index],
      windGusts: Math.round(data.hourly.wind_gusts_10m[index]),
      humidity: data.hourly.relative_humidity_2m[index],
    })),
    daily: data.daily.time.slice(0, 7).map((date: string, index: number) => ({
      date: date,
      temperatureMax: Math.round(data.daily.temperature_2m_max[index]),
      temperatureMin: Math.round(data.daily.temperature_2m_min[index]),
      weatherCode: data.daily.weather_code[index],
      sunrise: data.daily.sunrise[index],
      sunset: data.daily.sunset[index],
    })),
    currentTime: data.current.time,
  };
}

export function getWeatherDescription(code: number): string {
  const weatherCodes: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return weatherCodes[code] || 'Unknown';
}

export function getWeatherIcon(
  code: number, 
  time?: string, 
  sunrise?: string, 
  sunset?: string
): 'sun' | 'moon' | 'cloud' | 'cloudRainLight' | 'cloudRain' | 'cloudRainHeavy' | 'cloudSun' | 'cloudMoon' {
  // Determine if it's nighttime
  let isNight = false;
  if (time && sunrise && sunset) {
    const currentTime = new Date(time).getTime();
    const sunriseTime = new Date(sunrise).getTime();
    const sunsetTime = new Date(sunset).getTime();
    isNight = currentTime < sunriseTime || currentTime > sunsetTime;
  }

  // Clear sky
  if (code === 0) return isNight ? 'moon' : 'sun';
  if (code === 1) return isNight ? 'moon' : 'sun';
  
  // Partly cloudy
  if (code === 2 || code === 3) return isNight ? 'cloudMoon' : 'cloudSun';
  
  // Rain with different intensities
  if (code >= 51 && code <= 55) return 'cloudRainLight'; // Drizzle
  if (code >= 56 && code <= 57) return 'cloudRainLight'; // Freezing drizzle
  if (code === 61) return 'cloudRainLight'; // Slight rain
  if (code === 63) return 'cloudRain'; // Moderate rain
  if (code >= 65 && code <= 67) return 'cloudRainHeavy'; // Heavy rain
  if (code >= 80 && code <= 81) return 'cloudRain'; // Rain showers
  if (code === 82) return 'cloudRainHeavy'; // Violent rain showers
  if (code >= 95 && code <= 99) return 'cloudRainHeavy'; // Thunderstorm
  
  // Snow
  if (code >= 71 && code <= 77) return 'cloudRain';
  if (code >= 85 && code <= 86) return 'cloudRain';
  
  // Fog or other conditions
  return 'cloud';
}
