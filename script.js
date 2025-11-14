// عناصر الواجهة
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const countEl = document.getElementById('count');
const filterBtns = document.querySelectorAll('.filters button');
const clearCompletedBtn = document.getElementById('clearCompleted');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');

let todos = []; // مصفوفة العناصر: {id, text, done, createdAt}
let currentFilter = 'all';

// توليد ID بسيط
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

// تحميل من localStorage
function load() {
  try {
    const raw = localStorage.getItem('todo_app_v1');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) todos = parsed;
  } catch(e) {
    console.error('فشل تحميل البيانات:', e);
  }
}

// حفظ إلى localStorage
function save() {
  try {
    localStorage.setItem('todo_app_v1', JSON.stringify(todos));
    render();
  } catch(e) {
    console.error('فشل الحفظ:', e);
  }
}

// إنشاء عنصر DOM للمهمة
function createTodoElement(todo) {
  const li = document.createElement('li');
  li.className = 'todo-item';
  li.dataset.id = todo.id;

  const left = document.createElement('div');
  left.className = 'left';

  const checkbox = document.createElement('div');
  checkbox.className = 'checkbox' + (todo.done ? ' checked' : '');
  checkbox.title = todo.done ? 'وضع غير منجز' : 'وضع منجز';
  checkbox.innerHTML = todo.done ? '✓' : '';

  const text = document.createElement('div');
  text.className = 'task-text' + (todo.done ? ' completed' : '');
  text.textContent = todo.text;

  left.appendChild(checkbox);
  left.appendChild(text);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'action-btn edit';
  editBtn.textContent = 'تعديل';

  const delBtn = document.createElement('button');
  delBtn.className = 'action-btn delete';
  delBtn.textContent = 'حذف';

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  li.appendChild(left);
  li.appendChild(actions);

  // حدث تبديل منجز / غير منجز
  checkbox.addEventListener('click', () => {
    todo.done = !todo.done;
    save();
  });

  // حذف
  delBtn.addEventListener('click', () => {
    todos = todos.filter(t => t.id !== todo.id);
    save();
  });

  // تعديل (تحويل النص لحقل إدخال)
  editBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = todo.text;
    input.className = 'edit-input';
    text.replaceWith(input);
    input.focus();

    function finishEdit() {
      const val = input.value.trim();
      if (val) {
        todo.text = val;
      } else {
        // إذا ترك فارغاً نحذف المهمة
        todos = todos.filter(t => t.id !== todo.id);
      }
      save();
    }

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') {
        // إلغاء التعديل
        input.value = todo.text;
        input.blur();
      }
    });
  });

  return li;
}

// رندر القائمة حسب الفلتر
function render() {
  todoList.innerHTML = '';
  const filtered = todos.filter(t => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'active') return !t.done;
    if (currentFilter === 'completed') return t.done;
  });

  filtered.forEach(t => {
    todoList.appendChild(createTodoElement(t));
  });

  const remaining = todos.filter(t => !t.done).length;
  const total = todos.length;
  countEl.textContent = `${remaining} غير منجز من أصل ${total}`;

  // إبراز زر الفلتر النشط
  filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === currentFilter));
}

// إضافة مهمة جديدة
function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.unshift({ id: uid(), text: trimmed, done: false, createdAt: new Date().toISOString() });
  save();
  taskInput.value = '';
  taskInput.focus();
}

// أحداث الواجهة
addBtn.addEventListener('click', () => addTask(taskInput.value));
taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(taskInput.value); });

// فلترة
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    render();
  });
});

// مسح المنجزة
clearCompletedBtn.addEventListener('click', () => {
  todos = todos.filter(t => !t.done);
  save();
});

// تصدير JSON
exportBtn.addEventListener('click', () => {
  const data = JSON.stringify(todos, null, 2);
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'todos.json';
  a.click();
  URL.revokeObjectURL(url);
});

// استيراد JSON
importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error('الملف ليس مصفوفة');
      // دمج ذكي: احتفظ بالـ id إن وجد وإلا أنشئ id جديد
      const merged = parsed.map(p => ({
        id: p.id || uid(),
        text: p.text || '',
        done: !!p.done,
        createdAt: p.createdAt || new Date().toISOString()
      })).filter(p => p.text.trim() !== '');
      // استبدال (يمكن التعديل لتجميع بدلاً من الاستبدال)
      todos = merged;
      save();
      importFile.value = '';
    } catch(err) {
      alert('فشل استيراد الملف: تأكد أنه JSON صالح يصف قائمة مهام.');
    }
  };
  reader.readAsText(file);
});

// التحميل لأول مرة
load();
render();
