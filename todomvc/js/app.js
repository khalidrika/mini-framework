import { TodoRenderer } from './todoRenderer.js';
import { Event } from "/shedjs/events.js";
import { Route } from "/shedjs/routes.js";
import { State } from "/shedjs/state.js";

const todoInput = document.getElementById('todo-input');
const todoListEl = document.querySelector('.todo-list');

let shedEvent = new Event();
let router = new Route();

let initialTodos = [];
const appState = new State({
    todos: initialTodos,
    currentFilter: 'all'
});

// Replace the old renderTodos function with the efficient TodoRenderer
const todoRenderer = new TodoRenderer(todoListEl, appState);

function showAllTodos() {
    appState.setState({ currentFilter: 'all' });
}

function showActiveTodos() {
    appState.setState({ currentFilter: 'active' });
}

function showCompletedTodos() {
    appState.setState({ currentFilter: 'completed' });
}

function setupRoutes() {
    router.addRoute('/', showAllTodos);
    router.addRoute('/active', showActiveTodos);
    router.addRoute('/completed', showCompletedTodos);
}

function addTodo(e) {
    if (e.key === 'Enter') {
        const text = todoInput.value.trim();
        if (text === '') return;

        const currentTodos = appState.getState().todos;
        const newTodos = [
            ...currentTodos,
            { id: Date.now(), text: text, completed: false }
        ];
        appState.setState({ todos: newTodos });

        todoInput.value = '';
    }
}

function deleteTodo(id) {
    const currentTodos = appState.getState().todos;
    const updatedTodos = currentTodos.filter(todo => todo.id !== id);
    appState.setState({ todos: updatedTodos });
}

function toggleTodo(id) {
    const currentTodos = appState.getState().todos;
    const updatedTodos = currentTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    appState.setState({ todos: updatedTodos });
}

function startEditing(id, liElement) {
    // Store original value before editing
    const todo = appState.getState().todos.find(t => t.id === id);
    liElement.dataset.originalText = todo.text;
    
    liElement.classList.add('editing');
    const editInput = liElement.querySelector('.edit');
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
}

function finishEditing(id, liElement, newText) {
    const text = newText.trim();
    liElement.classList.remove('editing');

    if (text === '') {
        deleteTodo(id);
    } else {
        const currentTodos = appState.getState().todos;
        const updatedTodos = currentTodos.map(todo =>
            todo.id === id ? { ...todo, text: text } : todo
        );
        appState.setState({ todos: updatedTodos });
    }
}

// Event handlers
shedEvent.onEvent('keypress', '#todo-input', addTodo);

shedEvent.onEvent('click', '.filters a', (e) => {
    e.preventDefault();
    const target = e.target;
    const href = target.getAttribute('href');
    const path = href.substring(1);
    router.navigate(path);
});

shedEvent.onEvent('click', '.todo-list', (e) => {
    const target = e.target;

    if (target.classList.contains('toggle-all') && target.type === 'checkbox') {
        const currentTodos = appState.getState().todos;
        const markAsCompleted = target.checked;
        const updatedTodos = currentTodos.map(todo => ({ ...todo, completed: markAsCompleted }));
        appState.setState({ todos: updatedTodos });
        return;
    }

    const li = target.closest('li');
    if (li) {
        const todoId = Number(li.dataset.id);
        if (target.classList.contains('destroy')) {
            deleteTodo(todoId);
        } else if (target.classList.contains('toggle') && target.type === 'checkbox') {
            toggleTodo(todoId);
        }
        return;
    }
});

shedEvent.onEvent('dblclick', '.todo-list', (e) => {
    const target = e.target;
    if (target.tagName === 'LABEL') {
        const li = target.closest('li');
        if (!li) return;
        const todoId = Number(li.dataset.id);
        startEditing(todoId, li);
    }
});

shedEvent.onEvent('blur', '.edit', e => {
    const editInput = e.target;
    const li = editInput.closest('li');
    if (!li || !li.classList.contains('editing')) return;
    
    // Cancel on blur - restore original value
    editInput.value = li.dataset.originalText;
    li.classList.remove('editing');
});

shedEvent.onEvent('keyup', '.todo-list', e => {
    const target = e.target;
    if (target.classList.contains('edit')) {
        const li = target.closest('li');
        if (!li) return;
        const todoId = Number(li.dataset.id);

        if (e.key === 'Enter') {
            finishEditing(todoId, li, target.value);
        } else if (e.key === 'Escape') {
            li.classList.remove('editing');
            // The renderer will automatically update when needed
        }
    }
});

// Clear-completed event handler
shedEvent.onEvent('click', '.clear-completed', () => {
    console.log('Before clear:', appState.getState().todos);
    const currentTodos = appState.getState().todos;
    const updatedTodos = currentTodos.filter(todo => !todo.completed);
    appState.setState({ todos: updatedTodos });
    console.log('After clear:', appState.getState().todos);
});

// Initialize the application
function initApp() {
    setupRoutes();
    router.init();
    // Initial render happens automatically when TodoRenderer is created
}

// Start the application
initApp();

// For testing/debugging - you can still manually trigger renders
window.todoRenderer = todoRenderer;
