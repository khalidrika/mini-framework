<h1 align="center">State Management</h1>

## Features

- **Persistence**: State survives page refreshes.
- **Reactivity**: Components can subscribe to changes.
- **Immutability**: Prevent accidental state mutations.
- **Clean API**: Familiar patterns (React-like).

## Methods/Properties

1. `setState()`
    - Uses shallow merge (for nested objects, consider deep merge libraries)
    - Persists entire state to localStorage automatically
    - Notifies all subscribers synchronously

2. `getState()`
    - Returns a copy to enforce immutability
    - Prevents external code from modifying internal state directly

3. `subscribe()`
    - Implements observer pattern with Set for efficient lookups
    - Returns cleanup function for memory leak prevention

## Usage Example

```js
// Initialize
const state = new State({ theme: 'dark' });

// Subscribe
const unsubscribe = state.subscribe(stt => {
  console.log('New state:', stt);
});

// Update
state.setState({ user: { name: 'Alice' } }); 
// Console logs: "New state: { theme: 'dark', user: { name: 'Alice' } }"

// Unsubscribe later
unsubscribe();
```
