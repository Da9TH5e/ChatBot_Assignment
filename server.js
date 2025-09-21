// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/session', (req, res) => {
  const name = req.body.name || 'New Chat';
  console.log('Creating session with name:', name);
  
  db.run("INSERT INTO session(name) VALUES(?)", [name], function(err) {
    if(err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    
    const sessionId = this.lastID;
    console.log(`New session created: id=${sessionId}, name=${name}`);
    
    res.json({ 
      sessionId: sessionId,
      id: sessionId,
      name: name
    });
  });
});

app.get('/sessions', (req, res) => {
  db.all("SELECT * FROM session ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/messages/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  console.log(`Fetching messages for session: ${sessionId}`);
  
  db.all(
    "SELECT * FROM conversation WHERE session_id = ? ORDER BY created_at ASC",
    [sessionId],
    (err, rows) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.patch('/session/:id', (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  db.run("UPDATE session SET name = ? WHERE id = ?", [name, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/session/:id', (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM session WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body;

  if(!sessionId) return res.status(400).json({ error: 'Session ID required' });
  if(!message || message.trim() === "") return res.status(400).json({ error: 'Message cannot be empty' });

  db.run(
    "INSERT INTO conversation(session_id, sender, message) VALUES(?, ?, ?)",
    [sessionId, "user", message],
    (err) => { if(err) console.error("DB insert error:", err.message); }
  );

  let botReply = "";

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a helpful, friendly AI assistant. Keep your responses concise and conversational." },
          { role: "user", content: message }
        ],
        max_tokens: 1024,
        temperature: 0.7,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    botReply = response.data.choices[0].message.content;

  } catch (err) {
    console.error('Groq API error:', err.response?.data || err.message);

    if (err.response?.status === 401) botReply = "API authentication failed. Please check the API key.";
    else if (err.response?.status === 429) botReply = "I'm getting too many requests right now. Please try again in a moment.";
    else if (err.code === 'ECONNABORTED') botReply = "The request took too long. Please try again.";
    else botReply = "Sorry, I'm having trouble connecting to my AI brain. Please try again.";
  }

  db.run(
    "INSERT INTO conversation(session_id, sender, message) VALUES(?, ?, ?)",
    [sessionId, "bot", botReply],
    (err) => { if(err) console.error("DB insert error:", err.message); }
  );

  res.json({ reply: botReply });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
