const promptForm = document.getElementById("promptForm");
const promptsContainer = document.getElementById("promptsContainer");

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addPrompt();
});

// Notes storage and helper functions
function getNotes(promptId) {
  const raw = localStorage.getItem("promptNotes");
  const allNotes = raw ? JSON.parse(raw) : {};
  return allNotes[promptId] || [];
}

function saveNotes(promptId, notes) {
  const raw = localStorage.getItem("promptNotes");
  const allNotes = raw ? JSON.parse(raw) : {};
  allNotes[promptId] = notes;
  try {
    localStorage.setItem("promptNotes", JSON.stringify(allNotes));
  } catch (error) {
    showErrorBanner("Failed to save notes: " + error.message);
  }
}

function addNote(promptId, content) {
  if (!content.trim()) return;
  const notes = getNotes(promptId);
  const note = {
    id: "note-" + Date.now(),
    content: content.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  notes.push(note);
  saveNotes(promptId, notes);
  renderPrompts();
}

function updateNote(promptId, noteId, content) {
  if (!content.trim()) return;
  const notes = getNotes(promptId);
  const note = notes.find((n) => n.id === noteId);
  if (note) {
    note.content = content.trim();
    note.updatedAt = Date.now();
    saveNotes(promptId, notes);
    renderPrompts();
  }
}

function deleteNote(promptId, noteId) {
  if (!confirm("Delete this note?")) return;
  const notes = getNotes(promptId).filter((n) => n.id !== noteId);
  saveNotes(promptId, notes);
  renderPrompts();
}

function showErrorBanner(message) {
  const banner = document.createElement("div");
  banner.className = "error-banner";
  banner.textContent = message;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 3000);
}

function getPrompts() {
  const raw = localStorage.getItem("fewShotPrompts");
  return raw ? JSON.parse(raw) : [];
}

function savePrompts(prompts) {
  localStorage.setItem("fewShotPrompts", JSON.stringify(prompts));
}

function getUserId() {
  let userId = localStorage.getItem("promptUserId");
  if (!userId) {
    userId = "user-" + Date.now();
    localStorage.setItem("promptUserId", userId);
  }
  return userId;
}

function addPrompt() {
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();

  if (!title || !content) {
    alert("Please enter both a title and content.");
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
    createdAt: new Date().toISOString(),
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
  const prompt = prompts.find((item) => item.id === promptId);
  if (!prompt) return;

  const userId = getUserId();
  prompt.ratings = prompt.ratings.filter((item) => item.userId !== userId);
  prompt.ratings.push({ userId, score });
  prompt.ratingCount = prompt.ratings.length;
  prompt.averageRating = calculateAverageRating(prompt.ratings);

  savePrompts(prompts);
  renderPrompts();
}

function getUserRating(promptId) {
  const userId = getUserId();
  const prompt = getPrompts().find((item) => item.id === promptId);
  if (!prompt) return 0;
  const rating = prompt.ratings.find((item) => item.userId === userId);
  return rating ? rating.score : 0;
}

function highlightStars(wrapper, hoverRating) {
  Array.from(wrapper.children).forEach((star) => {
    const starRating = Number(star.dataset.rating);
    star.classList.toggle("hovered", starRating <= hoverRating);
  });
}

function restoreStars(wrapper, currentRating) {
  Array.from(wrapper.children).forEach((star) => {
    const starRating = Number(star.dataset.rating);
    star.classList.toggle("hovered", false);
    star.classList.toggle("filled", starRating <= currentRating);
  });
}

function createStarRating(promptId, currentRating) {
  const wrapper = document.createElement("div");
  wrapper.className = "stars";

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.textContent = "★";
    star.dataset.rating = i;
    if (i <= currentRating) star.classList.add("filled");

    star.addEventListener("mouseenter", () => highlightStars(wrapper, i));
    star.addEventListener("mouseleave", () =>
      restoreStars(wrapper, currentRating),
    );
    star.addEventListener("click", () => ratePrompt(promptId, i));

    wrapper.appendChild(star);
  }

  wrapper.addEventListener("mouseleave", () =>
    restoreStars(wrapper, currentRating),
  );
  return wrapper;
}

function deletePrompt(promptId) {
  const prompts = getPrompts().filter((item) => item.id !== promptId);
  savePrompts(prompts);
  renderPrompts();
}

function renderPrompts() {
  const prompts = getPrompts();
  promptsContainer.innerHTML = "";

  if (prompts.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent =
      "No prompts available yet. Create one on the left.";
    promptsContainer.appendChild(emptyMessage);
    return;
  }

  prompts.forEach((prompt) => {
    const card = document.createElement("div");
    card.className = "prompt-card";
    card.dataset.promptId = prompt.id;

    const header = document.createElement("div");
    header.className = "card-header";

    const title = document.createElement("h3");
    title.textContent = prompt.title;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deletePrompt(prompt.id));

    header.appendChild(title);
    header.appendChild(deleteButton);

    const preview = document.createElement("p");
    preview.className = "prompt-preview";
    const words = prompt.content.split(" ");
    preview.textContent =
      words.slice(0, 30).join(" ") + (words.length > 30 ? "..." : "");

    const ratingContainer = document.createElement("div");
    ratingContainer.className = "rating-details";

    const selectedRating = getUserRating(prompt.id);
    const stars = createStarRating(prompt.id, selectedRating);

    const summary = document.createElement("span");
    summary.className = "rating-summary";
    summary.textContent =
      prompt.ratingCount > 0
        ? `${prompt.averageRating} / 5 · ${prompt.ratingCount} rating${prompt.ratingCount === 1 ? "" : "s"}`
        : "No ratings yet";

    ratingContainer.appendChild(stars);
    ratingContainer.appendChild(summary);

    // Notes section
    const notesSection = document.createElement("div");
    notesSection.className = "notes-section";

    const notesTitle = document.createElement("h4");
    notesTitle.className = "notes-title";
    notesTitle.textContent = "Notes";

    const notesList = document.createElement("ul");
    notesList.className = "notes-list";
    notesList.dataset.promptId = prompt.id;

    const notes = getNotes(prompt.id);
    notes.forEach((note) => {
      const noteItem = document.createElement("li");
      noteItem.className = "note-item";
      noteItem.dataset.noteId = note.id;

      const noteContent = document.createElement("div");
      noteContent.className = "note-content";
      noteContent.textContent = note.content;

      const noteActions = document.createElement("div");
      noteActions.className = "note-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "note-btn edit-note-btn";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () =>
        startEditNote(prompt.id, note.id, note.content, noteItem),
      );

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "note-btn delete-note-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteNote(prompt.id, note.id));

      noteActions.appendChild(editBtn);
      noteActions.appendChild(deleteBtn);

      noteItem.appendChild(noteContent);
      noteItem.appendChild(noteActions);
      notesList.appendChild(noteItem);
    });

    const addNoteForm = document.createElement("div");
    addNoteForm.className = "add-note-form";

    const noteInput = document.createElement("textarea");
    noteInput.className = "note-input";
    noteInput.placeholder = "Add a note...";
    noteInput.rows = 2;

    const noteButtonGroup = document.createElement("div");
    noteButtonGroup.className = "note-button-group";

    const addBtn = document.createElement("button");
    addBtn.className = "btn note-save-btn";
    addBtn.textContent = "Add Note";
    addBtn.addEventListener("click", () => {
      addNote(prompt.id, noteInput.value);
      noteInput.value = "";
    });

    noteInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        addNote(prompt.id, noteInput.value);
        noteInput.value = "";
      }
    });

    noteButtonGroup.appendChild(addBtn);
    addNoteForm.appendChild(noteInput);
    addNoteForm.appendChild(noteButtonGroup);

    notesSection.appendChild(notesTitle);
    notesSection.appendChild(notesList);
    notesSection.appendChild(addNoteForm);

    card.appendChild(header);
    card.appendChild(preview);
    card.appendChild(ratingContainer);
    card.appendChild(notesSection);
    promptsContainer.appendChild(card);
  });
}

function startEditNote(promptId, noteId, currentContent, noteItem) {
  const noteContent = noteItem.querySelector(".note-content");
  const noteActions = noteItem.querySelector(".note-actions");

  const editor = document.createElement("textarea");
  editor.className = "note-editor";
  editor.rows = 2;
  editor.value = currentContent;

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "edit-button-group";

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn note-save-btn";
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", () => {
    updateNote(promptId, noteId, editor.value);
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn note-cancel-btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => renderPrompts());

  editor.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      updateNote(promptId, noteId, editor.value);
    } else if (e.key === "Escape") {
      renderPrompts();
    }
  });

  buttonGroup.appendChild(saveBtn);
  buttonGroup.appendChild(cancelBtn);

  noteContent.replaceWith(editor);
  noteActions.replaceWith(buttonGroup);
}

renderPrompts();
