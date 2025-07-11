import { Dom } from "/shedjs/dom.js";

export class TodoRenderer {
    constructor(container, appState) {
        this.container = container;
        this.appState = appState;
        this.prevVTree = null;

        // Subscribe to state changes for automatic re-rendering
        this.appState.subscribe(() => this.render());
    }

    escapeHTML(str) {
        const p = Dom.createElement('p');
        Dom.appendChild(p, Dom.createTextNode(str));
        return p.innerHTML;
    }

    // Create VDOM for a single todo item
    createTodoVNode(todo) {
        return Dom.h('li', {
            // key: todo.id.toString(), // Ensure string keys
            key: `todo-${todo.id}`, // Ensure unique key
            'data-id': todo.id,
            className: todo.completed ? 'completed' : ''
        }, [
            Dom.h('div', { className: 'view' }, [
                Dom.h('input', {
                    className: 'toggle',
                    type: 'checkbox',
                    checked: todo.completed
                }),
                Dom.h('label', {}, [this.escapeHTML(todo.text)]),
                Dom.h('button', { className: 'destroy' })
            ]),
            Dom.h('input', {
                className: 'edit',
                value: this.escapeHTML(todo.text)
            })
        ]);
    }

    // Create VDOM for the entire todo list
    createTodoListVNode() {
        const { todos, currentFilter } = this.appState.getState();

        // Filter todos
        const filteredTodos = todos.filter(todo => {
            if (currentFilter === 'active') return !todo.completed;
            if (currentFilter === 'completed') return todo.completed;
            return true;
        });

        const children = [];

        // Toggle-all section
        if (todos.length > 0) {
            children.push(
                Dom.h('div', {
                    className: 'toggle-all-container',
                    key: 'toggle-all-container'
                }, [
                    Dom.h('input', {
                        className: 'toggle-all',
                        type: 'checkbox',
                        'data-testid': 'toggle-all',
                        id: 'toggle-all',
                        checked: todos.every(t => t.completed)
                    }),
                    Dom.h('label', { for: 'toggle-all' })
                ])
            );
        }

        // Empty message or todo items
        if (filteredTodos.length === 0 && todos.length > 0) {
            const message = currentFilter === 'active'
                ? 'No active tasks found!'
                : currentFilter === 'completed'
                    ? 'No completed tasks yet!'
                    : '';

            if (message) {
                children.push(
                    Dom.h('div', {
                        className: 'empty-message',
                        key: 'empty-message'
                    }, [message])
                );
            }
        } else {
            // Add filtered todos
            filteredTodos.forEach(todo => {
                children.push(this.createTodoVNode(todo));
            });
        }

        // Footer
        if (todos.length > 0) {
            const activeTodoCount = todos.filter(t => !t.completed).length;
            const hasCompletedTodos = todos.some(t => t.completed);

            children.push(
                Dom.h('footer', {
                    className: 'footer',
                    key: 'footer'
                }, [
                    Dom.h('span', { className: 'todo-count' }, [
                        Dom.h('strong', {}, [activeTodoCount.toString()]),
                        ` item${activeTodoCount === 1 ? '' : 's'} left`
                    ]),
                    Dom.h('ul', {
                        className: 'filters',
                        'data-testid': 'footer-navigation'
                    }, [
                        Dom.h('li', {}, [
                            Dom.h('a', {
                                className: currentFilter === 'all' ? 'selected' : '',
                                href: '#/'
                            }, ['All'])
                        ]),
                        Dom.h('li', {}, [
                            Dom.h('a', {
                                className: currentFilter === 'active' ? 'selected' : '',
                                href: '#/active'
                            }, ['Active'])
                        ]),
                        Dom.h('li', {}, [
                            Dom.h('a', {
                                className: currentFilter === 'completed' ? 'selected' : '',
                                href: '#/completed'
                            }, ['Completed'])
                        ])
                    ]),
                    Dom.h('button', {
                        className: `clear-completed ${hasCompletedTodos ? '' : 'hidden'}`,
                        key: 'clear-completed'
                    }, ['Clear completed'])
                ])
            );
        }

        return Dom.h('div', { className: 'todo-container' }, children);
    }

    // Main render method using efficient diffing
    render() {
        console.group('[TodoRenderer] Rendering');
        const newVTree = this.createTodoListVNode();
        console.log('New VTree:', JSON.stringify(newVTree, null, 2));
        Dom.renderWithDiff(this.container, newVTree, this.prevVTree);
        this.prevVTree = newVTree;
        console.groupEnd();
    }
}
