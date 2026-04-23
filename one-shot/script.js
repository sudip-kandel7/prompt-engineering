// Prompt Library JavaScript

let sortOrder = 'newest';

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
        content: content,
        ratings: [],
        averageRating: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString()
    };
    
    prompts.push(newPrompt);
    savePrompts(prompts);
    
    // Clear form
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    
    renderPrompts();
}

function calculateAverageRating(ratings) {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.score, 0);
    return (sum / ratings.length).toFixed(2);
}

function ratePrompt(promptId, rating) {
    const prompts = getPrompts();
    const prompt = prompts.find(p => p.id === promptId);
    const userId = getUserId();
    
    if (!prompt) return;
    
    // Remove existing rating if present
    prompt.ratings = prompt.ratings.filter(r => r.userId !== userId);
    
    // Add new rating if not removing
    if (rating > 0) {
        prompt.ratings.push({ userId: userId, score: rating });
    }
    
    // Update average
    prompt.averageRating = parseFloat(calculateAverageRating(prompt.ratings));
    prompt.ratingCount = prompt.ratings.length;
    
    savePrompts(prompts);
    renderPrompts();
}

function getUserRating(promptId) {
    const userId = getUserId();
    const prompts = getPrompts();
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return 0;
    const userRating = prompt.ratings.find(r => r.userId === userId);
    return userRating ? userRating.score : 0;
}

function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user-' + Date.now();
        localStorage.setItem('userId', userId);
    }
    return userId;
}

function renderStarRating(promptId, currentRating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= currentRating ? 'filled' : '';
        starsHTML += `<span class="star ${filled}" data-rating="${i}" onclick="ratePrompt(${promptId}, ${i})" title="Click to rate">★</span>`;
    }
    return starsHTML;
}

function setSortOrder(order) {
    sortOrder = order;
    renderPrompts();
}

function getSortedPrompts(prompts) {
    let sorted = [...prompts];
    
    if (sortOrder === 'highest-rated') {
        sorted.sort((a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating));
    } else if (sortOrder === 'most-rated') {
        sorted.sort((a, b) => b.ratingCount - a.ratingCount);
    } else {
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    return sorted;
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
    const sortedPrompts = getSortedPrompts(prompts);
    
    container.innerHTML = '';
    
    if (sortedPrompts.length === 0) {
        container.innerHTML = '<p class="empty-message">No prompts saved yet. Create your first prompt above!</p>';
        return;
    }
    
    sortedPrompts.forEach(prompt => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        
        // Create preview: first 20 words
        const words = prompt.content.split(' ');
        const preview = words.slice(0, 20).join(' ') + (words.length > 20 ? '...' : '');
        
        const currentRating = getUserRating(prompt.id);
        const starsHTML = renderStarRating(prompt.id, currentRating);
        const ratingDisplay = prompt.ratingCount > 0 
            ? `<span class="rating-info">${prompt.averageRating} (${prompt.ratingCount} rating${prompt.ratingCount !== 1 ? 's' : ''})</span>` 
            : '<span class="rating-info">Not rated yet</span>';
        
        card.innerHTML = `
            <div class="card-header">
                <h3>${prompt.title}</h3>
                <button class="delete-btn" onclick="deletePrompt(${prompt.id})">Delete</button>
            </div>
            <p class="prompt-preview">${preview}</p>
            <div class="rating-container">
                <div class="stars">${starsHTML}</div>
                ${ratingDisplay}
            </div>
        `;
        
        container.appendChild(card);
    });
}