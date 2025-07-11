<h1 align="center">Shed.js: Getting Started</h1>

**Your Lightweight, Customizable JavaScript Framework**

Welcome to **ShedJS**! This guide will help you quickly integrate our framework into your project.  

## **1. Installation**  

### **Option A: Via CDN**  

Add these scripts to your HTML:  
```html
<script src="https://cdn.yourdomain.com/shedjs/dom.js"></script>
<script src="https://cdn.yourdomain.com/shedjs/state.js"></script>
<script src="https://cdn.yourdomain.com/shedjs/events.js"></script>
<script src="https://cdn.yourdomain.com/shedjs/routes.js"></script>
```

### **Option B: Local Installation**  

Download the core modules and include them:  
```html
<script src="/path/to/shedjs/dom.js"></script>
<script src="/path/to/shedjs/state.js"></script>
<script src="/path/to/shedjs/events.js"></script>
<script src="/path/to/shedjs/routes.js"></script>
```

## **2. Core Concepts**  

ShedJS consists of four main modules:  

| Module      | Purpose                        |
|-------------|--------------------------------|
| **`Dom`**   | Virtual DOM & DOM manipulation |
| **`State`** | Reactive state management      |
| **`Event`** | Event delegation system        |
| **`Route`** | Client-side routing            |

## **3. Basic Usage**  

### **A. Creating a Component**  

```javascript
class TodoApp {
  constructor(container) {
    this.container = container;
    this.state = new State({ todos: [] });
    this.render();
    this.state.subscribe(() => this.render());
  }

  render() {
    const { todos } = this.state.getState();
    const vdom = Dom.h('div', { class: 'todo-container' }, [
      Dom.h('h1', {}, 'My Todos'),
      Dom.h('ul', {}, todos.map(todo => 
        Dom.h('li', { key: todo.id }, todo.text)
      ))
    ]);
    
    Dom.renderWithDiff(this.container, vdom);
  }
}

// Initialize
const app = new TodoApp(document.getElementById('app'));
```

### **B. State Management**  
```javascript
const appState = new State({ count: 0 });

// Update state
appState.setState({ count: 1 });

// Subscribe to changes
appState.subscribe(() => {
  console.log("State changed:", appState.getState());
});
```

### **C. Event Handling**  

```javascript
const shedEvent = new Event();

// Handle clicks on buttons
shedEvent.onEvent('click', '.btn', (e) => {
  console.log("Button clicked!");
});

// Handle form submissions
shedEvent.onEvent('submit', '#my-form', (e) => {
  e.preventDefault();
  console.log("Form submitted!");
});
```

### **D. Routing**  

```javascript
const router = new Route();

// Define routes
router.addRoute('/', () => console.log("Home page"));
router.addRoute('/about', () => console.log("About page"));

// Start router
router.init();
```

## **4. Advanced Features**  

### **A. Virtual DOM Diffing**  

ShedJS efficiently updates only changed parts of the DOM:  
```javascript
const vdom = Dom.h('div', {}, ['Hello!']);
Dom.renderWithDiff(container, vdom);  // Only updates if needed
```

### **B. Middleware (State)**  

Add middleware for logging, validation, etc.:  
```javascript
appState.use((newState, oldState) => {
  console.log("State transition:", oldState, "→", newState);
  return newState; // Return modified state if needed
});
```

### **C. Dynamic Routing**  

```javascript
router.addRoute('/user/:id', (params) => {
  console.log("User ID:", params.id);
});
```

---

## **5. Best Practices**  

- **Use keys** for lists (`Dom.h('li', { key: item.id }, ...)`)  
- **Subscribe selectively** to avoid unnecessary renders  
- **Use event delegation** (`shedEvent.onEvent`) for dynamic elements  
- **Keep state normalized** for better performance  

## **6. Troubleshooting**  

| Issue                                | Solution                                          |
|--------------------------------------|---------------------------------------------------|
| State changes but UI doesn’t update? | Ensure `subscribe()` is set up.                   |
| Events not firing?                   | Check if elements exist when `onEvent` is called. |
| Routing not working?                 | Verify `router.init()` is called.                 |

## **7. Next Steps**  

- **[Contribute](https://github.com/Shedjs)** on GitHub  

🚀 **Happy Coding with ShedJS!** 🚀  
