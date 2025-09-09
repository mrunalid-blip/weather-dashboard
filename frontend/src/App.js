import { useState } from "react";
import axios from "axios";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);

 const getWeather = async () => {
  if (!city) return alert("Please enter a city name!");

  try {
    // Current weather
    const res = await axios.get(`http://localhost:5000/weather/${city}`);
    setWeather(res.data);
  } catch (err) {
    setWeather(null);
    alert("City not found for current weather!");
    return; // stop here if city is invalid
  }

  try {
    // Forecast (only if weather worked)
    const forecastRes = await axios.get(`http://localhost:5000/forecast/${city}`);
    const daily = forecastRes.data.list.filter((_, index) => index % 8 === 0);
    setForecast(daily);
  } catch (err) {
    setForecast([]); // no forecast, but still show current weather
    console.warn("Forecast not available");
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-800 flex flex-col items-center justify-center px-4">
      {/* Title */}
      <h1 className="text-4xl font-bold text-white mb-8 drop-shadow-lg">
        🌍 Weather Dashboard
      </h1>

      {/* Search Bar */}
      <div className="flex w-full max-w-md mb-10">
        <input
          type="text"
          value={city}
          placeholder="Enter city (e.g. Hyderabad,IN)"
          onChange={(e) => setCity(e.target.value)}
          className="flex-grow px-4 py-3 rounded-l-xl text-gray-800 focus:outline-none"
        />
        <button
          onClick={getWeather}
          className="bg-yellow-400 text-black px-6 py-3 rounded-r-xl font-semibold hover:bg-yellow-500 transition"
        >
          Search
        </button>
      </div>

      {/* Weather Card */}
      {weather && (
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md text-center shadow-2xl text-white">
          <h2 className="text-2xl font-semibold mb-2">
            {weather.name}, {weather.sys.country}
          </h2>

          {/* Icon + Temp */}
          <div className="flex flex-col items-center my-4">
            <img
              src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
              alt={weather.weather[0].description}
              className="w-28 h-28"
            />
            <p className="text-6xl font-bold">
              {Math.round(weather.main.temp)}°C
            </p>
            <p className="capitalize text-lg mt-2">
              {weather.weather[0].description}
            </p>
          </div>

          {/* Extra Info */}
          <div className="grid grid-cols-3 gap-4 mt-6 text-lg">
            <div className="bg-white/10 rounded-xl p-3">
              💧 {weather.main.humidity}%
              <p className="text-sm">Humidity</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              🌬️ {weather.wind.speed} m/s
              <p className="text-sm">Wind</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              🌡️ {weather.main.feels_like}°C
              <p className="text-sm">Feels like</p>
            </div>
          </div>
        </div>
      )}

      {/* Forecast */}
      {forecast.length > 0 && (
        <div className="mt-10 w-full max-w-4xl">
          <h3 className="text-2xl text-white font-semibold mb-4">5-Day Forecast</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {forecast.map((day, index) => (
              <div
                key={index}
                className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center text-white shadow-lg"
              >
                <p className="font-semibold">
                  {new Date(day.dt * 1000).toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </p>
                <img
                  src={`http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                  alt={day.weather[0].description}
                  className="mx-auto"
                />
                <p className="text-xl font-bold">{Math.round(day.main.temp)}°C</p>
                <p className="text-sm capitalize">{day.weather[0].description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
