// Prompt Library JavaScript

document.addEventListener('DOMContentLoaded', function() {
    renderPrompts();
    
    document.getElementById('promptForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addPrompt();
    });
});

function getPrompts() {
    const prompts = localStorage.getItem('prompts');
    return prompts ? JSON.parse(prompts) : [];
}

function savePrompts(prompts) {
    localStorage.setItem('prompts', JSON.stringify(prompts));
}

function addPrompt() {
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    
    if (!title || !content) {
        alert('Please fill in both title and content.');
        return;
    }
    
    const prompts = getPrompts();
    const newPrompt = {
        id: Date.now(),
        title: title,
        content: content
    };
    
    prompts.push(newPrompt);
    savePrompts(prompts);
    
    // Clear form
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    
    renderPrompts();
}

function deletePrompt(id) {
    let prompts = getPrompts();
    prompts = prompts.filter(prompt => prompt.id !== id);
    savePrompts(prompts);
    renderPrompts();
}

function renderPrompts() {
    const container = document.getElementById('promptsContainer');
    const prompts = getPrompts();
    
    container.innerHTML = '';
    
    if (prompts.length === 0) {
        container.innerHTML = '<p class="empty-message">No prompts saved yet. Create your first prompt above!</p>';
        return;
    }
    
    prompts.forEach(prompt => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        
        // Create preview: first 20 words
        const words = prompt.content.split(' ');
        const preview = words.slice(0, 20).join(' ') + (words.length > 20 ? '...' : '');
        
        card.innerHTML = `
            <h3>${prompt.title}</h3>
            <p class="prompt-preview">${preview}</p>
            <button class="delete-btn" onclick="deletePrompt(${prompt.id})">Delete</button>
        `;
        
        container.appendChild(card);
    });
}