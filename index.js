import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Root route
app.get("/", (req, res) => {
  res.send("✈️ Flight Status Webhook is running with AviationStack ✅");
});

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    const flightNumber = req.body.queryResult?.parameters["flight-number"];

    if (!flightNumber) {
      return res.json({
        fulfillmentText: "Please provide a valid flight number ✈️"
      });
    }

    // AviationStack API
    const url = `http://api.aviationstack.com/v1/flights?access_key=${
      process.env.AVIATIONSTACK_API_KEY || "a33d5942b7ab8679b378952887217fe3"
    }&flight_iata=${flightNumber}`;

    const response = await axios.get(url);

    if (response.data && response.data.data && response.data.data.length > 0) {
      const flight = response.data.data[0];

      const airline = flight.airline?.name || "Unknown airline";
      const flight_iata = flight.flight?.iata || flightNumber;
      const flight_icao = flight.flight?.icao || "N/A";
      const status = flight.flight_status || "Unknown";

      const departure = {
        airport: flight.departure?.airport || "Unknown",
        scheduled: flight.departure?.scheduled || "N/A",
        gate: flight.departure?.gate || "N/A",
        terminal: flight.departure?.terminal || "N/A"
      };

      const arrival = {
        airport: flight.arrival?.airport || "Unknown",
        scheduled: flight.arrival?.scheduled || "N/A",
        gate: flight.arrival?.gate || "N/A",
        terminal: flight.arrival?.terminal || "N/A"
      };

      const aircraft = flight.aircraft?.registration
        ? `${flight.aircraft?.registration} (${flight.aircraft?.icao24 || "N/A"})`
        : "Not available";

      // Real-time data (position + speed + altitude)
      const live = flight.live
        ? `📍 Position: Lat ${flight.live.latitude}, Lon ${flight.live.longitude}\n` +
          `🛫 Altitude: ${flight.live.altitude} m\n` +
          `⚡ Speed: ${flight.live.speed_horizontal} km/h\n` +
          `🧭 Direction: ${flight.live.direction}°`
        : "Live tracking not available";

      return res.json({
        fulfillmentText: `📡 Flight Status Report:\n\n` +
          `✈️ Airline: ${airline}\n` +
          `🆔 Flight: ${flight_iata} / ${flight_icao}\n` +
          `📍 Departure: ${departure.airport}\n   - Scheduled: ${departure.scheduled}\n   - Terminal: ${departure.terminal}, Gate: ${departure.gate}\n` +
          `📍 Arrival: ${arrival.airport}\n   - Scheduled: ${arrival.scheduled}\n   - Terminal: ${arrival.terminal}, Gate: ${arrival.gate}\n` +
          `🛫 Aircraft: ${aircraft}\n` +
          `📊 Current Status: ${status.toUpperCase()}\n\n` +
          `${live}`
      });
    } else {
      return res.json({
        fulfillmentText: `Sorry, I could not find live data for flight ${flightNumber}.`
      });
    }
  } catch (error) {
    console.error("Error fetching flight data:", error.message);
    return res.json({
      fulfillmentText: "Oops! Something went wrong fetching the flight status."
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
