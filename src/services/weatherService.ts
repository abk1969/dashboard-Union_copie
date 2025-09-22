// Service météo utilisant l'API OpenWeatherMap
interface WeatherData {
  temperature: number;
  icon: string;
  description: string;
  city: string;
}

// Clé API OpenWeatherMap (gratuite)
// Vous pouvez obtenir votre clé sur https://openweathermap.org/api
const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Fonction pour obtenir la météo actuelle
export const getCurrentWeather = async (): Promise<WeatherData | null> => {
  try {
    // Vérifier si la clé API est configurée
    if (API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
      console.warn('⚠️ Clé API OpenWeatherMap non configurée, utilisation de données simulées');
      return getSimulatedWeather();
    }

    // Obtenir la position de l'utilisateur
    const position = await getCurrentPosition();
    if (!position) {
      console.warn('⚠️ Impossible d\'obtenir la position, utilisation de données simulées');
      return getSimulatedWeather();
    }

    // Appel à l'API OpenWeatherMap
    const response = await fetch(
      `${BASE_URL}?lat=${position.latitude}&lon=${position.longitude}&appid=${API_KEY}&units=metric&lang=fr`
    );

    if (!response.ok) {
      throw new Error(`Erreur API météo: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      temperature: Math.round(data.main.temp),
      icon: getWeatherIcon(data.weather[0].icon),
      description: data.weather[0].description,
      city: data.name
    };

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la météo:', error);
    // Fallback vers des données simulées en cas d'erreur
    return getSimulatedWeather();
  }
};

// Fonction pour obtenir la position de l'utilisateur
const getCurrentPosition = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.warn('⚠️ Erreur géolocalisation:', error.message);
        resolve(null);
      },
      {
        timeout: 5000,
        enableHighAccuracy: false
      }
    );
  });
};

// Fonction pour convertir les icônes OpenWeatherMap en emojis
const getWeatherIcon = (iconCode: string): string => {
  const iconMap: { [key: string]: string } = {
    '01d': '☀️', // clear sky day
    '01n': '🌙', // clear sky night
    '02d': '⛅', // few clouds day
    '02n': '☁️', // few clouds night
    '03d': '☁️', // scattered clouds
    '03n': '☁️',
    '04d': '☁️', // broken clouds
    '04n': '☁️',
    '09d': '🌧️', // shower rain
    '09n': '🌧️',
    '10d': '🌦️', // rain day
    '10n': '🌧️', // rain night
    '11d': '⛈️', // thunderstorm
    '11n': '⛈️',
    '13d': '❄️', // snow
    '13n': '❄️',
    '50d': '🌫️', // mist
    '50n': '🌫️'
  };

  return iconMap[iconCode] || '🌤️';
};

// Fonction de fallback avec données simulées
const getSimulatedWeather = (): WeatherData => {
  const hour = new Date().getHours();
  let temperature: number;
  let icon: string;

  if (hour >= 6 && hour < 12) {
    icon = '🌅';
    temperature = 18 + Math.floor(Math.random() * 8);
  } else if (hour >= 12 && hour < 18) {
    icon = '☀️';
    temperature = 22 + Math.floor(Math.random() * 10);
  } else if (hour >= 18 && hour < 22) {
    icon = '🌇';
    temperature = 16 + Math.floor(Math.random() * 6);
  } else {
    icon = '🌙';
    temperature = 12 + Math.floor(Math.random() * 4);
  }

  return {
    temperature,
    icon,
    description: 'Données simulées',
    city: 'Votre ville'
  };
};
