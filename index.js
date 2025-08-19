const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  const flightNumber = req.body.queryResult.parameters["flight-number"];

  try {
    // Fetch all current flights from OpenSky
    const response = await axios.get("https://opensky-network.org/api/states/all");
    const flights = response.data.states;

    if (!flights) {
      return res.json({ fulfillmentText: "Sorry, I couldn't fetch flight data right now." });
    }

    // Normalize user input
    const target = flightNumber.toUpperCase().trim();

    // First try: exact match
    let match = flights.find(f => f[1] && f[1].trim().toUpperCase() === target);

    if (match) {
      const callsign = match[1].trim();
      const originCountry = match[2];
      const longitude = match[5];
      const latitude = match[6];
      const altitude = match[7];
      const velocity = match[9];

      const message = `✈️ Flight ${callsign} from ${originCountry} is currently at:\n🌍 Lat: ${latitude}, Lon: ${longitude}\n🛫 Altitude: ${altitude} m\n⚡ Speed: ${velocity} m/s.`;
      return res.json({ fulfillmentText: message });
    }

    // Fallback: find partial matches
    const possibleMatches = flights
      .filter(f => f[1] && f[1].toUpperCase().includes(target))
      .slice(0, 3) // only show up to 3 suggestions
      .map(f => f[1].trim());

    if (possibleMatches.length > 0) {
      return res.json({
        fulfillmentText: `I couldn’t find an exact match for ${flightNumber}, but did you mean one of these?\n👉 ${possibleMatches.join(", ")}`
      });
    }

    // No matches at all
    return res.json({ fulfillmentText: `Sorry, I couldn’t find real-time data for flight ${flightNumber}.` });

  } catch (error) {
    console.error("Error fetching flight data:", error.message);
    return res.json({ fulfillmentText: "There was an error fetching flight data. Please try again later." });
  }
});

app.listen(3000, () => console.log("Server is running on port 3000"));
