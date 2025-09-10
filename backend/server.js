const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Parse JSON bodies
app.use(express.json());

// Allow CORS (set FRONTEND_URL in Render if you want to restrict it)
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));

// Root route
app.get("/", (req, res) => {
  res.send("🌦️ Weather API is running. Use /weather/:city or /weather?lat&lon.");
});

// Weather by city
app.get("/weather/:city", async (req, res) => {
  const city = req.params.city;
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    res.json(response.data);
  } catch (err) {
    console.error("Weather-by-city error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: "City not found" });
  }
});

// Weather by lat/lon
app.get("/weather", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and longitude required" });
  }
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    res.json(response.data);
  } catch (err) {
    console.error("Weather-by-coords error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: "Could not fetch weather by coordinates" });
  }
});

// Forecast by city
app.get("/forecast/:city", async (req, res) => {
  const city = req.params.city;
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    res.json(response.data);
  } catch (err) {
    console.error("Forecast-by-city error:", err.response?.data || err.message);
    res.status(err.response?.status || 404).json({ error: "City not found" });
  }
});

// Forecast by lat/lon
app.get("/forecast", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and longitude required" });
  }
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    res.json(response.data);
  } catch (err) {
    console.error("Forecast-by-coords error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: "Could not fetch forecast by coordinates" });
  }
});

// ✅ Auto-detect location using ipdata.co + reverse geocoding
app.get("/location", async (req, res) => {
  try {
    // 1. Get IP-based location
    const ipRes = await axios.get(
      `https://api.ipdata.co?api-key=${process.env.IPDATA_API_KEY}`
    );

    const { city, region, country_name, latitude, longitude } = ipRes.data;
    let detectedCity = city;

    // 2. If city is null, try reverse geocoding with OpenWeather (use HTTPS)
    if (!detectedCity && latitude && longitude) {
      const geoRes = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${process.env.WEATHER_API_KEY}`
      );

      if (geoRes.data && geoRes.data.length > 0) {
        detectedCity = geoRes.data[0].name;
      }
    }

    res.json({
      city: detectedCity || null,
      region,
      country: country_name,
      latitude,
      longitude,
    });
  } catch (error) {
    console.error("Location API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Could not fetch location" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ✅ Use correct port for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
