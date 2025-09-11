
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Weather Dashboard App
 * - Caches fetched results in localStorage (searchCache)
 * - searchHistory (array of city keys) stored in localStorage
 * - Swiping (touch + mouse) switches between cached cities only (no API on swipe)
 */

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://weather-backend-latest-1-hxzy.onrender.com";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // now used

  const [theme, setTheme] = useState("light");

  const [searchHistory, setSearchHistory] = useState(
    () => JSON.parse(localStorage.getItem("searchHistory")) || []
  );

  const [searchCache, setSearchCache] = useState(
    () => JSON.parse(localStorage.getItem("searchCache")) || {}
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const didMountRef = useRef(false);

  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem("searchCache", JSON.stringify(searchCache));
  }, [searchCache]);

  const normalizeKey = (s) => (typeof s === "string" ? s.trim() : s);

  const loadFromCache = useCallback(
    (cityKey) => {
      setError(null);
      if (!cityKey) {
        setWeather(null);
        setForecast([]);
        return;
      }
      const key = normalizeKey(cityKey);
      const cached = searchCache[key];
      if (cached) {
        setWeather(cached.weather || null);
        setForecast(cached.forecast || []);
        setError(null);
      } else {
        setWeather(null);
        setForecast([]);
        setError(`No cached data for "${key}". Please search to fetch and cache it.`);
      }
    },
    [searchCache]
  );

  const getWeather = useCallback(
    async (location) => {
      setError(null);
      setLoading(true);

      try {
        let currentRes;
        if (typeof location === "string") {
          const cityKey = normalizeKey(location);
          currentRes = await axios.get(
            `${API_BASE}/weather/${encodeURIComponent(cityKey)}`
          );
          const forecastRes = await axios.get(
            `${API_BASE}/forecast/${encodeURIComponent(cityKey)}`
          );

          const daily = (forecastRes.data?.list || []).filter(
            (_, index) => index % 8 === 0
          );

          setSearchCache((prev) => {
            const updated = {
              ...prev,
              [cityKey]: {
                weather: currentRes.data,
                forecast: daily,
                cachedAt: Date.now(),
              },
            };
            return updated;
          });

          setSearchHistory((prev) => {
            const deduped = prev.filter(
              (c) => normalizeKey(c).toLowerCase() !== cityKey.toLowerCase()
            );
            const updatedHist = [cityKey, ...deduped].slice(0, 10);
            return updatedHist;
          });

          setActiveIndex(0);
          setWeather(currentRes.data);
          setForecast(daily);
        } else if (location.lat && location.lon) {
          currentRes = await axios.get(
            `${API_BASE}/weather?lat=${location.lat}&lon=${location.lon}`
          );
          const forecastRes = await axios.get(
            `${API_BASE}/forecast?lat=${location.lat}&lon=${location.lon}`
          );
          const daily = (forecastRes.data?.list || []).filter(
            (_, index) => index % 8 === 0
          );

          const cityName = currentRes.data?.name
            ? `${currentRes.data.name}`
            : `${location.lat},${location.lon}`;

          const cityKey = normalizeKey(cityName);

          setSearchCache((prev) => {
            const updated = {
              ...prev,
              [cityKey]: {
                weather: currentRes.data,
                forecast: daily,
                cachedAt: Date.now(),
              },
            };
            return updated;
          });

          setSearchHistory((prev) => {
            const deduped = prev.filter(
              (c) => normalizeKey(c).toLowerCase() !== cityKey.toLowerCase()
            );
            const updatedHist = [cityKey, ...deduped].slice(0, 10);
            return updatedHist;
          });

          setActiveIndex(0);
          setWeather(currentRes.data);
          setForecast(daily);
        }
      } catch (err) {
        console.error("getWeather error:", err.response?.data || err.message);
        setError("Could not fetch weather data.");
        setWeather(null);
        setForecast([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    const savedCache = JSON.parse(localStorage.getItem("searchCache")) || {};
    setSearchHistory(savedHistory);
    setSearchCache(savedCache);

    if (savedHistory.length > 0) {
      const first = savedHistory[0];
      if (savedCache[first]) {
        setActiveIndex(0);
        setWeather(savedCache[first].weather);
        setForecast(savedCache[first].forecast || []);
      } else {
        setWeather(null);
        setForecast([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (searchHistory.length === 0) return;
    const cityKey = searchHistory[activeIndex];
    loadFromCache(cityKey);
  }, [activeIndex, searchHistory, loadFromCache]);

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
              } else if (res.data.latitude && res.data.longitude) {
                getWeather({ lat: res.data.latitude, lon: res.data.longitude });
              }
            } catch (e) {
              console.warn("IP location detection failed:", e.message);
            }
          }
        );
      }
    };
    fetchLocation();
  }, [getWeather]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeIndex < searchHistory.length - 1) {
        setDirection(1);
        setActiveIndex(activeIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (activeIndex > 0) {
        setDirection(-1);
        setActiveIndex(activeIndex - 1);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.28, ease: "easeOut" },
    },
    exit: (dir) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.28, ease: "easeOut" },
    }),
  };

  const handleSearch = () => {
    if (city.trim()) {
      getWeather(city.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearHistory = () => {
    setSearchHistory([]);
    setSearchCache({});
    localStorage.removeItem("searchHistory");
    localStorage.removeItem("searchCache");
    setActiveIndex(0);
    setWeather(null);
    setForecast([]);
  };

  const handleHistoryClick = (idx) => {
    setActiveIndex(idx);
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
        <div className="flex justify-between w-full items-center">
          <h1 className="text-4xl font-bold drop-shadow-lg text-center flex-grow">
            🌍 Weather Dashboard
          </h1>
          <button
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
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
            onChange={(e) => setCity(e.target.value)}
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
          {city && searchHistory.length > 0 && (
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
                        getWeather(c);
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

        {/* History Pills */}
        {searchHistory.length > 0 && (
          <div className="w-full flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
            {searchHistory.map((h, idx) => (
              <div
                key={idx}
                onClick={() => handleHistoryClick(idx)}
                className={`px-4 py-2 rounded-full shadow-md cursor-pointer whitespace-nowrap select-none ${
                  idx === activeIndex
                    ? "bg-yellow-400 text-black font-semibold"
                    : "bg-white/20 backdrop-blur-md text-white"
                }`}
              >
                {h}
              </div>
            ))}
          </div>
        )}

        {/* Swipeable Weather Card */}
        <div {...swipeHandlers} className="w-full relative min-h-[200px]">
          {/* ✅ Error message block added here */}
          {error && (
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg mb-4 shadow">
              {error}
            </div>
          )}

          <AnimatePresence custom={direction} initial={false}>
            {weather ? (
              <motion.div
                key={weather.id || (weather.name + (weather.sys?.country || ""))}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute w-full bg-white/20 backdrop-blur-lg rounded-3xl p-8 text-center shadow-2xl"
              >
                <h2 className="text-2xl font-semibold mb-2">
                  {weather.name}, {weather.sys.country}
                </h2>
                <div className="flex flex-col items-center my-4">
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                    alt={weather.weather[0].description}
                    className="w-28 h-28"
                  />
                  <p className="text-6xl font-bold">{Math.round(weather.main.temp)}°C</p>
                  <p className="capitalize text-lg mt-2">{weather.weather[0].description}</p>
                </div>

                {forecast.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">5-Day Forecast</h3>
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
                            src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
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

                <p className="text-sm opacity-75 mt-4">
                  👉 Swipe left/right (or drag with mouse) to browse cached searches
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center shadow-2xl"
              >
                <p className="text-lg">No weather selected. Search a city to fetch & cache it.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;
