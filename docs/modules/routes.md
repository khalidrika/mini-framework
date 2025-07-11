<h1 align="center">Routing System</h1>

**Core Methods**

| Methods                           | Description                              |
|-----------------------------------|------------------------------------------|
| `instance.addRoute(path, action)` | Register the route and its handler.      |
| `instance.navigate(path)`         | Navigates to a specified route.          |
| `instance.renderRoute(path)`      | Maps a path to an action.                |
| `instance.renderInitialRoute()`   | Handles browser back/forward navigation. |

## Example Usage

* example 1 : `addRoute` and `renderInitialRoute`
```js
import Route from './Routes.js';

const route = new Route();

route.addRoute('/', () => {
    document.body.textContent = 'Home Page';
});
route.addRoute('/about', () => {
    document.body.textContent = 'About Page';
});

route.renderInitialRoute(); // Displays the page corresponding to the current URL
```

* example 2 : `navigate`
```js
import Route from './Routes.js';

const route = new Route();

route.addRoute('/', () => {
    document.body.textContent = 'Home';
});
route.addRoute('/about', () => {
    document.body.textContent = 'About';
});

route.renderInitialRoute();

setTimeout(() => {
    route.navigate('/about'); // Changes the route to "/about"
}, 2000);
```

* example 3 : `renderRoute`
```js
import Route from './Routes.js';

const route = new Route();

route.addRoute('/contact', () => {
    document.body.textContent = 'Contact Page';
});

route.renderRoute('/contact'); // Displays the "Contact Page" without changing the URL
```
