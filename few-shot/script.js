const promptForm = document.getElementById('promptForm');
const promptsContainer = document.getElementById('promptsContainer');

promptForm.addEventListener('submit', event => {
    event.preventDefault();
    addPrompt();
});

function getPrompts() {
    const raw = localStorage.getItem('fewShotPrompts');
    return raw ? JSON.parse(raw) : [];
}

function savePrompts(prompts) {
    localStorage.setItem('fewShotPrompts', JSON.stringify(prompts));
}

function getUserId() {
    let userId = localStorage.getItem('promptUserId');
    if (!userId) {
        userId = 'user-' + Date.now();
        localStorage.setItem('promptUserId', userId);
    }
    return userId;
}

function addPrompt() {
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();

    if (!title || !content) {
        alert('Please enter both a title and content.');
        return;
    }

    const prompts = getPrompts();
    prompts.unshift({
        id: Date.now(),
        title,
        content,
        ratings: [],
        averageRating: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString()
    });

    savePrompts(prompts);
    promptForm.reset();
    renderPrompts();
}

function calculateAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0;
    const total = ratings.reduce((sum, item) => sum + item.score, 0);
    return Number((total / ratings.length).toFixed(2));
}

function ratePrompt(promptId, score) {
    const prompts = getPrompts();
    const prompt = prompts.find(item => item.id === promptId);
    if (!prompt) return;

    const userId = getUserId();
    prompt.ratings = prompt.ratings.filter(item => item.userId !== userId);
    prompt.ratings.push({ userId, score });
    prompt.ratingCount = prompt.ratings.length;
    prompt.averageRating = calculateAverageRating(prompt.ratings);

    savePrompts(prompts);
    renderPrompts();
}

function getUserRating(promptId) {
    const userId = getUserId();
    const prompt = getPrompts().find(item => item.id === promptId);
    if (!prompt) return 0;
    const rating = prompt.ratings.find(item => item.userId === userId);
    return rating ? rating.score : 0;
}

function highlightStars(wrapper, hoverRating) {
    Array.from(wrapper.children).forEach(star => {
        const starRating = Number(star.dataset.rating);
        star.classList.toggle('hovered', starRating <= hoverRating);
    });
}

function restoreStars(wrapper, currentRating) {
    Array.from(wrapper.children).forEach(star => {
        const starRating = Number(star.dataset.rating);
        star.classList.toggle('hovered', false);
        star.classList.toggle('filled', starRating <= currentRating);
    });
}

function createStarRating(promptId, currentRating) {
    const wrapper = document.createElement('div');
    wrapper.className = 'stars';

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '★';
        star.dataset.rating = i;
        if (i <= currentRating) star.classList.add('filled');

        star.addEventListener('mouseenter', () => highlightStars(wrapper, i));
        star.addEventListener('mouseleave', () => restoreStars(wrapper, currentRating));
        star.addEventListener('click', () => ratePrompt(promptId, i));

        wrapper.appendChild(star);
    }

    wrapper.addEventListener('mouseleave', () => restoreStars(wrapper, currentRating));
    return wrapper;
}

function deletePrompt(promptId) {
    const prompts = getPrompts().filter(item => item.id !== promptId);
    savePrompts(prompts);
    renderPrompts();
}

function renderPrompts() {
    const prompts = getPrompts();
    promptsContainer.innerHTML = '';

    if (prompts.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No prompts available yet. Create one on the left.';
        promptsContainer.appendChild(emptyMessage);
        return;
    }

    prompts.forEach(prompt => {
        const card = document.createElement('div');
        card.className = 'prompt-card';

        const header = document.createElement('div');
        header.className = 'card-header';

        const title = document.createElement('h3');
        title.textContent = prompt.title;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deletePrompt(prompt.id));

        header.appendChild(title);
        header.appendChild(deleteButton);

        const preview = document.createElement('p');
        preview.className = 'prompt-preview';
        const words = prompt.content.split(' ');
        preview.textContent = words.slice(0, 30).join(' ') + (words.length > 30 ? '...' : '');

        const ratingContainer = document.createElement('div');
        ratingContainer.className = 'rating-details';

        const selectedRating = getUserRating(prompt.id);
        const stars = createStarRating(prompt.id, selectedRating);

        const summary = document.createElement('span');
        summary.className = 'rating-summary';
        summary.textContent = prompt.ratingCount > 0
            ? `${prompt.averageRating} / 5 · ${prompt.ratingCount} rating${prompt.ratingCount === 1 ? '' : 's'}`
            : 'No ratings yet';

        ratingContainer.appendChild(stars);
        ratingContainer.appendChild(summary);

        card.appendChild(header);
        card.appendChild(preview);
        card.appendChild(ratingContainer);
        promptsContainer.appendChild(card);
    });
}

renderPrompts();