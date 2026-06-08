/* MEMORY */
let isProcessing = false;
let conversationHistory = [];
let currentSelectedContext = "";
const chatContainer = document.getElementById('chatContainer');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');

/* EVENTS */

sendBtn.addEventListener('click', sendMessage);

/* QUICK ACTION BUTTONS */

document.querySelectorAll('.action-btn')
    .forEach(button => {

        button.addEventListener(
            'click',
            () => handleQuickAction(
                button.dataset.action
            )
        );

    });

promptInput.addEventListener('keydown', (e) => {

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }

});

/* AUTO RESIZE */

promptInput.addEventListener('input', () => {

    promptInput.style.height = 'auto';
    promptInput.style.height = promptInput.scrollHeight + 'px';

});

/* SEND MESSAGE */

async function sendMessage() {

    if (isProcessing) return;
    isProcessing = true;

    const prompt = promptInput.value.trim();

    if (!prompt){
        isProcessing = false;
        return;
    }

    addUserMessage(prompt);
    conversationHistory.push(
    "User: " + prompt
    );

    if (conversationHistory.length > 6) {
        conversationHistory.shift();
    }

    promptInput.value = '';
    promptInput.style.height = 'auto';

    showTyping();

    try {

        const response = await fetch(
            'http://localhost:8080/api/research/process',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    message: prompt,
                    selectedContext:
                        currentSelectedContext,
                    operation: "chat",
                    conversationHistory
                })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch AI response');
        }

        const text = await response.text();

        removeTyping();
        conversationHistory.push(
            "AI: " + text
        );
        if (conversationHistory.length > 6) {
            conversationHistory.shift();
        }

        await addAIMessage(text);

    } catch (error) {

        removeTyping();

        await addAIMessage(
            "Error: " + error.message
        );
    }finally{
        isProcessing = false;
    }
}

/* QUICK ACTIONS */

async function handleQuickAction(action) {

    if (isProcessing) return;
    isProcessing = true;
    try {

        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        const [{ result }] =
            await chrome.scripting.executeScript({

                target: {
                    tabId: tab.id
                },

                function: () =>
                    window.getSelection().toString()
            });

        if (!result) {

            await addAIMessage(
                "Please select some text first."
            );
            isProcessing = false;
            return;
        }
        currentSelectedContext = result;

        addUserMessage(
            `${capitalize(action)} selected text`
        );

        conversationHistory.push(
            "User: " + capitalize(action)
        );

        if (conversationHistory.length > 6) {

            conversationHistory.shift();
        }

        showTyping();

        const response = await fetch(
            'http://localhost:8080/api/research/process',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                message: result,
                selectedContext: result,
                operation: action,
                conversationHistory
                })

            }
        );

        if (!response.ok) {
            throw new Error(
                'Failed to process request'
            );
        }

        const text = await response.text();

        removeTyping();

        conversationHistory.push(
            "AI: " + text
        );
          if (conversationHistory.length > 6) {
            conversationHistory.shift();
        }

        await addAIMessage(text);

    } catch (error) {

        removeTyping();

        await addAIMessage(
            "Error: " + error.message
        );
    }finally{
        isProcessing = false;
    }
}

/* USER MESSAGE */

function addUserMessage(message) {

    const messageDiv = document.createElement('div');

    messageDiv.className =
        'message user-message';

    messageDiv.innerHTML = `
    
        <div class="message-bubble">
            ${escapeHTML(message)}
        </div>
    
    `;

    chatContainer.appendChild(messageDiv);

    scrollToBottom();
}

/* AI MESSAGE */

async function addAIMessage(message) {

    const messageDiv =
        document.createElement('div');

    messageDiv.className =
        'message ai-message';

    const bubble =
        document.createElement('div');

    bubble.className =
        'message-bubble';

    messageDiv.appendChild(bubble);

    chatContainer.appendChild(messageDiv);

    scrollToBottom();

    /* STREAMING EFFECT */

    const html =
        marked.parse(message);

    let index = 0;

    while (index < html.length) {

        bubble.innerHTML =
            html.substring(0, index);

        index += 2;

        scrollToBottom();

        await delay(15);
    }

    bubble.innerHTML = html;

    scrollToBottom();
}

/* TYPING */

function showTyping() {

    const typingDiv = document.createElement('div');

    typingDiv.className =
        'message ai-message';

    typingDiv.id = 'typingIndicator';

    typingDiv.innerHTML = `
    
        <div class="message-bubble">
        
            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>

        </div>
    
    `;

    chatContainer.appendChild(typingDiv);

    scrollToBottom();
}

function removeTyping() {

    const typing =
        document.getElementById(
            'typingIndicator'
        );

    if (typing) {
        typing.remove();
    }
}

/* HELPERS */

function scrollToBottom() {

    chatContainer.scrollTop =
        chatContainer.scrollHeight;
}

function escapeHTML(str) {

    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function capitalize(word) {

    return word.charAt(0).toUpperCase()
        + word.slice(1);
}

function delay(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}