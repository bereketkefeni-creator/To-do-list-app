 

const form = document.getElementById('taskForm');
const input = document.getElementById('taskInput');
const list = document.getElementById('taskList');
const stats = document.getElementById('stats');
const filters = document.querySelectorAll('.filter');
const clearCompletedBtn = document.getElementById('clearCompleted');

let tasks = [];           // in-memory tasks
let filterMode = 'all';   // all | active | completed

// load from localStorage
function load() {
  try {
    const raw = localStorage.getItem('bereket_tasks_v1');
    tasks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load tasks', e);
    tasks = [];
  }
  render();
}

// save to localStorage
function save() {
  localStorage.setItem('bereket_tasks_v1', JSON.stringify(tasks));
}

// create id
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

// add task
form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const t = { id: uid(), text, completed: false, createdAt: Date.now() };
  tasks.unshift(t);
  input.value = '';
  save();
  render();
});

// render UI
function render() {
  // filter
  const visible = tasks.filter(t => {
    if (filterMode === 'all') return true;
    if (filterMode === 'active') return !t.completed;
    if (filterMode === 'completed') return t.completed;
  });

  list.innerHTML = '';
  if (visible.length === 0) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = <div class="task-text muted">No tasks yet</div>;
    list.appendChild(li);
  } else {
    visible.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.dataset.id = task.id;

      // checkbox (custom)
      const cb = document.createElement('button');
      cb.className = 'task-checkbox' + (task.completed ? ' checked' : '');
      cb.title = task.completed ? 'Mark active' : 'Mark completed';
      cb.addEventListener('click', () => toggleComplete(task.id));

      // text or input (for editing)
      const textEl = document.createElement('div');
      textEl.className = 'task-text' + (task.completed ? ' completed' : '');
      textEl.textContent = task.text;

      // double click to edit
      textEl.addEventListener('dblclick', () => startEdit(task.id, textEl));

      // actions
      const actions = document.createElement('div');
      actions.className = 'task-actions';

      // edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn';
      editBtn.innerHTML = '✏️';
      editBtn.title = 'Edit';
      editBtn.addEventListener('click', () => startEdit(task.id, textEl));

      // delete button
      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn';
      delBtn.innerHTML = '🗑️';
      delBtn.title = 'Delete';
      delBtn.addEventListener('click', () => deleteTask(task.id));

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(cb);
      li.appendChild(textEl);
      li.appendChild(actions);

      list.appendChild(li);
    });
  }

  updateStats();
}

// toggle complete state
function toggleComplete(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.completed = !t.completed;
  save();
  render();
}

// delete
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

// start inline edit
function startEdit(id, textEl) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = t.text;
  input.className = 'task-edit';
  input.maxLength = 200;

  // replace element
  textEl.replaceWith(input);
  input.focus();
  // select text
  input.setSelectionRange(0, input.value.length);

  const finish = (saveEdit) => {
    if (saveEdit) {
      const newText = input.value.trim();