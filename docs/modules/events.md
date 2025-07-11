<h1 align="center">Event Handling</h1>

Event handling with Shed.js elements is similar to event handling with DOM elements, such as `addEventListener()`.  
There are a few differences in syntax, Shed offers an APi:  

* Check if events are supported
* Assign a unique ID to each handler to facilitate later deletion
* Handle events on specific CSS selectors if dealing with DOM-related event types like`(mouse events, keyboard events, form events)` and Window/Document events if dealing with document or window-related event types.like 

This documentation specifically supports the two main functions: `onEvent` and `removeEvent`.

| Methods                                       | Description                                                                             |
|-----------------------------------------------|-----------------------------------------------------------------------------------------|
| `instance.onEvent(event, selector, callback)` | Registers an event handler to elements matching the CSS selector, returns handler ID.   |
| `instance.removeEvent(handlerId)`             | Removes an event handler by its ID, returns true if successful.                         |
| `instance.destry()`                           | Completely shut down an ENTIRE event system (for complex apps).                         |

## API

### 1. `instance.onEvent(evenType, selector, callback)`

Adds an event handler to an element corresponding to the CSS or window or document selector.

- **Parameters:**
  * `evenType`: This paramater is a string representing the name of event to monitor (ex: click, input, load...)
  * `selector`: As a string, this parameter representing a selector CSS or `'window'` or `'document'`(ex:`#btn`, `.input`, `window or document`)
  * `callback`: Function executed on event

- **Return:**
  * `id`: Unique handler ID for later deletion  
  * `-1` if event not supported

- **Behavior:**
  * if the event is not supported by Shed, a warning message is displayed and the function returns 
    -1

----

### 2. `instance.removeEvent(id)`

Removes an event handler using its ID

- **Parameters:**
  * `handleID`: ID of handler to be removed (id returned by onEvent)

- **Return:**
  * `true` if the handler is found
  * `false` if the handler is not found by this ID

- **Behavior:**
  * if the ID cannot be found, a warning message is displayed
    and the function returns false.

----

### 3. `instance.destroy()`

Completely shut down an ENTIRE event system.  
Browser automatically cleans up when page closes,  
So this method is mainly for complex apps that dynamically create/remove event systems.  

- **Parameters:** Nothing

- **Return:** Nothing

- **Behavior:**

  Disconnects MutationObserver  
  Resets all internal state  

```
instance.removeEvent(id)
├── finds specific handler
└── removes handler from array

instance.destroy() 
├── removes DOM listeners
├── clears handler's listener maps
└── cleans up observers & arrays
```

## Examples: `onEvent()` `removeEvent()`

1. **Add a handler for a click on a button with Shed**

```js
import {Event} from 'events.js'

const handlerId = Event.onEvent('click', "#btn", () => {
 console.log('Button clicked !!');
})

// Displays: "Event handler added with ID: 0 => click on #btn"
console.log(handlerID) // displays 0
```

2. **Remove the handler with Shed**

```js
import {Event} from 'events.js'

Event.removeEvent(handlerID)

// Display : "Event handler removed with ID: 0"
console.log(handlerID) // display 0

// Try to remove a non-existent ID, like
Event.removeEvent(99) // You get an error message like this: No handler with this ID: 99
```

3. **Resize the window with Shed**

```js
import {Event} from 'events.js'

const handlerId = Event.onEvent('resize', 'window', () => {
 console.log('Window resized !!');
})
```

## Examples: `destroy()`

1. **Single Page Applications (SPAs)**

```js
// When navigating away from a page/component
function unmountComponent() {
    eventSystem.destroy(); // Clean up before switching pages
}
```

2. **Dynamic Framework Instances**

```js
// If your app creates multiple Event instances
function createModal() {
    const modalEvents = new Event();
    modalEvents.onEvent('click', '.close-btn', closeModal);
    
    // When modal is closed:
    modalEvents.destroy(); // Clean up this specific instance
}
```

3. **Testing/Development**

```js
// In unit tests
afterEach(() => {
    eventSystem.destroy(); // Clean slate for next test
});
```

4. **Memory-Conscious Applications**

```js
// Long-running apps that create/destroy many components
function cleanupOldFeatures() {
    oldEventSystems.forEach(es => es.destroy());
}
```

## Good practices

* Check supported events: Consult the supportedEvents list of your `Event` instance to avoid errors.

* Store IDs: Keep the ID returned by `onEvent` so you can delete handlers later.

* Use specific selectors: Prefer specific selectors (e.g. `#id` or `.class`) to avoid unexpected behavior.
