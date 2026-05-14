/* ============================================
   SMART TASK MANAGEMENT SYSTEM - ENHANCED
   Production-Level JavaScript with Real Functionality
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  VALID_CREDENTIALS: {
    email: 'admin@gmail.com',
    password: 'admin123'
  },
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  NOTIFICATION_DURATION: 5000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const DOM = {
  query: (selector) => document.querySelector(selector),
  queryAll: (selector) => document.querySelectorAll(selector),
  
  create: (tag, className = '', innerHTML = '') => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
  },
  
  on: (selector, event, handler) => {
    const elements = typeof selector === 'string' ? DOM.queryAll(selector) : [selector];
    elements.forEach(el => el.addEventListener(event, handler));
  },
  
  off: (selector, event, handler) => {
    const elements = typeof selector === 'string' ? DOM.queryAll(selector) : [selector];
    elements.forEach(el => el.removeEventListener(event, handler));
  },
  
  toggleClass: (selector, className) => {
    const elements = typeof selector === 'string' ? DOM.queryAll(selector) : [selector];
    elements.forEach(el => el.classList.toggle(className));
  },
  
  addClass: (selector, className) => {
    const elements = typeof selector === 'string' ? DOM.queryAll(selector) : [selector];
    elements.forEach(el => el.classList.add(className));
  },
  
  removeClass: (selector, className) => {
    const elements = typeof selector === 'string' ? DOM.queryAll(selector) : [selector];
    elements.forEach(el => el.classList.remove(className));
  },

  hasClass: (element, className) => {
    return element.classList.contains(className);
  },

  remove: (selector) => {
    const elements = typeof selector === 'string' ? DOM.queryAll(selector) : [selector];
    elements.forEach(el => el.remove());
  },
};

// Debounce utility
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// ============================================
// AUTHENTICATION SYSTEM
// ============================================

class AuthenticationManager {
  constructor() {
    this.key = 'taskapp-user';
    this.tokenKey = 'taskapp-token';
    this.init();
  }

  init() {
    const loginForm = DOM.query('form[data-form="login"]');
    if (loginForm) {
      DOM.on(loginForm, 'submit', (e) => this.handleLogin(e));
    }

    // Check if already logged in
    this.checkExistingSession();
  }

  handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;
    const rememberMe = form.querySelector('input[type="checkbox"]')?.checked || false;

    // Clear previous errors
    DOM.removeClass('.form-error', 'visible');

    // Validate email format
    if (!this.validateEmail(email)) {
      this.showError('Please enter a valid email address');
      return;
    }

    // Validate password
    if (password.length === 0) {
      this.showError('Please enter your password');
      return;
    }

    // Validate credentials
    if (email === CONFIG.VALID_CREDENTIALS.email && password === CONFIG.VALID_CREDENTIALS.password) {
      this.login(email, rememberMe);
    } else {
      this.showError('Invalid email or password. Try admin@gmail.com / admin123');
      // Add shake animation
      form.classList.add('shake-animation');
      setTimeout(() => form.classList.remove('shake-animation'), 500);
    }
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showError(message) {
    const errorElement = DOM.query('.form-error') || DOM.create('div', 'form-error visible');
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorElement.classList.add('visible', 'shake-animation');
    
    if (!DOM.query('.form-error')) {
      const form = DOM.query('form');
      if (form) form.parentElement.insertBefore(errorElement, form);
    }

    // Remove animation class after animation
    setTimeout(() => errorElement.classList.remove('shake-animation'), 500);
  }

  login(email, rememberMe) {
    // Create user session
    const userData = {
      email,
      name: 'John Doe',
      role: 'Project Manager',
      avatar: 'JD',
      loginTime: new Date().toISOString(),
    };

    const token = this.generateToken();
    
    localStorage.setItem(this.key, JSON.stringify(userData));
    localStorage.setItem(this.tokenKey, token);
    
    if (rememberMe) {
      localStorage.setItem('taskapp-remember', 'true');
    }

    // Show success message
    NotificationCenter.showNotification('Welcome!', `Logged in as ${email}`, 'success');

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 500);
  }

  logout() {
    localStorage.removeItem(this.key);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('taskapp-remember');
    window.location.href = 'index.html';
  }

  isLoggedIn() {
    return !!localStorage.getItem(this.tokenKey);
  }

  getCurrentUser() {
    const userData = localStorage.getItem(this.key);
    return userData ? JSON.parse(userData) : null;
  }

  generateToken() {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  checkExistingSession() {
    const currentPage = window.location.pathname;
    const isAuthPage = currentPage.includes('index.html') || currentPage.endsWith('/') || currentPage === '/';
    const isLoggedIn = this.isLoggedIn();

    if (!isLoggedIn && !isAuthPage) {
      window.location.href = 'index.html';
    } else if (isLoggedIn && isAuthPage) {
      // Redirect to dashboard if already logged in
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    }
  }
}

// ============================================
// TASK MANAGEMENT SYSTEM
// ============================================

class TaskManager {
  constructor() {
    this.storageKey = 'taskapp-tasks';
    this.tasks = this.loadTasks();
    this.init();
  }

  init() {
    this.setupTaskBoard();
    this.setupTaskControls();
    this.attachKanbanListeners();
  }

  // ===== TASK CRUD OPERATIONS =====

  createTask(taskData) {
    const task = {
      id: this.generateId(),
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || '',
      status: taskData.status || 'todo', // todo, in-progress, completed
      assignee: taskData.assignee || 'John Doe',
      labels: taskData.labels || [],
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    this.tasks.push(task);
    this.saveTasks();
    return task;
  }

  updateTask(id, updates) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates);
      if (updates.status === 'completed' && !task.completedAt) {
        task.completedAt = new Date().toISOString();
      }
      this.saveTasks();
      return task;
    }
    return null;
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
  }

  getTask(id) {
    return this.tasks.find(t => t.id === id);
  }

  getTasksByStatus(status) {
    return this.tasks.filter(t => t.status === status);
  }

  // ===== TASK BOARD SETUP =====

  setupTaskBoard() {
    this.renderKanbanBoard();
  }

  renderKanbanBoard() {
    const kanbanContainer = DOM.query('.kanban-container');
    if (!kanbanContainer) return;

    // Get or create task columns
    const columns = {
      'todo': this.getTasksByStatus('todo'),
      'in-progress': this.getTasksByStatus('in-progress'),
      'completed': this.getTasksByStatus('completed'),
    };

    // Update each column with task count
    Object.keys(columns).forEach(status => {
      const list = DOM.query(`.kanban-list[data-status="${status}"]`);
      if (list) {
        const count = columns[status].length;
        const countBadge = list.parentElement.querySelector('.kanban-count');
        if (countBadge) {
          countBadge.textContent = count;
        }
      }
    });

    this.attachTaskCardListeners();
  }

  renderTaskCard(task) {
    const priorityClass = `priority-${task.priority}`;
    const priorityIcon = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    }[task.priority] || '🟡';

    const statusBadge = {
      'todo': '📋',
      'in-progress': '⏳',
      'completed': '✅'
    }[task.status] || '📋';

    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date';
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

    const card = DOM.create('div', `task-card ${priorityClass}`, `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
        <div style="flex: 1;">
          <div class="task-title" style="font-weight: 600; color: var(--text-dark); margin-bottom: 0.25rem;">
            ${task.title}
          </div>
          <div class="task-description" style="font-size: 0.85rem; color: var(--text-gray); line-height: 1.4;">
            ${task.description}
          </div>
        </div>
        <button class="task-menu" style="background: none; border: none; color: var(--text-gray); cursor: pointer; font-size: 1.2rem;">
          ⋮
        </button>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
        ${task.labels.map(label => `
          <span style="background: rgba(102, 126, 234, 0.1); color: var(--info); padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">
            ${label}
          </span>
        `).join('')}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-gray);">
          <i class="fas fa-calendar"></i>
          <span class="task-due-date" style="color: ${isOverdue ? 'var(--danger)' : 'var(--text-gray)'}">${dueDate}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; color: ${isOverdue ? 'var(--danger)' : 'var(--text-gray)'} ">
          <span>${statusBadge}</span>
          <span>${priorityIcon}</span>
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(0,0,0,0.05);">
        <button class="task-edit-btn" data-task-id="${task.id}" style="flex: 1; padding: 0.4rem; background: transparent; border: 1px solid var(--info); color: var(--info); border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem; font-weight: 600;">
          Edit
        </button>
        <button class="task-complete-btn" data-task-id="${task.id}" style="flex: 1; padding: 0.4rem; background: transparent; border: 1px solid var(--success); color: var(--success); border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem; font-weight: 600;">
          ${task.status === 'completed' ? 'Undo' : 'Done'}
        </button>
        <button class="task-delete-btn" data-task-id="${task.id}" style="flex: 1; padding: 0.4rem; background: transparent; border: 1px solid var(--danger); color: var(--danger); border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem; font-weight: 600;">
          Delete
        </button>
      </div>
    `);

    card.draggable = true;
    card.dataset.taskId = task.id;
    return card;
  }

  setupTaskControls() {
    const addTaskBtn = DOM.query('[data-action="add-task"]');
    if (addTaskBtn) {
      DOM.on(addTaskBtn, 'click', () => this.openAddTaskModal());
    }

    // Setup add task form
    const addTaskForm = DOM.query('form[data-form="add-task"]');
    if (addTaskForm) {
      DOM.on(addTaskForm, 'submit', (e) => this.handleAddTask(e));
    }
  }

  openAddTaskModal() {
    const modal = DOM.query('#addTaskModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  handleAddTask(e) {
    e.preventDefault();
    const form = e.target;
    const title = form.querySelector('[name="taskTitle"]')?.value.trim();
    const description = form.querySelector('[name="taskDescription"]')?.value.trim();
    const priority = form.querySelector('[name="taskPriority"]')?.value || 'medium';
    const dueDate = form.querySelector('[name="taskDueDate"]')?.value;
    const assignee = form.querySelector('[name="taskAssignee"]')?.value || 'John Doe';

    if (!title) {
      NotificationCenter.showNotification('Error', 'Task title is required', 'error');
      return;
    }

    const task = this.createTask({
      title,
      description,
      priority,
      dueDate,
      assignee,
      status: 'todo'
    });

    // Add card to board
    const todoList = DOM.query('.kanban-list[data-status="todo"]');
    if (todoList) {
      const card = this.renderTaskCard(task);
      todoList.appendChild(card);
      this.attachTaskCardListeners();
    }

    NotificationCenter.showNotification('Success', 'Task created successfully', 'success');
    form.reset();
    
    const modal = form.closest('.modal-overlay');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';

    // Update dashboard stats
    if (window.DashboardStats) {
      window.DashboardStats.updateStatistics();
    }
  }

  attachTaskCardListeners() {
    DOM.queryAll('.task-complete-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        const task = this.getTask(taskId);
        if (task) {
          const newStatus = task.status === 'completed' ? 'in-progress' : 'completed';
          this.updateTask(taskId, { status: newStatus });
          this.moveTaskCard(taskId, newStatus);
          NotificationCenter.showNotification('Success', `Task marked as ${newStatus}`, 'success');
          if (window.DashboardStats) {
            window.DashboardStats.updateStatistics();
          }
        }
      };
    });

    DOM.queryAll('.task-delete-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        if (confirm('Are you sure you want to delete this task?')) {
          this.deleteTask(taskId);
          const card = DOM.query(`[data-task-id="${taskId}"]`);
          if (card) {
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 300);
          }
          NotificationCenter.showNotification('Success', 'Task deleted', 'success');
          if (window.DashboardStats) {
            window.DashboardStats.updateStatistics();
          }
        }
      };
    });

    DOM.queryAll('.task-edit-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        this.openEditTaskModal(taskId);
      };
    });
  }

  moveTaskCard(taskId, newStatus) {
    const card = DOM.query(`[data-task-id="${taskId}"]`);
    const newList = DOM.query(`.kanban-list[data-status="${newStatus}"]`);
    
    if (card && newList) {
      card.style.opacity = '0';
      setTimeout(() => {
        newList.appendChild(card);
        card.style.opacity = '1';
        this.attachTaskCardListeners();
        this.updateKanbanCounts();
      }, 300);
    }
  }

  updateKanbanCounts() {
    const statuses = ['todo', 'in-progress', 'completed'];
    statuses.forEach(status => {
      const list = DOM.query(`.kanban-list[data-status="${status}"]`);
      if (list) {
        const count = list.querySelectorAll('.task-card').length;
        const countBadge = list.parentElement.querySelector('.kanban-count');
        if (countBadge) {
          countBadge.textContent = count;
        }
      }
    });
  }

  openEditTaskModal(taskId) {
    const task = this.getTask(taskId);
    if (!task) return;

    // Create edit modal
    const modal = DOM.create('div', 'modal-overlay active', `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Task</h2>
          <button class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form data-form="edit-task">
          <div class="form-group">
            <label class="form-label">Task Title</label>
            <input type="text" name="editTaskTitle" class="form-input" value="${task.title}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea name="editTaskDesc" class="form-textarea">${task.description}</textarea>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select name="editTaskPriority" class="form-select">
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input type="date" name="editTaskDate" class="form-input" value="${task.dueDate || ''}">
            </div>
          </div>
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" style="flex: 1;">Update Task</button>
            <button type="button" class="btn btn-ghost" style="flex: 1;">Cancel</button>
          </div>
        </form>
      </div>
    `);

    document.body.appendChild(modal);

    // Setup handlers
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('[type="button"]');
    const form = modal.querySelector('form');

    closeBtn.onclick = () => modal.remove();
    cancelBtn.onclick = () => modal.remove();

    form.onsubmit = (e) => {
      e.preventDefault();
      const newTitle = form.querySelector('[name="editTaskTitle"]').value;
      const newDesc = form.querySelector('[name="editTaskDesc"]').value;
      const newPriority = form.querySelector('[name="editTaskPriority"]').value;
      const newDate = form.querySelector('[name="editTaskDate"]').value;

      this.updateTask(taskId, {
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        dueDate: newDate
      });

      // Re-render card
      const oldCard = DOM.query(`[data-task-id="${taskId}"]`);
      if (oldCard) {
        const updatedTask = this.getTask(taskId);
        const newCard = this.renderTaskCard(updatedTask);
        oldCard.replaceWith(newCard);
        this.attachTaskCardListeners();
      }

      NotificationCenter.showNotification('Success', 'Task updated successfully', 'success');
      modal.remove();
      if (window.DashboardStats) {
        window.DashboardStats.updateStatistics();
      }
    };
  }

  attachKanbanListeners() {
    const taskCards = DOM.queryAll('.task-card');
    taskCards.forEach(card => {
      card.draggable = true;
      
      card.ondragstart = (e) => {
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
      };

      card.ondragend = () => {
        card.classList.remove('dragging');
        DOM.removeClass('.kanban-list', 'drag-over');
      };
    });

    const lists = DOM.queryAll('.kanban-list');
    lists.forEach(list => {
      list.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        list.classList.add('drag-over');
      };

      list.ondragleave = () => {
        list.classList.remove('drag-over');
      };

      list.ondrop = (e) => {
        e.preventDefault();
        const draggingCard = DOM.query('.task-card.dragging');
        if (draggingCard && list) {
          const status = list.dataset.status;
          const taskId = draggingCard.dataset.taskId;
          
          this.updateTask(taskId, { status });
          list.appendChild(draggingCard);
          this.updateKanbanCounts();
          
          if (window.DashboardStats) {
            window.DashboardStats.updateStatistics();
          }
        }
        list.classList.remove('drag-over');
      };
    });
  }

  // ===== PERSISTENCE =====

  saveTasks() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
  }

  loadTasks() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : this.getDefaultTasks();
  }

  getDefaultTasks() {
    return [
      {
        id: this.generateId(),
        title: 'Design login page',
        description: 'Create responsive login UI with validation',
        priority: 'high',
        status: 'completed',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee: 'John Doe',
        labels: ['Design', 'Frontend'],
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      {
        id: this.generateId(),
        title: 'Setup database',
        description: 'Configure MongoDB and setup collections',
        priority: 'high',
        status: 'in-progress',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee: 'John Doe',
        labels: ['Backend', 'Database'],
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      {
        id: this.generateId(),
        title: 'Implement authentication',
        description: 'Add JWT token-based auth',
        priority: 'high',
        status: 'in-progress',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee: 'John Doe',
        labels: ['Backend', 'Security'],
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      {
        id: this.generateId(),
        title: 'Create dashboard widget',
        description: 'Build reusable dashboard components',
        priority: 'medium',
        status: 'todo',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee: 'John Doe',
        labels: ['Frontend', 'React'],
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      {
        id: this.generateId(),
        title: 'Write API documentation',
        description: 'Document all endpoints and response formats',
        priority: 'medium',
        status: 'todo',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee: 'John Doe',
        labels: ['Documentation'],
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
    ];
  }

  generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// ============================================
// DASHBOARD STATISTICS
// ============================================

class DashboardStats {
  constructor() {
    this.init();
  }

  init() {
    this.updateStatistics();
  }

  updateStatistics() {
    if (!window.TaskManager) return;

    const tasks = window.TaskManager.tasks;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const total = tasks.length;
    const overdue = tasks.filter(t => {
      return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed';
    }).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update stat cards
    const stats = {
      'total-tasks': total,
      'completed-tasks': completed,
      'pending-tasks': pending,
      'overdue-tasks': overdue,
      'completion-rate': completionRate + '%',
    };

    Object.keys(stats).forEach(key => {
      const element = DOM.query(`[data-stat="${key}"]`);
      if (element) {
        const value = stats[key];
        if (element.dataset.counter) {
          this.animateCounter(element, parseInt(value));
        } else {
          element.textContent = value;
        }
      }
    });

    // Update progress bar
    const progressBar = DOM.query('[data-progress="completion"]');
    if (progressBar) {
      progressBar.style.width = completionRate + '%';
    }

    // Show notifications for overdue tasks
    if (overdue > 0 && !sessionStorage.getItem('overdue-notified')) {
      NotificationCenter.showNotification(
        'Attention',
        `You have ${overdue} overdue task${overdue > 1 ? 's' : ''}!`,
        'warning'
      );
      sessionStorage.setItem('overdue-notified', 'true');
    }
  }

  animateCounter(element, target) {
    const duration = 1500;
    const increment = target / (duration / 16);
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target;
        clearInterval(interval);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }
}

// ============================================
// SEARCH AND FILTER SYSTEM
// ============================================

class SearchFilterManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupSearch();
    this.setupFilters();
  }

  setupSearch() {
    const searchInput = DOM.query('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => this.handleSearch(e.target.value), CONFIG.DEBOUNCE_DELAY));
    }
  }

  handleSearch(query) {
    const tasks = DOM.queryAll('.task-card');
    const lowerQuery = query.toLowerCase();

    tasks.forEach(task => {
      const title = task.querySelector('.task-title')?.textContent.toLowerCase() || '';
      const desc = task.querySelector('.task-description')?.textContent.toLowerCase() || '';
      
      const matches = title.includes(lowerQuery) || desc.includes(lowerQuery);
      task.style.display = matches ? '' : 'none';
      task.style.opacity = matches ? '1' : '0.3';
    });
  }

  setupFilters() {
    const priorityFilter = DOM.query('[data-filter="priority"]');
    const statusFilter = DOM.query('[data-filter="status"]');
    const dateFilter = DOM.query('[data-filter="date"]');

    if (priorityFilter) {
      priorityFilter.addEventListener('change', () => this.applyFilters());
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.applyFilters());
    }
    if (dateFilter) {
      dateFilter.addEventListener('change', () => this.applyFilters());
    }
  }

  applyFilters() {
    const priorityFilter = DOM.query('[data-filter="priority"]')?.value;
    const statusFilter = DOM.query('[data-filter="status"]')?.value;

    const tasks = DOM.queryAll('.task-card');
    tasks.forEach(task => {
      let show = true;

      if (priorityFilter && priorityFilter !== 'all') {
        show = show && task.classList.contains(`priority-${priorityFilter}`);
      }

      if (statusFilter && statusFilter !== 'all') {
        show = show && task.closest('.kanban-list')?.dataset.status === statusFilter;
      }

      task.style.display = show ? '' : 'none';
    });
  }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

class NotificationCenter {
  static showNotification(title, message, type = 'info', duration = CONFIG.NOTIFICATION_DURATION) {
    const notification = DOM.create('div', `notification notification-${type} animate-slide-in`, `
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
        <div style="flex: 1;">
          <div style="font-weight: 700; margin-bottom: 0.25rem;">${title}</div>
          <div style="font-size: 0.9rem; opacity: 0.9;">${message}</div>
        </div>
        <button class="notification-close" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem; padding: 0;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `);

    document.body.appendChild(notification);

    const close = () => {
      notification.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    };

    notification.querySelector('.notification-close').onclick = close;
    setTimeout(close, duration);
  }
}

// ============================================
// DARK MODE MANAGER
// ============================================

class DarkModeManager {
  constructor() {
    this.key = 'taskapp-dark-mode';
    this.init();
  }

  init() {
    const savedMode = localStorage.getItem(this.key);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedMode) {
      this.setDarkMode(savedMode === 'true');
    } else if (prefersDark) {
      this.setDarkMode(true);
    }

    DOM.on('.theme-toggle', 'click', () => this.toggle());

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.key)) {
        this.setDarkMode(e.matches);
      }
    });
  }

  toggle() {
    const isDark = document.body.classList.contains('dark-mode');
    this.setDarkMode(!isDark);
  }

  setDarkMode(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem(this.key, 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem(this.key, 'false');
    }
  }
}

// ============================================
// NAVIGATION MANAGER
// ============================================

class NavigationManager {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.init();
  }

  init() {
    this.updateActiveNav();
    this.setupNavListeners();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('tasks')) return 'tasks';
    if (path.includes('calendar')) return 'calendar';
    if (path.includes('analytics')) return 'analytics';
    if (path.includes('team')) return 'team';
    if (path.includes('settings')) return 'settings';
    return 'dashboard';
  }

  updateActiveNav() {
    DOM.removeClass('.nav-item', 'active');
    const activeItem = DOM.query(`[data-page="${this.currentPage}"]`);
    if (activeItem) {
      DOM.addClass(activeItem, 'active');
    }
  }

  setupNavListeners() {
    DOM.on('.nav-item', 'click', (e) => {
      const page = e.currentTarget.dataset.page;
      if (page === 'logout') {
        if (confirm('Are you sure you want to logout?')) {
          Auth.logout();
        }
      } else if (page) {
        window.location.href = `${page}.html`;
      }
    });
  }
}

// ============================================
// MODAL MANAGER
// ============================================

class ModalManager {
  constructor() {
    this.init();
  }

  init() {
    DOM.on('.modal-overlay', 'click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal(e.target);
      }
    });

    DOM.on('.modal-close', 'click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      this.closeModal(modal);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = DOM.query('.modal-overlay.active');
        if (openModal) {
          this.closeModal(openModal);
        }
      }
    });
  }

  openModal(modalId) {
    const modal = DOM.query(`#${modalId}`);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modal) {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}

// ============================================
// APP INITIALIZATION
// ============================================

class App {
  constructor() {
    this.init();
  }

  init() {
    console.log('🚀 Smart Task Management System Enhanced - Starting...');

    // Initialize authentication
    window.Auth = new AuthenticationManager();

    // Check if logged in before initializing other systems
    if (Auth.isLoggedIn()) {
      // Initialize task management
      window.TaskManager = new TaskManager();
      window.DashboardStats = new DashboardStats();

      // Initialize UI managers
      new DarkModeManager();
      new NavigationManager();
      new SearchFilterManager();
      new ModalManager();
    }

    console.log('✅ Smart Task Management System Ready');
  }
}

// ============================================
// START APPLICATION
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new App();
  });
} else {
  new App();
}

// Make global functions available
window.openAddTaskModal = () => {
  const modal = DOM.query('#addTaskModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeModal = (modal) => {
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};
