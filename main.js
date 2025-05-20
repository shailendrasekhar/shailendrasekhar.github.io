// Chatbot logic for navigation and conversation

document.addEventListener('DOMContentLoaded', function () {
  const chatbotContainer = document.getElementById('chatbot-container');
  const chatbotMessages = document.getElementById('chatbot-messages');
  const chatbotForm = document.getElementById('chatbot-form');
  const chatbotInput = document.getElementById('chatbot-input');

  // Helper: Add message to chat
  function addMessage(text, sender = 'bot') {
    const msg = document.createElement('div');
    msg.className = 'chatbot-message ' + sender;
    msg.innerText = text;
    chatbotMessages.appendChild(msg);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  // Helper: Navigation
  function navigateToSection(section) {
    const sectionId = section.toLowerCase().replace(/ /g, '');
    const sectionElem = document.getElementById(sectionId);
    if (sectionElem) {
      window.location.hash = '#' + sectionId;
      addMessage(`Navigating to ${section}...`, 'bot');
    } else {
      addMessage(`Sorry, I couldn't find the section "${section}".`, 'bot');
    }
  }

  // Chatbot response logic
  function handleUserInput(input) {
    const text = input.trim().toLowerCase();
    if (!text) return;
    // Navigation commands
    if (text.startsWith('go to ') || text.startsWith('show ')) {
      const section = text.replace('go to ', '').replace('show ', '');
      navigateToSection(section);
      return;
    }
    // Greetings
    if (["hi", "hello", "hey"].includes(text)) {
      addMessage("Hello! I'm Robo 🤖. You can ask me to navigate, e.g., 'Go to About'.", 'bot');
      return;
    }
    // Help
    if (text.includes('help')) {
      addMessage("You can say things like: 'Go to About', 'Show Skills', or just chat with me!", 'bot');
      return;
    }
    // Fallback
    addMessage("I'm here to help you navigate the site! Try 'Go to About' or 'Show Experience'.", 'bot');
  }

  // Form submit handler
  chatbotForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const userInput = chatbotInput.value;
    if (!userInput.trim()) return;
    addMessage(userInput, 'user');
    chatbotInput.value = '';
    setTimeout(() => handleUserInput(userInput), 500);
  });

  // Initial welcome message
  addMessage("Hi! I'm Robo 🤖. Type 'help' to see what I can do.", 'bot');
});
