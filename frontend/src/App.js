
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");
  const [searchHistory, setSearchHistory] = useState(
    JSON.parse(localStorage.getItem("searchHistory")) || []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  "https://weather-backend-latest-1-hxzy.onrender.com";


  // ✅ Save theme preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ✅ Save history
  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  // ✅ Fetch weather
  const getWeather = useCallback(
    async (location) => {
      setError(null);
      setLoading(true);

      try {
        let res;
        if (typeof location === "string") {
          res = await axios.get(`${API_BASE}/weather/${encodeURIComponent(location)}`);
        } else if (location.lat && location.lon) {
          res = await axios.get(`${API_BASE}/weather?lat=${location.lat}&lon=${location.lon}`);
        }

        setWeather(res.data);

        const forecastRes = await axios.get(
          typeof location === "string"
            ? `${API_BASE}/forecast/${encodeURIComponent(location)}`
            : `${API_BASE}/forecast?lat=${location.lat}&lon=${location.lon}`
        );

        const daily = (forecastRes.data?.list || []).filter(
          (_, index) => index % 8 === 0
        );
        setForecast(daily);

        // ✅ Add to history only if string
        if (typeof location === "string") {
          setSearchHistory((prev) => {
            const updated = [location, ...prev.filter((c) => c !== location)];
            return updated.slice(0, 10); // keep max 10
          });
        }
      } catch (err) {
        setWeather(null);
        setForecast([]);
        setError("Could not fetch weather data.");
      } finally {
        setLoading(false);
      }
    },
    [API_BASE]
  );

  // ✅ Auto-detect location
  useEffect(() => {
    const fetchLocation = async () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            getWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          },
          async () => {
            try {
              const res = await axios.get(`${API_BASE}/location`);
              if (res.data.city) {
                setCity(res.data.city);
                getWeather(res.data.city);
              } else {
                getWeather({ lat: res.data.latitude, lon: res.data.longitude });
              }
            } catch {
              console.warn("IP detection failed");
            }
          }
        );
      }
    };
    fetchLocation();
  }, [API_BASE, getWeather]);

  const handleSearch = () => {
    if (city.trim()) {
      getWeather(city.trim());
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-6 transition ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
          : "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white"
      }`}
    >
      <div className="w-full max-w-2xl flex flex-col items-center space-y-6">
        {/* Title + Theme */}
        <div className="flex justify-between w-full items-center">
          <h1 className="text-4xl font-bold drop-shadow-lg text-center flex-grow">
            🌍 Weather Dashboard
          </h1>
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 ml-4 rounded-full border bg-white/20 backdrop-blur-lg shadow-lg"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <input
            type="text"
            value={city}
            placeholder="Enter city (e.g. Hyderabad, IN)"
            onChange={(e) => {
              setCity(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 rounded-xl text-gray-800 focus:outline-none shadow-lg"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-1 top-1 px-5 py-2 rounded-lg font-semibold transition 
                        bg-yellow-400 text-black hover:bg-yellow-500"
          >
            {loading ? "..." : "Search"}
          </button>

          {/* Dropdown suggestions */}
          {showSuggestions && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white/30 backdrop-blur-md 
                            rounded-xl shadow-2xl overflow-hidden z-10">
              <ul>
                {searchHistory
                  .filter((c) => c.toLowerCase().includes(city.toLowerCase()))
                  .map((c, idx) => (
                    <li
                      key={idx}
                      onClick={() => {
                        setCity(c);
                        handleSearch();
                      }}
                      className="px-4 py-2 hover:bg-white/50 cursor-pointer"
                    >
                      {c}
                    </li>
                  ))}
              </ul>
              <button
                onClick={clearHistory}
                className="w-full text-center py-2 bg-red-500/80 text-white hover:bg-red-600"
              >
                Clear History
              </button>
            </div>
          )}
        </div>

        {/* Swipeable History */}
        {searchHistory.length > 0 && (
          <div className="w-full flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
            {searchHistory.map((h, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCity(h);
                  handleSearch();
                }}
                className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full shadow-md cursor-pointer whitespace-nowrap"
              >
                {h}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg mb-4 shadow">
            {error}
          </div>
        )}

        {/* Weather Card */}
        {weather && (
          <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 w-full text-center shadow-2xl">
            <h2 className="text-2xl font-semibold mb-2">
              {weather.name}, {weather.sys.country}
            </h2>
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
          </div>
        )}

        {/* Forecast */}
        {forecast.length > 0 && (
          <div className="mt-6 w-full">
            <h3 className="text-2xl font-semibold mb-4 text-center">
              5-Day Forecast
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {forecast.map((day, index) => (
                <div
                  key={index}
                  className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center shadow-lg"
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
                  <p className="text-xl font-bold">
                    {Math.round(day.main.temp)}°C
                  </p>
                  <p className="text-sm capitalize">
                    {day.weather[0].description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
