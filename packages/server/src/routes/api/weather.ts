import Cache from "../../utility/cache";
import { TWeatherCurrentResponse } from "@upswyng/types";
import axios from "axios";

const cache = new Cache<TWeatherCurrentResponse>();

const getCurrentWeather = async (
  latitude: number | null,
  longitude: number | null
): Promise<TWeatherCurrentResponse> => {
  try {
    const { data } = await axios.get<TWeatherCurrentResponse>(
      "https://api.openweathermap.org/data/2.5/weather?units=imperial",
      {
        params: {
          lat: latitude,
          lon: longitude,
          APPID: process.env.OPEN_WEATHER_API_KEY,
        },
      }
    );
    return data;
  } catch (err) {
    console.log(err);
  }
};

const getCachedWeatherData = async (
  latitude: number,
  longitude: number
): Promise<TWeatherCurrentResponse> => {
  const key = `${latitude}${longitude}`;
  if (!cache.getValue(key) || cache.isExpired(key, new Date())) {
    cache.setValue(key, await getCurrentWeather(latitude, longitude));
    cache.setExpiration(key, new Date(), 60000);
  }
  return cache.getValue(key);
};

export async function get(req, res) {
  try {
    const result = await getCachedWeatherData(
      +req.query.latitude,
      +req.query.longitude
    );
    return res.status(200).json({ ...result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: `Error fetching weather information: ${e.message}`,
    });
  }
}
