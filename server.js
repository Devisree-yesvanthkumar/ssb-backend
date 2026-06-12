const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, default: "General" },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model("Contact", contactSchema);

const sendSMS = async (name, phone, service, message) => {
  try {
    const smsText =
`New Enquiry - Sri Sai Balaji Xerox
Name: ${name}
Phone: ${phone}
Service: ${service}
Message: ${message}`;

    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: smsText,
        language: "english",
        flash: 0,
        numbers: process.env.OWNER_PHONE
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY
        }
      }
    );
    console.log("SMS sent successfully:", response.data);
  } catch (err) {
    console.error("SMS sending failed:", err.message);
  }
};
// POST /api/contact
app.post("/api/contact", async (req, res) => {
  try {
    const { name, phone, service, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ error: "Name, phone and message are required." });
    }
    const contact = new Contact({ name, phone, service, message });
    await contact.save();
    // Send SMS to owner
    await sendSMS(name, phone, service, message);
    res.status(201).json({ success: true, message: "Enquiry saved! We'll call you back shortly." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// GET /api/contact
app.get("/api/contact", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

app.get("/", (req, res) => res.json({ status: "Sri Sai Balaji Xerox API running" }));


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ssb_xerox";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error("MongoDB connection error:", err));