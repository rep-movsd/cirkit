import {List} from './lib/cirkit-utils.js';

// Todo and color item types
export type TodoItem = { text: string, color: string };
export type TodoColorItem = {color: string, select?: boolean};

// Data model for the app
export const data =
{
  // The List class emits signals when items are added, set, or deleted
  todos: new List<TodoItem>('todos'),
  colors: new List<TodoColorItem>('colors'),
}
