import type {Component} from './lib/cirkit-types';

import {addSlot, connectList} from './lib/cirkit-utils.js';
import {wire, emit} from './lib/cirkit-junction.js';

import {app} from './components/App.js';


// Add a slot to the app container that will add a to-do item to the list from the input
addSlot(
  app,
  'addTodoItem',
  function(this: Component)
  {
    // Get the input element value and add to the list if not empty
    const elemInput = this.todoAdd.todoInput.ref;
    if(elemInput.value)
    {
      app.data.todos.add({text: elemInput.value, color: 'black'});
      this.todoAdd.todoInput.ref.value = '';
      console.log(this)
    }
  }
);

// Item selector slot for the todo list
addSlot(app.todoList, 'selectTodoItem',
  function(this: Component)
  {

  }
);

// Wire up the main.submit signal to add an item
wire('app.submitTodo', app.slots.addTodoItem);

// Wire up the button click to add an item
wire('app.todoAdd.buttonAdd.click', app.slots.addTodoItem);

// Wire up the input to add an item on enter key
wire('app.todoAdd.todoInput.keypress', (_, evt: any) => evt.key === 'Enter' && emit('app.submitTodo'));

// Item click to select
wire('app.todoList.click', app.todoList.slots.selectTodoItem);

// Hook up the list components to the app data
connectList(app.todoList, app.data.todos);
connectList(app.colors, app.data.colors);

// Add some initial data
app.data.colors.add({color: 'darkred'});
app.data.colors.add({color: 'darkblue'});

//AppData.colors.add({color: 'blue'});
//AppData.colors.add({color: 'green'});

console.log('App', app);
