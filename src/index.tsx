import type {Component} from './lib/cirkit-types';

import {addSlot, connectList} from './lib/cirkit-utils.js';
import {wire, emit} from './lib/cirkit-junction.js';

import {AppData} from './model.js';
import {App} from './components/App.js';


// Add a slot to the main container that will add a to-do item to the list from the input
addSlot(App.main, 'addTodoItem',
  function(this: Component)
  {
    // Get the input element value and add to the list if not empty
    const elemInput = this.todoAdd.todoInput.ref;
    if(elemInput.value)
    {
      AppData.todos.add({text: elemInput.value, color: 'black'});
      this.todoAdd.todoInput.ref.value = '';
      console.log(this)
    }
  }
);

// Item selector slot for the todo list
addSlot(App.main.todoList, 'selectTodoItem',
  function(this: Component)
  {

  }
);

// Wire up the main.submit signal to add an item
wire('App.main.submit', App.main.addTodoItem);

// Wire up the button click to add an item
wire('main.todoAdd.buttonAdd.click', App.main.addTodoItem);

// Wire up the input to add an item on enter key
wire('main.todoAdd.todoInput.keypress', (_, evt: any) => evt.key === 'Enter' && emit('App.main.submit'));

// Item click to select
wire('main.todoList.click', App.main.todoList.selectTodoItem);

// Hook up the list components to the app data
connectList(App.main.todoList, AppData.todos);
connectList(App.main.colors, AppData.colors);

// Add some initial data
AppData.colors.add({color: 'red'});
AppData.colors.add({color: 'blue'});
AppData.colors.add({color: 'green'});

console.log('App', App);
