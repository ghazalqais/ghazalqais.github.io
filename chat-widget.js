/**
 * Simple Portfolio Chat Widget
 * Clean, focused, production-ready with KEYBOARD FIX
 */

class PortfolioChatWidget {
    constructor() {
        // Configuration
        this.apiUrl = this.getApiUrl();
        this.sessionId = this.getOrCreateSession();
        
        // State
        this.isOpen = false;
        this.isTyping = false;
        this.conversationStarted = false;
        
        // KEYBOARD FIX: Add keyboard state
        this.isKeyboardOpen = false;
        this.initialViewportHeight = window.innerHeight;
        
        // DOM elements (set after init)
        this.elements = {};
        
        this.init();
    }
    
   getApiUrl() {
    const hostname = window.location.hostname;
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
    
    return isDevelopment 
        ? 'http://localhost:5000'
        : 'https://portfolio-rag-api-pwag7phooa-uc.a.run.app';
}
    
    getOrCreateSession() {
        // Get existing session or create new one
        let sessionId = localStorage.getItem('qais_chat_session');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('qais_chat_session', sessionId);
        }
        return sessionId;
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupWidget());
        } else {
            this.setupWidget();
        }
    }
    
    setupWidget() {
        // Cache DOM elements
        this.elements = {
            toggle: document.getElementById('chat-toggle'),
            container: document.getElementById('chat-container'),
            minimize: document.getElementById('chat-minimize'),
            messages: document.getElementById('chat-messages'),
            input: document.getElementById('chat-input'),
            sendBtn: document.getElementById('chat-send'),
            typing: document.getElementById('chat-typing'),
            suggestions: document.querySelector('.suggested-questions')
        };
        
        this.setupEventListeners();
        this.setupKeyboardDetection(); // KEYBOARD FIX: Add keyboard detection
        this.loadPreviousConversation();
    }
    
    setupEventListeners() {
        // Chat toggle
        this.elements.toggle.addEventListener('click', () => this.toggleChat());
        this.elements.minimize.addEventListener('click', () => this.closeChat());
        
        // Message sending
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Suggested questions
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.getAttribute('data-question');
                this.sendMessage(question);
                this.hideSuggestions();
            });
        });
        
        // Auto-resize input
        this.elements.input.addEventListener('input', this.autoResizeInput.bind(this));
    }
    
    // KEYBOARD FIX: Setup keyboard detection
    setupKeyboardDetection() {
        // Method 1: Visual Viewport API (modern browsers)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => this.handleKeyboard());
        }
        
        // Method 2: Window resize fallback
        window.addEventListener('resize', () => this.handleKeyboardFallback());
        
        // Method 3: Input focus/blur events (most reliable for mobile)
        this.elements.input.addEventListener('focus', () => this.handleInputFocus());
        this.elements.input.addEventListener('blur', () => this.handleInputBlur());
        
        // Method 4: Screen orientation change
        if (screen && screen.orientation) {
            screen.orientation.addEventListener('change', () => {
                setTimeout(() => this.handleOrientationChange(), 500);
            });
        }
    }
    
    // KEYBOARD FIX: Handle keyboard using Visual Viewport API
    handleKeyboard() {
        if (!window.visualViewport) return;
        
        const viewport = window.visualViewport;
        const heightDiff = window.innerHeight - viewport.height;
        
        if (heightDiff > 150) { // Keyboard is likely open
            if (!this.isKeyboardOpen) {
                this.isKeyboardOpen = true;
                this.elements.container.classList.add('keyboard-open');
                this.scrollInputIntoView();
                console.log('🎹 Keyboard detected (Visual Viewport)');
            }
        } else {
            if (this.isKeyboardOpen) {
                this.isKeyboardOpen = false;
                this.elements.container.classList.remove('keyboard-open');
                console.log('🎹 Keyboard hidden (Visual Viewport)');
            }
        }
    }
    
    // KEYBOARD FIX: Fallback method using window resize
    handleKeyboardFallback() {
        const heightDiff = this.initialViewportHeight - window.innerHeight;
        
        if (heightDiff > 150) {
            if (!this.isKeyboardOpen) {
                this.isKeyboardOpen = true;
                this.elements.container.classList.add('keyboard-open');
                this.scrollInputIntoView();
                console.log('🎹 Keyboard detected (Resize fallback)');
            }
        } else {
            if (this.isKeyboardOpen) {
                this.isKeyboardOpen = false;
                this.elements.container.classList.remove('keyboard-open');
                console.log('🎹 Keyboard hidden (Resize fallback)');
            }
        }
    }
    
    // KEYBOARD FIX: Handle input focus (most reliable)
    handleInputFocus() {
        // Only on mobile devices
        if (window.innerWidth <= 480) {
            setTimeout(() => {
                this.isKeyboardOpen = true;
                this.elements.container.classList.add('keyboard-open');
                this.scrollInputIntoView();
                console.log('🎹 Keyboard detected (Input focus)');
            }, 300); // Delay to allow keyboard animation
        }
    }
    
    // KEYBOARD FIX: Handle input blur
    handleInputBlur() {
        // Delay to avoid flicker when tapping send button
        setTimeout(() => {
            if (!this.elements.input.matches(':focus')) {
                this.isKeyboardOpen = false;
                this.elements.container.classList.remove('keyboard-open');
                console.log('🎹 Keyboard hidden (Input blur)');
            }
        }, 100);
    }
    
    // KEYBOARD FIX: Handle orientation change
    handleOrientationChange() {
        // Update initial height
        this.initialViewportHeight = window.innerHeight;
        
        // Reset keyboard state to prevent stuck states
        if (this.isKeyboardOpen && !this.elements.input.matches(':focus')) {
            this.isKeyboardOpen = false;
            this.elements.container.classList.remove('keyboard-open');
        }
        
        console.log('📱 Orientation changed, reset keyboard state');
    }
    
    // KEYBOARD FIX: Scroll input into view
    scrollInputIntoView() {
        setTimeout(() => {
            // Multiple scroll strategies
            this.elements.input.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
            
            // Backup scroll method
            setTimeout(() => {
                const inputRect = this.elements.input.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                
                if (inputRect.bottom > windowHeight - 20) {
                    window.scrollTo({
                        top: window.pageYOffset + (inputRect.bottom - windowHeight + 40),
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }, 100);
    }
    
    async loadPreviousConversation() {
        try {
            const response = await fetch(`${this.apiUrl}/conversation-history/${this.sessionId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    // Show previous conversation
                    data.messages.forEach(msg => {
                        this.addMessage(msg.user, 'user', false);
                        this.addMessage(msg.assistant, 'bot', false);
                    });
                    this.conversationStarted = true;
                    this.hideSuggestions();
                    console.log('📜 Loaded previous conversation');
                }
            }
        } catch (error) {
            console.log('No previous conversation found');
        }
    }
    
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }
    
    openChat() {
        this.elements.toggle.classList.add('active');
        this.elements.container.classList.add('open');
        this.isOpen = true;
        
        // Focus input after animation
        setTimeout(() => {
            this.elements.input.focus();
        }, 300);
        
        this.trackEvent('chat_opened');
    }
    
    closeChat() {
        this.elements.toggle.classList.remove('active');
        this.elements.container.classList.remove('open');
        this.isOpen = false;
        
        // KEYBOARD FIX: Reset keyboard state when closing
        if (this.isKeyboardOpen) {
            this.isKeyboardOpen = false;
            this.elements.container.classList.remove('keyboard-open');
        }
        
        this.trackEvent('chat_closed');
    }
    
    async sendMessage(messageText = null) {
        const message = messageText || this.elements.input.value.trim();
        
        if (!message || this.isTyping) return;
        
        // Clear input
        this.elements.input.value = '';
        this.autoResizeInput();
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Hide suggestions after first message
        if (!this.conversationStarted) {
            this.hideSuggestions();
            this.conversationStarted = true;
        }
        
        // Show typing
        this.showTyping();
        
        try {
            const response = await fetch(`${this.apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    session_id: this.sessionId
                })
            });
            
            const data = await response.json();
            
            this.hideTyping();
            
            if (data.status === 'success') {
                // Update session ID if provided
                if (data.session_id) {
                    this.sessionId = data.session_id;
                    localStorage.setItem('qais_chat_session', this.sessionId);
                }
                
                // Add bot response
                this.addMessage(data.response, 'bot');
                
                this.trackEvent('message_sent', { 
                    session_id: this.sessionId,
                    message_length: message.length 
                });
            } else {
                this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            }
            
        } catch (error) {
            console.error('Chat API Error:', error);
            this.hideTyping();
            
            // User-friendly error message
            const errorMsg = error.message.includes('fetch') 
                ? "I'm having trouble connecting. Please check your internet connection and try again."
                : "Sorry, something went wrong. Please try again in a moment.";
            
            this.addMessage(errorMsg, 'bot');
        }
        
        // KEYBOARD FIX: Re-focus input after sending (keeps keyboard open)
        if (this.isKeyboardOpen && window.innerWidth <= 480) {
            setTimeout(() => {
                this.elements.input.focus();
            }, 100);
        }
    }
    
    addMessage(text, sender, animate = true) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        
        const timeString = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-content">
                <p>${this.formatMessage(text)}</p>
                <div class="message-time">${timeString}</div>
            </div>
        `;
        
        // Animation setup
        if (animate) {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(20px)';
        }
        
        this.elements.messages.appendChild(messageDiv);
        
        // Animate in
        if (animate) {
            setTimeout(() => {
                messageDiv.style.transition = 'all 0.3s ease-out';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0)';
            }, 10);
        }
        
        this.scrollToBottom();
    }
    
    formatMessage(text) {
    return text
        .replace(/\n/g, '<br>')
        // Fix spacing issues
        .replace(/\.([A-Z])/g, '. $1')  // Add space after period before capital letter
        .replace(/:(•)/g, ':<br>$1')    // Line break after colon before bullet
        .replace(/•/g, '<br>• ')        // Line break and space before bullets
        // Make URLs clickable
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color: #667eea; text-decoration: underline;">$1</a>')
        // Clean formatting
        .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong>$1</strong>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\*+/g, '');
}
    
    showTyping() {
        this.isTyping = true;
        this.elements.sendBtn.disabled = true;
        this.elements.typing.style.display = 'flex';
        this.scrollToBottom();
    }
    
    hideTyping() {
        this.isTyping = false;
        this.elements.sendBtn.disabled = false;
        this.elements.typing.style.display = 'none';
    }
    
    hideSuggestions() {
        if (this.elements.suggestions) {
            this.elements.suggestions.style.opacity = '0';
            this.elements.suggestions.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                this.elements.suggestions.style.display = 'none';
            }, 300);
        }
    }
    
    autoResizeInput() {
        const input = this.elements.input;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }, 100);
    }
    
    trackEvent(eventName, data = {}) {
        // Simple event tracking
        console.log(`Chat Event: ${eventName}`, data);
        
        // Add your analytics integration here
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'portfolio_chat',
                session_id: this.sessionId,
                ...data
            });
        }
    }
    
    // KEYBOARD FIX: Add debug method for testing keyboard detection
    debugKeyboard() {
        console.log('🔍 Keyboard Debug Info:');
        console.log('  isKeyboardOpen:', this.isKeyboardOpen);
        console.log('  Container has keyboard-open class:', this.elements.container.classList.contains('keyboard-open'));
        console.log('  Input is focused:', this.elements.input.matches(':focus'));
        console.log('  Window inner height:', window.innerHeight);
        console.log('  Initial viewport height:', this.initialViewportHeight);
        console.log('  Visual viewport height:', window.visualViewport ? window.visualViewport.height : 'Not supported');
        console.log('  Height difference:', this.initialViewportHeight - window.innerHeight);
    }
    
    // KEYBOARD FIX: Force keyboard state (useful for testing)
    forceKeyboardState(isOpen) {
        this.isKeyboardOpen = isOpen;
        if (isOpen) {
            this.elements.container.classList.add('keyboard-open');
            this.scrollInputIntoView();
        } else {
            this.elements.container.classList.remove('keyboard-open');
        }
        console.log('🔧 Forced keyboard state:', isOpen);
    }
    
    // Utility method for clearing conversation (useful for testing)
    async clearConversation() {
        try {
            await fetch(`${this.apiUrl}/reset-conversation/${this.sessionId}`, {
                method: 'POST'
            });
            
            // Clear UI
            this.elements.messages.innerHTML = `
                <div class="message bot-message">
                    <div class="message-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-content">
                        <p>Hi! I'm Qais's AI assistant. Ask me anything about his projects, skills, experience, or background!</p>
                        <div class="message-time">Just now</div>
                    </div>
                </div>
                <div class="suggested-questions">
                    <button class="suggestion-btn" data-question="What projects has Qais built?">
                        🚀 What projects has Qais built?
                    </button>
                    <button class="suggestion-btn" data-question="Tell me about MedClassify">
                        🏥 Tell me about MedClassify
                    </button>
                    <button class="suggestion-btn" data-question="What are his main technical skills?">
                        💻 What are his main skills?
                    </button>
                    <button class="suggestion-btn" data-question="Tell me about his education">
                        🎓 Education background
                    </button>
                </div>
            `;
            
            // Re-setup suggestion listeners
            this.elements.suggestions = document.querySelector('.suggested-questions');
            document.querySelectorAll('.suggestion-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const question = btn.getAttribute('data-question');
                    this.sendMessage(question);
                    this.hideSuggestions();
                });
            });
            
            this.conversationStarted = false;
            
            // New session
            localStorage.removeItem('qais_chat_session');
            this.sessionId = this.getOrCreateSession();
            
            console.log('🔄 Conversation cleared');
            
        } catch (error) {
            console.error('Error clearing conversation:', error);
        }
    }
}

// Initialize chat widget when DOM is ready
const portfolioChatWidget = new PortfolioChatWidget();

// Export for potential external use and debugging
window.PortfolioChatWidget = portfolioChatWidget;

// KEYBOARD FIX: Add debug methods to window for testing
window.debugKeyboard = () => portfolioChatWidget.debugKeyboard();
window.forceKeyboard = (isOpen) => portfolioChatWidget.forceKeyboardState(isOpen);
