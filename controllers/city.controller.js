const prisma = require("../utils/prisma")

const axios = require("axios");

const cache = new Map(); // simple in-memory cache

exports.getCities = async (req, res) => {
  try {
    const { search, type } = req.query;

    if (!search) return res.json([]);

    const key = `${search}-${type}`;

    // ✅ 1. CACHE HIT
    if (cache.has(key)) {
      return res.json(cache.get(key));
    }

    // ✅ 2. FETCH FROM NOMINATIM
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: search,
          format: "json",
          addressdetails: 1,
          limit: 8,
          countrycodes: "in"
        },
        headers: {
          "User-Agent": "cabx-app"
        }
      }
    );

    let results = Array.isArray(response.data) ? response.data : [];

    // ✅ 3. FILTER (SMART)
    if (type === "airport") {
      results = results.filter(
        (r) =>
          r.class === "aeroway" ||
          r.display_name.toLowerCase().includes("airport")
      );
    }

    if (type === "oneway" || type === "roundtrip") {
  results = results.filter(
    (r) =>
      ["city", "town", "administrative", "village"].includes(r.type)
  );
}

    if (type === "hourly") {
      results = results.filter(
        (r) =>
          r.type === "city" ||
          r.type === "administrative"
      );
    }

    // ✅ 4. FORMAT
    const formatted = results.map((r) => ({
      id: r.place_id,
      name: r.display_name.split(",")[0],
      full: r.display_name,
      lat: r.lat,
      lon: r.lon,
      type: r.type
    }));

    // ✅ 5. SAVE CACHE (important)
    cache.set(key, formatted);

    // auto expire (5 min)
    setTimeout(() => cache.delete(key), 5 * 60 * 1000);

    res.json(formatted);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "City fetch failed" });
  }
};


exports.getCity = async (req, res) => {
  try {
    const { id } = req.params

    const city = await prisma.city.findUnique({
      where: { id }
    })

    if (!city) {
      return res.status(404).json({ error: "City not found" })
    }

    res.json(city)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch city" })
  }
}


exports.createCity = async (req, res) => {
  try {
    const { name, state } = req.body

    const city = await prisma.city.create({
      data: { name, state }
    })

    res.json(city)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to create city" })
  }
}


exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params
    const { name, state, isActive } = req.body

    const city = await prisma.city.update({
      where: { id },
      data: { name, state, isActive }
    })

    res.json(city)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update city" })
  }
}


exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.city.delete({
      where: { id }
    })

    res.json({ message: "City deleted" })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete city" })
  }
}