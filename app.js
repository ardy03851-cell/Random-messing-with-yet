import { models } from './models.js';

class CodeAssistantApp {
  constructor() {
    this.models = models;
    this.selectedModel = models[0]; // Default to Kimi k3
    
    // UI Anchors
    this.modelSelectorContainer = document.getElementById('model-selector-container');
    this.chatForm = document.getElementById('chat-form');
    this.userPromptInput = document.getElementById('user-prompt');
    this.messagesList = document.getElementById('messages-list');
    this.chatViewport = document.getElementById('chat-viewport');
    this.welcomeBanner = document.getElementById('welcome-banner');
    this.clearBtn = document.getElementById('clear-chat');

    this.init();
  }

  init() {
    this.renderModelSelector();
    this.attachEventListeners();
  }

  // Generates the model selection menu automatically from models.js
  renderModelSelector() {
    this.modelSelectorContainer.innerHTML = `
      <div class="model-dropdown-wrapper">
        <button class="model-trigger-btn" id="model-trigger">
          <span class="selected-icon">${this.selectedModel.logoSvg}</span>
          <span class="selected-name">${this.selectedModel.name}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <div class="model-menu" id="model-menu">
          ${this.models.map(model => `
            <div class="model-item ${model.id === this.selectedModel.id ? 'active' : ''}" data-id="${model.id}">
              <div class="model-icon">${model.logoSvg}</div>
              <div class="model-info">
                <div class="model-header">
                  <span class="model-name">${model.name}</span>
                  <span class="model-badge">${model.badge}</span>
                </div>
                <div class="model-desc">${model.description}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Menu toggle logic
    const trigger = document.getElementById('model-trigger');
    const menu = document.getElementById('model-menu');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });

    document.addEventListener('click', () => menu.classList.remove('open'));

    // Handle smooth switching
    menu.querySelectorAll('.model-item').forEach(item => {
      item.addEventListener('click', () => {
        const targetId = item.getAttribute('data-id');
        this.selectedModel = this.models.find(m => m.id === targetId);
        this.renderModelSelector();
      });
    });
  }

  attachEventListeners() {
    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSend();
    });

    this.userPromptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    this.clearBtn.addEventListener('click', () => {
      this.messagesList.innerHTML = '';
      this.welcomeBanner.style.display = 'block';
    });
  }

  async handleSend() {
    const promptText = this.userPromptInput.value.trim();
    if (!promptText) return;

    // Hide welcome screen
    this.welcomeBanner.style.display = 'none';

    // Append User Message with User Icon (SVG)
    this.appendMessage('user', promptText);
    this.userPromptInput.value = '';

    // Append Loading State AI Message with AI Vector Logo
    const aiMessageEl = this.appendMessage('ai', 'Processing code request...', true);

    try {
      const response = await fetch(this.selectedModel.endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.selectedModel.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.selectedModel.id,
          messages: [{ role: "user", content: promptText }]
        })
      });

      const data = await response.json();
      const aiReply = data.choices?.[0]?.message?.content || "No response received.";
      
      // Update assistant bubble content
      this.updateMessageContent(aiMessageEl, aiReply);
    } catch (err) {
      this.updateMessageContent(aiMessageEl, `Error: ${err.message}`);
    }
  }

  appendMessage(sender, text, isLoading = false) {
    const row = document.createElement('div');
    row.className = `message-row ${sender}`;

    const userSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    const aiSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5"><path d="M5 8L10 12L5 16"/><path d="M13 16H18"/></svg>`;

    row.innerHTML = `
      <div class="avatar ${sender}-avatar">
        ${sender === 'user' ? userSvg : aiSvg}
      </div>
      <div class="message-content">
        ${this.formatContent(text)}
      </div>
    `;

    this.messagesList.appendChild(row);
    this.chatViewport.scrollTop = this.chatViewport.scrollHeight;
    return row.querySelector('.message-content');
  }

  updateMessageContent(element, rawText) {
    element.innerHTML = this.formatContent(rawText);
    this.chatViewport.scrollTop = this.chatViewport.scrollHeight;
  }

  // Format code blocks
  formatContent(text) {
    // Basic Markdown code block conversion
    return text
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>');
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => new CodeAssistantApp());
