// public/main.js

let currentSessionId = null;

async function initApp() {
    try {
        console.log("Initializing app...");

        const sessions = await getSessions();
        console.log("Sessions found:", sessions);

        if (sessions.length === 0) {
            console.log("No sessions found, creating new one...");
            const newSession = await createNewSession();
            currentSessionId = newSession.sessionId || newSession.id;
        } else {
            currentSessionId = sessions[0].id;
            console.log("Loading session:", currentSessionId);
            await loadChat(currentSessionId);
        }

        await loadSessionList();

    } catch (error) {
        console.error('Error initializing app:', error);
        showError("Failed to initialize chat. Please refresh the page.");
    }
}

async function getSessions() {
    try {
        const res = await fetch('/sessions');
        
        if (!res.ok) {
            throw new Error(`Server returned ${res.status} ${res.statusText}`);
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('Server returned non-JSON response:', text);
            throw new Error('Server did not return JSON');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }
}

function showError(message) {
    const container = document.getElementById('messages');
    const errorDiv = document.createElement('div');
    errorDiv.className = "message bot error";
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
    container.appendChild(errorDiv);
    container.scrollTop = container.scrollHeight;
}

async function createNewChat() {
    console.log("Create new chat button clicked");
    try {
        const session = await createNewSession();
        if (session) {
            const newSessionId = session.sessionId || session.id;
            console.log("Loading chat for session:", newSessionId);
            await loadChat(newSessionId);
        }
    } catch (error) {
        console.error("Error in createNewChat:", error);
        showError("Failed to create new chat. Please check console for details.");
    }
}

async function createNewSession() {
    try {
        console.log("Creating new session...");
        
        const res = await fetch('/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'New Chat' })
        });

        if (!res.ok) {
            throw new Error(`Server returned ${res.status} ${res.statusText}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('Server returned non-JSON response:', text);
            throw new Error('Server did not return JSON');
        }

        const session = await res.json();
        currentSessionId = session.sessionId || session.id;

        const container = document.getElementById('messages');
        container.innerHTML = "";
        showWelcomeMessage();
        
        await loadSessionList();

        console.log("New session created successfully");
        return session;

    } catch (error) {
        console.error('Error creating session:', error);
        showError("Failed to create a new chat session.");
        throw error;
    }
}

async function loadChat(sessionId) {
    currentSessionId = sessionId;
    
    const items = document.querySelectorAll('.chat-item');
    items.forEach(item => {
        if (parseInt(item.dataset.sessionId) === sessionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    updateSendButtonState();
    updateActionButtons();
    
    try {
        const res = await fetch(`/messages/${sessionId}`);
        if (res.ok) {
            const msgs = await res.json();
            if (msgs.length === 0) {
                showWelcomeMessage();
                return;
            }
        }
        await loadMessages();
    } catch (error) {
        console.error('Error checking messages:', error);
        await loadMessages();
    }
}

async function renameSession(sessionId, newName) {
  try {
    const res = await fetch(`/session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    if (!res.ok) throw new Error('Failed to rename session');
    await loadSessionList();
  } catch (err) {
    console.error(err);
    showError("Failed to rename chat.");
  }
}

async function deleteSession(sessionId) {
    try {
        const res = await fetch(`/session/${sessionId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete session');

        if (sessionId === currentSessionId) {
            const sessions = await getSessions();
            if (sessions.length > 0) {
                currentSessionId = sessions[0].id;
                await loadChat(currentSessionId);
            } else {
                const newSession = await createNewSession();
                currentSessionId = newSession.sessionId || newSession.id;
                
                
                await manualLoadSessionList();
            }
        } else {
            
            await loadSessionList();
        }
    } catch (err) {
        console.error(err);
        showError("Failed to delete chat.");
    }
}

async function manualLoadSessionList() {
    try {
        const sessions = await getSessions();
        const chatHistory = document.getElementById('chat-history');
        chatHistory.innerHTML = '';

        sessions.forEach(session => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.sessionId = session.id;
            
            if (session.id === currentSessionId) {
                chatItem.classList.add('active');
            }

            chatItem.textContent = session.name || `Chat ${session.id}`;
            chatHistory.appendChild(chatItem);
        });

        updateActionButtons();

    } catch (error) {
        console.error('Error loading session list:', error);
    }
}

async function loadMessages() {
    if (!currentSessionId) return;
    
    try {
        console.log(`Loading messages for session: ${currentSessionId}`);
        const res = await fetch(`/messages/${currentSessionId}`);
        
        if (!res.ok) {
            throw new Error(`Server returned ${res.status} ${res.statusText}`);
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('Server returned non-JSON response:', text);
            throw new Error('Server did not return JSON');
        }
        
        const msgs = await res.json();
        const container = document.getElementById('messages');
        
        container.innerHTML = "";
        
        if (msgs.length === 0) {
            showWelcomeMessage();
            return;
        }
        
        msgs.forEach(m => {
            const div = document.createElement('div');
            div.className = "message " + m.sender;
            div.innerText = m.message;
            container.appendChild(div);
        });
        
        container.scrollTop = container.scrollHeight;
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendMessage() {
    const input = document.getElementById('type-message');
    const msg = input.value.trim();
    if (!msg || !currentSessionId) return;

    const sendButton = document.getElementById('send');
    const originalHTML = sendButton.innerHTML;
    
    sendButton.innerHTML = '';
    sendButton.classList.add('send-loading');
    sendButton.disabled = true;

    try {
        const res = await fetch('/chat', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg, sessionId: currentSessionId })
        });
        
        if (!res.ok) {
            throw new Error(`Server returned ${res.status}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server did not return JSON');
        }

        input.value = "";
        
        const errorMessages = document.querySelectorAll('.message.error');
        errorMessages.forEach(msg => msg.remove());
        
        await loadMessages();
        
    } catch (error) {
        console.error('Error sending message:', error);
        const container = document.getElementById('messages');
        const errorDiv = document.createElement('div');
        errorDiv.className = "message bot error";
        errorDiv.innerText = "Sorry, I'm having trouble connecting to the server. Please try again.";
        container.appendChild(errorDiv);
        container.scrollTop = container.scrollHeight;
    } finally {
        sendButton.classList.remove('send-loading');
        sendButton.innerHTML = '➤';
        sendButton.disabled = !input.value.trim() || !currentSessionId;
    }
}

async function loadSessionList() {
    try {
        const sessions = await getSessions();
        const chatHistory = document.getElementById('chat-history');
        chatHistory.innerHTML = '';

        if (sessions.length === 0) {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item active';
            chatItem.dataset.sessionId = currentSessionId;
            chatItem.textContent = 'New Chat';
            chatHistory.appendChild(chatItem);
            return;
        }

        sessions.forEach(session => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.sessionId = session.id;
            
            if (session.id === currentSessionId) {
                chatItem.classList.add('active');
            }

            chatItem.textContent = session.name || `Chat ${session.id}`;
            chatHistory.appendChild(chatItem);
        });

        updateActionButtons();

    } catch (error) {
        console.error('Error loading session list:', error);
    }
}

function updateActionButtons() {
    const renameBtn = document.getElementById('rename-chat-btn');
    const deleteBtn = document.getElementById('delete-chat-btn');
    
    const hasActiveChat = currentSessionId !== null;
    
    renameBtn.disabled = !hasActiveChat;
    deleteBtn.disabled = !hasActiveChat;
}

async function loadChat(sessionId) {
    currentSessionId = sessionId;
    
    const items = document.querySelectorAll('.chat-item');
    items.forEach(item => {
        if (parseInt(item.dataset.sessionId) === sessionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    updateActionButtons();
    await loadMessages();
}

function setupStaticButtonListeners() {
    document.getElementById('rename-chat-btn').addEventListener('click', async function() {
      if (!currentSessionId) return;
      
      const activeChat = document.querySelector('.chat-item.active');
      if (!activeChat) return;
      
      const currentName = activeChat.textContent;
      const newName = await showModal("Rename Chat", currentName);
      
      if (newName && newName !== currentName) {
        renameSession(currentSessionId, newName);
      }
    });
    
    document.getElementById('delete-chat-btn').addEventListener('click', async function() {
      if (!currentSessionId) return;
      
      const shouldDelete = await showModal("Delete Chat", "", true);
      
      if (shouldDelete) {
        deleteSession(currentSessionId);
      }
    });
    
    document.getElementById('chat-history').addEventListener('click', function(e) {
        const chatItem = e.target.closest('.chat-item');
        if (!chatItem) return;
        
        const sessionId = parseInt(chatItem.dataset.sessionId);
        loadChat(sessionId);
    });
}

function showModal(title, defaultValue = '', isDeleteModal = false) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalInput = document.getElementById('modal-input');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    
    modal.classList.remove('delete-modal');
    modalInput.style.display = 'block';
    modalConfirm.innerHTML = 'OK';
    
    if (isDeleteModal) {
      modal.classList.add('delete-modal');
      modalInput.style.display = 'none';
      modalConfirm.innerHTML = 'Delete';
    }
    
    modalTitle.textContent = title;
    modalInput.value = defaultValue;
    
    setTimeout(() => {
      modal.classList.add('show');
      
      if (!isDeleteModal) {
        setTimeout(() => modalInput.focus(), 100);
      }
    }, 10);
    
    const cleanup = () => {
      modal.classList.remove('show');
      modalCancel.removeEventListener('click', onCancel);
      modalConfirm.removeEventListener('click', onConfirm);
      modalInput.removeEventListener('keypress', onEnter);
      document.removeEventListener('keydown', onEscape);
    };
    
    const onConfirm = () => {
      cleanup();
      resolve(isDeleteModal ? true : modalInput.value.trim());
    };
    
    const onCancel = () => {
      cleanup();
      resolve(isDeleteModal ? false : null);
    };
    
    const onEnter = (e) => {
      if (e.key === 'Enter') {
        onConfirm();
      }
    };
    
    const onEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    modalCancel.addEventListener('click', onCancel);
    modalConfirm.addEventListener('click', onConfirm);
    modalInput.addEventListener('keypress', onEnter);
    document.addEventListener('keydown', onEscape);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        onCancel();
      }
    });
  });
}

function setModalLoading(isLoading) {
  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn = document.getElementById('modal-cancel');
  
  if (isLoading) {
    confirmBtn.innerHTML = '<div class="loading-spinner"></div>';
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
  } else {
    confirmBtn.innerHTML = 'OK';
    confirmBtn.disabled = false;
    cancelBtn.disabled = false;
  }
}

function showWelcomeMessage() {
    const container = document.getElementById('messages');
    
    if (!container.querySelector('.welcome')) {
        container.innerHTML = "";
    }
    
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = "message bot welcome";
    welcomeDiv.innerHTML = `
        <div class="welcome-message">
            <h3>👋 Hello! How can I help you today?</h3>
            <p>I'm your AI assistant ready to answer questions, have conversations, or help with tasks.</p>
            <div class="suggestions">
                <p><strong>Try asking me:</strong></p>
                <ul>
                    <li>What can you help me with?</li>
                    <li>Tell me a joke</li>
                    <li>Explain quantum computing</li>
                    <li>Help me plan my day</li>
                </ul>
            </div>
        </div>
    `;
    container.appendChild(welcomeDiv);
    container.scrollTop = container.scrollHeight;
    
    setTimeout(makeExamplesClickable, 100);
}

function makeExamplesClickable() {
    const exampleItems = document.querySelectorAll('.welcome-message .suggestions li');
    const examples = [
        "What can you help me with?",
        "Tell me a joke",
        "Explain quantum computing in simple terms",
        "Help me plan my day"
    ];
    
    exampleItems.forEach((li, index) => {
        if (index < examples.length) {
            li.style.cursor = 'pointer';
            li.addEventListener('click', () => {
                const input = document.getElementById('type-message');
                input.value = examples[index];
                input.focus();
                updateSendButtonState();
                
                li.style.transform = 'scale(0.95)';
                li.style.color = '#5a86b8';
                setTimeout(() => {
                    li.style.transform = 'scale(1)';
                    li.style.color = '#4a76a8';
                }, 200);
            });
            
            li.addEventListener('mouseenter', () => {
                li.style.color = '#5a86b8';
                li.style.transform = 'translateX(5px)';
            });
            
            li.addEventListener('mouseleave', () => {
                li.style.color = '#4a76a8';
                li.style.transform = 'translateX(0)';
            });
        }
    });
}

function updateSendButtonState() {
    const input = document.getElementById('type-message');
    const sendButton = document.getElementById('send');
    sendButton.disabled = !input.value.trim() || !currentSessionId;
}

document.addEventListener('DOMContentLoaded', function() {
    setupStaticButtonListeners();
    
    initApp();
    
    setInterval(loadMessages, 3000);
    
    const messageInput = document.getElementById('type-message');
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    messageInput.addEventListener('input', updateSendButtonState);
    
    document.getElementById('send').addEventListener('click', sendMessage);
    
    document.getElementById('new-chat-btn').addEventListener('click', createNewChat);
    
    updateSendButtonState();
});

document.addEventListener('DOMContentLoaded', function() {
    setupStaticButtonListeners();
    
    initApp();
    
    setInterval(loadMessages, 1500);
    
    document.getElementById('type-message').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    document.getElementById('new-chat-btn').addEventListener('click', createNewChat);
});