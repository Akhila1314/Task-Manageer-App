
"use strict";

const STORAGE_KEY = "taskflow-tasks-v1";

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const statusMessage = document.getElementById("status-message");

const totalCount = document.getElementById("total-count");
const completedCount = document.getElementById("completed-count");
const remainingCount = document.getElementById("remaining-count");
const taskSummary = document.getElementById("task-summary");
const clearCompletedButton = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter");

let tasks = loadTasks();
let currentFilter = "all";
let statusTimer;

document.getElementById("current-year").textContent =
    new Date().getFullYear();

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        if (!Array.isArray(parsed)) return [];

        return parsed.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.completed === "boolean"
        );
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Could not save tasks:", error);
        showStatus("Unable to save tasks in this browser.", true);
        return false;
    }
}

function showStatus(message, isError = false) {
    clearTimeout(statusTimer);
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? "#d74755" : "#21865b";

    statusTimer = setTimeout(() => {
        statusMessage.textContent = "";
    }, 3000);
}

function addTask(text) {
    const task = {
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task);
    saveTasks();
    currentFilter = "all";
    updateFilterButtons();
    renderTasks();
    showStatus("Task added successfully.");
}

function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, completed: !task.completed }
            : task
    );

    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    showStatus("Task deleted.");
}

function clearCompleted() {
    const before = tasks.length;
    tasks = tasks.filter(task => !task.completed);

    if (before === tasks.length) {
        showStatus("There are no completed tasks to clear.");
        return;
    }

    saveTasks();
    renderTasks();
    showStatus("Completed tasks cleared.");
}

function updateFilterButtons() {
    filterButtons.forEach(button => {
        const isActive = button.dataset.filter === currentFilter;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function createTaskElement(task) {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Complete ${task.text}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const content = document.createElement("div");
    content.className = "task-text";

    // Use textContent rather than innerHTML for user-entered text.
    const title = document.createElement("div");
    title.textContent = task.text;
    content.appendChild(title);

    if (task.createdAt) {
        const date = document.createElement("span");
        date.className = "task-date";
        date.textContent = `Added ${formatDate(task.createdAt)}`;
        content.appendChild(date);
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${task.text}`);
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    item.append(checkbox, content, deleteButton);

    return item;
}

function renderTasks() {
    const completed = tasks.filter(task => task.completed).length;
    const remaining = tasks.length - completed;

    totalCount.textContent = tasks.length;
    completedCount.textContent = completed;
    remainingCount.textContent = remaining;
    taskSummary.textContent =
        `${remaining} task${remaining === 1 ? "" : "s"} remaining`;

    const visibleTasks = tasks.filter(task => {
        if (currentFilter === "active") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    taskList.replaceChildren();

    visibleTasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });

    emptyState.hidden = visibleTasks.length !== 0;

    if (tasks.length === 0) {
        emptyState.querySelector("h3").textContent = "No tasks yet";
        emptyState.querySelector("p").textContent =
            "Add your first task to get started.";
    } else if (visibleTasks.length === 0) {
        emptyState.querySelector("h3").textContent = "Nothing to show";
        emptyState.querySelector("p").textContent =
            "Try another filter to see your tasks.";
    }
}

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) {
        showStatus("Please enter a task first.", true);
        taskInput.focus();
        return;
    }

    addTask(text);
    taskInput.value = "";
    taskInput.focus();
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        updateFilterButtons();
        renderTasks();
    });
});

clearCompletedButton.addEventListener("click", clearCompleted);

renderTasks();
