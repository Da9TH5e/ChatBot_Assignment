v# Chat Application

A real-time chat application with session management built with JavaScript.

## Features

- Multiple chat sessions
- Real-time messaging
- Session renaming and deletion
- Welcome messages with clickable examples
- Responsive design

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js/Express
- Database: SQLite

## File Structure

Chatbot/
├── .env.example (template for environment variables)
├── .gitignore
├── package.json
├── package-lock.json
├── server.js (backend server)
├── db.js (database setup)
├── chat.db (database file - created automatically)
└── public/
├── index.html
├── main.js
└── styles.css
text


<img width="251" height="311" alt="image" src="https://github.com/user-attachments/assets/69a63105-77aa-43fe-a284-2c90e3fc99b3" />

## How to Run This Project

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Da9TH5e/ChatBot_Assignment.git
   cd ChatBot_Assignment

Install dependencies
bash

npm install

Set up environment variables
bash

# Copy the environment template
cp .env.example .env

# Edit the .env file and add your Groq API key
# Get your API key from: https://console.groq.com/
echo "GROQ_API_KEY=your_actual_api_key_here" > .env

Start the server
bash

# For development
npm start

# Or for production
node server.js

    Open in browser

        The server will run on http://localhost:3000

        Open this URL in your web browser

Environment Variables

Create a .env file in the root directory with the following variables:
text

GROQ_API_KEY=your_groq_api_key_here
PORT=3000

Important: Never commit your actual .env file to version control. The .env file is already included in .gitignore.
Getting Groq API Key

    Go to Groq Console

    Sign up or log in to your account

    Navigate to API Keys section

    Create a new API key

    Copy the key and add it to your .env file

Available Scripts
bash

# Start the development server
npm start

# Install dependencies
npm install

# Check for any issues
npm audit

Troubleshooting

    Port already in use: Change the PORT in your .env file

    API key issues: Verify your Groq API key is correct and has sufficient credits

    Database errors: Delete chat.db and restart the server to recreate the database

Security Notes

    Keep your API keys secure and never share them

    The .env file is ignored by git to prevent accidental exposure

    Use environment variables for all sensitive configuration