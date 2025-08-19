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

    // AviationStack API (using your API key)
    const url = `http://api.aviationstack.com/v1/flights?access_key=${process.env.AVIATIONSTACK_API_KEY || "a33d5942b7ab8679b378952887217fe3"}&flight_iata=${flightNumber}`;

    const response = await axios.get(url);

    if (response.data && response.data.data && response.data.data.length > 0) {
      const flight = response.data.data[0];

      const airline = flight.airline?.name || "Unknown airline";
      const departure = flight.departure?.airport || "Unknown departure";
      const arrival = flight.arrival?.airport || "Unknown arrival";
      const status = flight.flight_status || "Unknown";

      return res.json({
        fulfillmentText: `✈️ Flight ${flightNumber} (${airline}) is currently **${status}**.\nDeparture: ${departure} → Arrival: ${arrival}.`
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

