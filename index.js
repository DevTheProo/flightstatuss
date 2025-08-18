const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Webhook endpoint for Dialogflow
app.post("/webhook", (req, res) => {
  const intent = req.body.queryResult.intent.displayName;

  if (intent === "FlightStatusIntent") {
    const flightNumber = req.body.queryResult.parameters["flight-number"];
    const responseText = `The status of flight ${flightNumber} is On Time ✈️`;

    return res.json({
      fulfillmentText: responseText,
    });
  }

  res.json({ fulfillmentText: "I didn't understand that." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
