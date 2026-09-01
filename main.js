import './style.css'

const STORAGE_KEY = 'todo-app-items'

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

let items = loadItems()
let filter = 'all'
let editingId = null

const form = document.getElementById('todo-form')
const input = document.getElementById('todo-input')
const prioritySelect = document.getElementById('todo-priority')
const list = document.getElementById('todo-list')
const counts = document.getElementById('todo-counts')
const filters = document.getElementById('todo-filters')

const PRIORITY_LABELS = { high: '高', medium: '中', low: '低' }

function render() {
  const visible = items.filter((it) =>
    filter === 'active' ? !it.done : filter === 'completed' ? it.done : true
  )

  list.innerHTML = visible
    .map((it) => {
      if (editingId === it.id) {
        return `
        <li class="todo-item editing" data-id="${it.id}">
          <select class="edit-priority" data-field="priority">
            <option value="low" ${it.priority === 'low' ? 'selected' : ''}>🟢 低</option>
            <option value="medium" ${it.priority === 'medium' ? 'selected' : ''}>🟡 中</option>
            <option value="high" ${it.priority === 'high' ? 'selected' : ''}>🔴 高</option>
          </select>
          <input class="edit-input" type="text" value="${escapeHtml(it.text)}" data-field="text" />
          <button class="todo-save" data-action="save" aria-label="保存">✓</button>
          <button class="todo-cancel" data-action="cancel-edit" aria-label="取消">✕</button>
        </li>`
      }
      return `
      <li class="todo-item ${it.done ? 'done' : ''} priority-${it.priority || 'medium'}" data-id="${it.id}">
        <span class="priority-dot priority-${it.priority || 'medium'}"></span>
        <label class="todo-check">
          <input type="checkbox" ${it.done ? 'checked' : ''} />
          <span class="checkmark"></span>
        </label>
        <span class="todo-text">${escapeHtml(it.text)}</span>
        <span class="priority-tag priority-${it.priority || 'medium'}">${PRIORITY_LABELS[it.priority || 'medium']}</span>
        <button class="todo-edit" data-action="edit" aria-label="编辑">✎</button>
        <button class="todo-delete" data-action="delete" aria-label="删除任务">✕</button>
      </li>`
    })
    .join('')

  const active = items.filter((i) => !i.done).length
  const done = items.filter((i) => i.done).length
  counts.innerHTML = `
    <span class="count-pill active">未完成 <b>${active}</b></span>
    <span class="count-pill completed">已完成 <b>${done}</b></span>`

  document.querySelectorAll('.todo-filter').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === filter)
  })

  const emptyState = document.getElementById('empty-state')
  if (items.length === 0) {
    emptyState.querySelector('p').textContent = '太棒了，没有待办任务！'
    emptyState.querySelector('.empty-sub').textContent = '在上方添加一个新任务开始吧'
    emptyState.style.display = 'flex'
  } else if (visible.length === 0) {
    emptyState.querySelector('p').textContent = filter === 'active' ? '所有任务都完成啦！' : '还没有已完成的任务'
    emptyState.querySelector('.empty-sub').textContent = ''
    emptyState.style.display = 'flex'
  } else {
    emptyState.style.display = 'none'
  }

  if (editingId !== null) {
    const editInput = list.querySelector('.edit-input')
    if (editInput) {
      editInput.focus()
      editInput.select()
    }
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  const text = input.value.trim()
  if (!text) return
  items.unshift({ id: Date.now(), text, done: false, priority: prioritySelect.value })
  saveItems(items)
  input.value = ''
  prioritySelect.value = 'medium'
  render()
})

list.addEventListener('click', (e) => {
  const li = e.target.closest('.todo-item')
  if (!li) return
  const id = Number(li.dataset.id)
  const item = items.find((i) => i.id === id)
  if (!item) return

  if (e.target.matches('input[type=checkbox]')) {
    item.done = e.target.checked
    saveItems(items)
    render()
  } else if (e.target.closest('[data-action="delete"]')) {
    items = items.filter((i) => i.id !== id)
    saveItems(items)
    render()
  } else if (e.target.closest('[data-action="edit"]')) {
    editingId = id
    render()
  } else if (e.target.closest('[data-action="save"]')) {
    const editInput = li.querySelector('.edit-input')
    const editPriority = li.querySelector('.edit-priority')
    const newText = editInput.value.trim()
    if (newText) {
      item.text = newText
      item.priority = editPriority.value
      saveItems(items)
    }
    editingId = null
    render()
  } else if (e.target.closest('[data-action="cancel-edit"]')) {
    editingId = null
    render()
  }
})

list.addEventListener('keydown', (e) => {
  if (e.target.matches('.edit-input') && e.key === 'Enter') {
    e.preventDefault()
    const li = e.target.closest('.todo-item')
    if (!li) return
    const id = Number(li.dataset.id)
    const item = items.find((i) => i.id === id)
    if (!item) return
    const newText = e.target.value.trim()
    const editPriority = li.querySelector('.edit-priority')
    if (newText) {
      item.text = newText
      item.priority = editPriority.value
      saveItems(items)
    }
    editingId = null
    render()
  } else if (e.target.matches('.edit-input') && e.key === 'Escape') {
    editingId = null
    render()
  }
})

filters.addEventListener('click', (e) => {
  const btn = e.target.closest('.todo-filter')
  if (!btn) return
  filter = btn.dataset.filter
  render()
})

document.getElementById('clear-completed').addEventListener('click', () => {
  items = items.filter((i) => !i.done)
  saveItems(items)
  render()
})

const confirmModal = document.getElementById('confirm-modal')
const confirmMessage = document.getElementById('confirm-message')
const confirmOk = document.getElementById('confirm-ok')
const confirmCancel = document.getElementById('confirm-cancel')

function showConfirm(message, onConfirm) {
  confirmMessage.textContent = message
  confirmModal.style.display = 'flex'
  confirmOk.onclick = () => {
    confirmModal.style.display = 'none'
    onConfirm()
  }
  confirmCancel.onclick = () => {
    confirmModal.style.display = 'none'
  }
}

document.getElementById('clear-all').addEventListener('click', () => {
  if (items.length === 0) return
  showConfirm('确定要清空所有任务吗？此操作不可撤销。', () => {
    items = []
    saveItems(items)
    render()
  })
})

confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    confirmModal.style.display = 'none'
  }
})

render()
