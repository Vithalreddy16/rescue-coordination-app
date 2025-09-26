// backend/controllers/chatController.js

// This is the "brain" of our rule-based chatbot
const getChatbotResponse = (message) => {
    const msg = message.toLowerCase();

    if (msg.includes('report') || msg.includes('emergency')) {
        return "To report an emergency, please fill out the main form on this page. Using the 'Use My GPS' button is the most accurate way to provide your location.";
    } else if (msg.includes('flood')) {
        return "In case of a flood, move to higher ground immediately. Turn off utilities if it is safe. Do not walk, swim, or drive through floodwaters.";
    } else if (msg.includes('earthquake')) {
        return "During an earthquake: Drop, Cover, and Hold On. Stay indoors until the shaking stops. Be cautious of aftershocks.";
    } else if (msg.includes('fire')) {
        return "If you see a fire, evacuate the area immediately. Close doors behind you to contain the fire. Call your local emergency number (like 112 or 108 or 100) once you are in a safe location.";
    } else if (msg.includes('how') && msg.includes('work')) {
         return "When you submit a report, our system instantly searches for rescue agencies within a 20km radius and sends them a real-time alert to their dashboard.";
    } else if (msg.includes('hello') || msg.includes('hi')) {
        return "Hello! I am the Rescue Assistant. You can ask me how to report an issue or for basic advice on emergencies like 'flood', 'fire', or 'earthquake'.";
    } else {
        return "I can provide basic guidance. How can I help you today? Try asking 'how to report an emergency'.";
    }
};

// This function will be called by the route
exports.handleChat = (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    const reply = getChatbotResponse(message);
    res.json({ reply: reply });
};
