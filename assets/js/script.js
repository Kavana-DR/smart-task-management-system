/* ============================================
   SMART TASK MANAGEMENT SYSTEM
   Production-style client functionality
   ============================================ */

const AppState = {
  keys: {
    token: 'user-token',
    user: 'user-data',
    users: 'registered-users',
    tasks: 'taskflow-tasks',
    theme: 'taskapp-dark-mode',
    notifications: 'taskflow-notifications',
    reminders: 'taskflow-reminders-shown',
  },
  credentials: {
    email: 'admin@gmail.com',
    password: 'admin123',
  },
  members: [
    'Sarah Anderson',
    'Mike Chen',
    'Jessica Davis',
    'Emma Wilson',
    'John Doe',
  ],
  statuses: {
    todo: 'To Do',
    inprogress: 'In Progress',
    completed: 'Completed',
  },
};

const DOM = {
  query: (selector, root = document) => root.querySelector(selector),
  queryAll: (selector, root = document) => [...root.querySelectorAll(selector)],
  create: (tag, className = '', html = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (html) element.innerHTML = html;
    return element;
  },
};

const Store = {
  read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

const TaskStore = {
  currentUser() {
    return Store.read(AppState.keys.user, null);
  },
  currentUserId() {
    return this.currentUser()?.id || 'guest';
  },
  storageKey() {
    return `${AppState.keys.tasks}-${this.currentUserId()}`;
  },
  shouldSeedDemoTasks() {
    return this.currentUserId() === 'user-admin';
  },
  all() {
    const tasks = Store.read(this.storageKey(), null);
    if (Array.isArray(tasks)) {
      const normalizedTasks = this.normalize(tasks);
      if (JSON.stringify(normalizedTasks) !== JSON.stringify(tasks)) {
        Store.write(this.storageKey(), normalizedTasks);
      }
      return normalizedTasks;
    }

    const seededTasks = this.shouldSeedDemoTasks() ? this.normalize(this.seed()) : [];
    this.save(seededTasks);
    return seededTasks;
  },
  save(tasks) {
    const normalizedTasks = this.normalize(tasks);
    Store.write(this.storageKey(), normalizedTasks);
    window.dispatchEvent(new CustomEvent('tasks-updated', { detail: normalizedTasks }));
  },
  upsert(task) {
    const tasks = this.all();
    const index = tasks.findIndex((item) => item.id === task.id);
    let savedTask;
    if (index >= 0) {
      savedTask = { ...tasks[index], ...task, updatedAt: new Date().toISOString() };
      tasks[index] = savedTask;
    } else {
      const statusTasks = tasks.filter((item) => item.status === task.status);
      savedTask = {
        ...task,
        id: task.id || Utils.id(),
        sortOrder: statusTasks.length ? Math.min(...statusTasks.map((item) => item.sortOrder || 0)) - 1 : 0,
        createdAt: new Date().toISOString(),
      };
      tasks.unshift(savedTask);
    }
    this.save(tasks);
    return savedTask;
  },
  delete(taskId) {
    this.save(this.all().filter((task) => task.id !== taskId));
  },
  updateStatus(taskId, status) {
    const tasks = this.all().map((task) => (
      task.id === taskId
        ? {
            ...task,
            status,
            completedAt: status === 'completed' ? new Date().toISOString() : '',
            updatedAt: new Date().toISOString(),
          }
        : task
    ));
    this.save(tasks);
  },
  move(taskId, status, orderedIds = []) {
    const movedTask = this.all().find((task) => task.id === taskId);
    if (!movedTask) return;

    const reordered = this.all().map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status,
          completedAt: status === 'completed' ? (task.completedAt || new Date().toISOString()) : '',
          updatedAt: new Date().toISOString(),
        };
      }
      return task;
    });

    const targetIds = orderedIds.length
      ? orderedIds
      : reordered.filter((task) => task.status === status).map((task) => task.id);

    this.save(reordered.map((task) => (
      task.status === status
        ? { ...task, sortOrder: targetIds.indexOf(task.id) >= 0 ? targetIds.indexOf(task.id) : task.sortOrder }
        : task
    )));
  },
  normalize(tasks) {
    const seen = new Set();
    const allowedStatuses = Object.keys(AppState.statuses);
    const priorityLabel = (priority) => {
      const value = String(priority || '').toLowerCase();
      if (value === 'high') return 'High';
      if (value === 'low') return 'Low';
      return 'Medium';
    };
    const statusKey = (status) => {
      const value = String(status || '').toLowerCase().replace(/\s+/g, '');
      if (value === 'inprogress') return 'inprogress';
      if (value === 'completed') return 'completed';
      return 'todo';
    };
    const normalized = tasks
      .filter((task) => task && task.id && !seen.has(task.id) && (seen.add(task.id) || true))
      .map((task, index) => {
        const normalizedStatus = allowedStatuses.includes(task.status) ? task.status : statusKey(task.status);
        return {
          id: task.id,
          title: String(task.title || '').trim() || 'Untitled Task',
          description: String(task.description || '').trim(),
          priority: priorityLabel(task.priority),
          dueDate: task.dueDate || '',
          status: normalizedStatus,
          assignee: task.assignee || AppState.members[0],
          sortOrder: Number.isFinite(Number(task.sortOrder)) ? Number(task.sortOrder) : index,
          completedAt: normalizedStatus === 'completed' ? (task.completedAt || new Date().toISOString()) : '',
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || '',
        };
      });

    return normalized.sort((a, b) => {
      if (a.status !== b.status) return allowedStatuses.indexOf(a.status) - allowedStatuses.indexOf(b.status);
      return a.sortOrder - b.sortOrder;
    });
  },
  seed() {
    const daysFromNow = (days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 10);
    };

    return [
      {
        id: 'task-homepage-ui',
        title: 'Homepage UI Redesign',
        description: 'Complete redesign of the landing page with new branding.',
        priority: 'High',
        dueDate: daysFromNow(1),
        status: 'todo',
        assignee: 'Jessica Davis',
        sortOrder: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-api-auth',
        title: 'API Authentication',
        description: 'Implement JWT-based authentication for REST API.',
        priority: 'Medium',
        dueDate: daysFromNow(4),
        status: 'todo',
        assignee: 'Mike Chen',
        sortOrder: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-dark-mode',
        title: 'Add Dark Mode Support',
        description: 'Implement theme switcher and persistent dark mode CSS.',
        priority: 'Low',
        dueDate: daysFromNow(7),
        status: 'todo',
        assignee: 'Sarah Anderson',
        sortOrder: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-db-schema',
        title: 'Database Schema Optimization',
        description: 'Optimize queries and add proper indexing.',
        priority: 'Medium',
        dueDate: daysFromNow(2),
        status: 'inprogress',
        assignee: 'Mike Chen',
        sortOrder: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-payment',
        title: 'Payment Integration',
        description: 'Integrate Stripe payment gateway and checkout events.',
        priority: 'High',
        dueDate: daysFromNow(-1),
        status: 'inprogress',
        assignee: 'Sarah Anderson',
        sortOrder: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-server',
        title: 'Setup Production Server',
        description: 'Configure cloud compute and database instances.',
        priority: 'High',
        dueDate: daysFromNow(-5),
        status: 'completed',
        assignee: 'Mike Chen',
        sortOrder: 0,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-responsive',
        title: 'Responsive Layout Implementation',
        description: 'Make all pages mobile-friendly.',
        priority: 'Medium',
        dueDate: daysFromNow(-2),
        status: 'completed',
        assignee: 'Sarah Anderson',
        sortOrder: 1,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
  },
};

const Utils = {
  currentPage() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    return page.replace('.html', '') || 'index';
  },
  isAuthPage() {
    const page = this.currentPage();
    return page === 'index' || page === 'register' || page === '';
  },
  isOverdue(task) {
    if (!task.dueDate || task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${task.dueDate}T00:00:00`);
    return due < today;
  },
  formatDate(dateString) {
    if (!dateString) return 'No date';
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${dateString}T00:00:00`));
  },
  initials(name) {
    return (name || 'NA')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  },
  id() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `task_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  },
  userId(email = '') {
    return `user-${String(email).toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  },
  escape(text = '') {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  },
};

class Toasts {
  static show(message, type = 'success', title = '') {
    let container = DOM.query('.toast-stack');
    if (!container) {
      container = DOM.create('div', 'toast-stack');
      document.body.appendChild(container);
    }

    const icon = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-bell',
      warning: 'fa-clock',
    }[type] || 'fa-bell';

    const toast = DOM.create('div', `toast toast-${type}`, `
      <i class="fas ${icon}"></i>
      <div>
        ${title ? `<strong>${Utils.escape(title)}</strong>` : ''}
        <p>${Utils.escape(message)}</p>
      </div>
      <button type="button" aria-label="Dismiss notification"><i class="fas fa-times"></i></button>
    `);

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    const remove = () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    };
    toast.querySelector('button').addEventListener('click', remove);
    setTimeout(remove, 4200);
  }
}

class AuthManager {
  init() {
    if (Utils.isAuthPage()) {
      this.setupLogin();
      this.setupRegistration();
      if (localStorage.getItem(AppState.keys.token)) {
        window.location.href = 'dashboard.html';
      }
      return;
    }

    if (!localStorage.getItem(AppState.keys.token)) {
      window.location.href = 'index.html';
      return;
    }

    this.hydrateProfile();
  }

  setupLogin() {
    const form = DOM.query('form[data-storage-key="user-login"]');
    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = DOM.query('#email')?.value.trim().toLowerCase();
      const password = DOM.query('#password')?.value.trim();

      const user = this.findUser(email, password);
      if (user) {
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'Project Manager',
        };
        Store.write(AppState.keys.user, userData);
        localStorage.setItem(AppState.keys.token, `token_${Date.now()}`);
        Toasts.show('Login successful. Opening your dashboard.', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 550);
      } else {
        this.showLoginError(form, 'Invalid email or password.');
      }
    });
  }

  setupRegistration() {
    const form = DOM.query('form[data-storage-key="user-register"]');
    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const nameInput = DOM.query('#registerName');
      const emailInput = DOM.query('#registerEmail');
      const passwordInput = DOM.query('#registerPassword');
      const confirmPasswordInput = DOM.query('#confirmPassword');
      const name = nameInput?.value.trim();
      const email = emailInput?.value.trim().toLowerCase();
      const password = passwordInput?.value.trim();
      const confirmPassword = confirmPasswordInput?.value.trim();

      this.clearAuthError(form);

      if (!name || !email || !password || !confirmPassword) {
        this.showLoginError(form, 'All registration fields are required.');
        return;
      }

      if (password !== confirmPassword) {
        this.showLoginError(form, 'Password and confirm password must match.');
        return;
      }

      if (this.findUserByEmail(email)) {
        this.showLoginError(form, 'Email already registered. Please login instead.');
        return;
      }

      const users = this.registeredUsers();
      users.push({ id: Utils.userId(email), name, email, password, role: 'Project Manager' });
      Store.write(AppState.keys.users, users);
      Toasts.show('Registration successful. Please login.', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 650);
    });
  }

  registeredUsers() {
    const users = Store.read(AppState.keys.users, []);
    const seededUsers = Array.isArray(users) ? users : [];
    if (!seededUsers.some((user) => user.email === AppState.credentials.email)) {
      seededUsers.unshift({
        id: 'user-admin',
        name: 'Admin User',
        email: AppState.credentials.email,
        password: AppState.credentials.password,
        role: 'Project Manager',
      });
      Store.write(AppState.keys.users, seededUsers);
    }
    seededUsers.forEach((user) => {
      if (!user.id) user.id = Utils.userId(user.email);
    });
    Store.write(AppState.keys.users, seededUsers);
    return seededUsers;
  }

  findUser(email, password) {
    return this.registeredUsers().find((user) => user.email === email && user.password === password);
  }

  findUserByEmail(email) {
    return this.registeredUsers().find((user) => user.email === email);
  }

  clearAuthError(form) {
    DOM.query('.auth-error', form)?.remove();
  }

  showLoginError(form, message) {
    let error = DOM.query('.auth-error', form);
    if (!error) {
      error = DOM.create('div', 'auth-error');
      form.prepend(error);
    }
    error.textContent = message;
    error.classList.remove('shake');
    void error.offsetWidth;
    error.classList.add('shake');
    Toasts.show(message, 'error', 'Login failed');
  }

  hydrateProfile() {
    const user = Store.read(AppState.keys.user, { name: 'Admin User', role: 'Project Manager' });
    DOM.queryAll('.profile-name').forEach((item) => { item.textContent = user.name; });
    DOM.queryAll('.profile-role').forEach((item) => { item.textContent = user.role || 'Project Manager'; });
    DOM.queryAll('.profile-avatar').forEach((item) => { item.textContent = Utils.initials(user.name); });
  }

  logout() {
    Store.remove(AppState.keys.token);
    Store.remove(AppState.keys.user);
    Toasts.show('You have been logged out.', 'info');
    setTimeout(() => { window.location.href = 'index.html'; }, 350);
  }
}

class ThemeManager {
  init() {
    this.apply(localStorage.getItem(AppState.keys.theme) === 'true');
    DOM.queryAll('.theme-toggle').forEach((button) => {
      button.addEventListener('click', () => this.apply(!document.body.classList.contains('dark-mode'), true));
    });
  }

  apply(isDark, notify = false) {
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem(AppState.keys.theme, String(isDark));
    DOM.queryAll('.theme-toggle i').forEach((icon) => {
      icon.className = `fas ${isDark ? 'fa-sun' : 'fa-moon'}`;
    });
    if (notify) Toasts.show(`${isDark ? 'Dark' : 'Light'} mode enabled.`, 'success');
  }
}

class NavigationManager {
  constructor(auth) {
    this.auth = auth;
  }

  init() {
    const current = Utils.currentPage();
    DOM.queryAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.page === current);
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page === 'logout') {
          this.auth.logout();
        } else if (page) {
          window.location.href = `${page}.html`;
        }
      });
    });
  }
}

class ResponsiveSidebar {
  init() {
    this.ensureToggle();
    window.addEventListener('resize', () => this.ensureToggle());
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.sidebar') && !event.target.closest('.menu-toggle')) {
        this.close();
      }
    });
  }

  ensureToggle() {
    const navbar = DOM.query('.navbar-content');
    if (!navbar) return;
    let button = DOM.query('.menu-toggle');
    if (window.innerWidth <= 900 && !button) {
      button = DOM.create('button', 'navbar-icon menu-toggle', '<i class="fas fa-bars"></i>');
      button.type = 'button';
      button.title = 'Open menu';
      navbar.prepend(button);
      button.addEventListener('click', () => this.toggle());
    }
    if (window.innerWidth > 900 && button) {
      button.remove();
      this.close();
    }
  }

  toggle() {
    const sidebar = DOM.query('.sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('mobile-open');
    document.body.classList.toggle('sidebar-open', sidebar.classList.contains('mobile-open'));
  }

  close() {
    DOM.query('.sidebar')?.classList.remove('mobile-open');
    document.body.classList.remove('sidebar-open');
  }
}

class ModalManager {
  init() {
    DOM.queryAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) this.close(overlay);
      });
    });
    DOM.queryAll('.modal-close').forEach((button) => {
      button.addEventListener('click', () => this.close(button.closest('.modal-overlay')));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close(DOM.query('.modal-overlay.active'));
    });
  }

  open(id) {
    const modal = DOM.query(`#${id}`);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

class TaskBoard {
  constructor(modals) {
    this.modals = modals;
    this.filters = {
      search: '',
      priority: 'all',
      status: 'all',
      due: 'all',
    };
    this.draggedId = '';
  }

  init() {
    if (!DOM.query('.kanban-container')) return;
    this.prepareMarkup();
    this.bindEvents();
    this.render();
    this.checkDeadlines();
  }

  prepareMarkup() {
    DOM.queryAll('.kanban-list').forEach((list) => { list.innerHTML = ''; });

    const modal = DOM.query('#addTaskModal');
    if (!modal || DOM.query('#taskStatus')) return;
    const assigneeGroup = DOM.query('#taskAssignee')?.closest('.form-group');
    const statusGroup = DOM.create('div', 'form-group', `
      <label for="taskStatus" class="form-label">Status</label>
      <select id="taskStatus" class="form-select">
        <option value="todo">To Do</option>
        <option value="inprogress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    `);
    assigneeGroup?.after(statusGroup);
  }

  bindEvents() {
    DOM.queryAll('.page-header .btn-primary').forEach((button) => {
      button.addEventListener('click', () => this.openForm());
    });

    const createButton = DOM.query('#addTaskModal .modal-footer .btn-primary');
    if (createButton) {
      createButton.removeAttribute('onclick');
      createButton.type = 'button';
      createButton.addEventListener('click', () => this.saveFromForm());
    }

    DOM.query('#addTaskModal form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveFromForm();
    });

    DOM.queryAll('.kanban-list').forEach((list) => {
      list.addEventListener('dragover', (event) => {
        event.preventDefault();
        if (this.draggedId) this.previewDropPosition(list, event.clientY);
        list.classList.add('drag-over');
      });
      list.addEventListener('dragleave', (event) => {
        if (!list.contains(event.relatedTarget)) list.classList.remove('drag-over');
      });
      list.addEventListener('drop', (event) => {
        event.preventDefault();
        list.classList.remove('drag-over');
        if (!this.draggedId) return;
        const status = list.dataset.column;
        const orderedIds = DOM.queryAll('.task-card', list).map((card) => card.dataset.taskId);
        TaskStore.move(this.draggedId, status, orderedIds);
        Toasts.show(`Task moved to ${AppState.statuses[status]}.`, 'success');
        if (status === 'completed') Toasts.show('Nice work. Task marked completed.', 'success', 'Completed');
      });
    });

    DOM.queryAll('.search-input').forEach((input) => {
      input.addEventListener('input', (event) => {
        this.filters.search = event.target.value.toLowerCase();
        this.render();
      });
    });

    DOM.queryAll('.task-filter-priority').forEach((select) => {
      select.addEventListener('change', (event) => {
        this.filters.priority = event.target.value;
        this.render();
      });
    });
    DOM.queryAll('.task-filter-status').forEach((select) => {
      select.addEventListener('change', (event) => {
        this.filters.status = event.target.value;
        this.render();
      });
    });
    DOM.queryAll('.task-filter-due').forEach((select) => {
      select.addEventListener('change', (event) => {
        this.filters.due = event.target.value;
        this.render();
      });
    });

    window.addEventListener('tasks-updated', () => this.render());
  }

  openForm(task = null) {
    const modalTitle = DOM.query('#addTaskModal .modal-title');
    const actionButton = DOM.query('#addTaskModal .modal-footer .btn-primary');
    if (modalTitle) modalTitle.textContent = task ? 'Edit Task' : 'Create New Task';
    if (actionButton) actionButton.innerHTML = task ? '<i class="fas fa-save"></i>Save Changes' : '<i class="fas fa-plus"></i>Create Task';

    DOM.query('#taskTitle').value = task?.title || '';
    DOM.query('#taskDesc').value = task?.description || '';
    DOM.query('#taskPriority').value = task?.priority || 'Medium';
    DOM.query('#taskDueDate').value = task?.dueDate || '';
    DOM.query('#taskAssignee').value = task?.assignee || AppState.members[0];
    DOM.query('#taskStatus').value = task?.status || 'todo';
    DOM.query('#addTaskModal').dataset.editingId = task?.id || '';
    this.clearValidation();
    this.modals.open('addTaskModal');
    setTimeout(() => DOM.query('#taskTitle')?.focus(), 80);
  }

  saveFromForm() {
    const titleInput = DOM.query('#taskTitle');
    const dueDateInput = DOM.query('#taskDueDate');
    const title = titleInput?.value.trim();
    const description = DOM.query('#taskDesc')?.value.trim();
    const priority = DOM.query('#taskPriority')?.value;
    const dueDate = dueDateInput?.value;
    const assignee = DOM.query('#taskAssignee')?.value;
    const status = DOM.query('#taskStatus')?.value || 'todo';
    const editingId = DOM.query('#addTaskModal')?.dataset.editingId;

    if (!this.validateForm({ titleInput, dueDateInput })) {
      return;
    }

    const duplicateTask = TaskStore.all().find((task) => (
      task.id !== editingId
      && task.title.toLowerCase() === title.toLowerCase()
      && task.dueDate === dueDate
      && task.assignee === assignee
    ));
    if (duplicateTask) {
      titleInput.classList.add('is-invalid');
      Toasts.show('A matching task already exists.', 'error', 'Duplicate task');
      return;
    }

    this.setSaving(true);
    const savedTask = TaskStore.upsert({
      id: editingId || undefined,
      title,
      description,
      priority,
      dueDate,
      assignee,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : '',
    });

    this.render();
    this.setSaving(false);
    this.modals.close(DOM.query('#addTaskModal'));
    DOM.query(`.task-card[data-task-id="${savedTask.id}"]`)?.scrollIntoView({ block: 'center' });
    Toasts.show(editingId ? 'Task updated successfully.' : 'Task created successfully.', 'success');
  }

  validateForm({ titleInput, dueDateInput }) {
    this.clearValidation();
    const invalidFields = [];

    if (!titleInput?.value.trim()) invalidFields.push([titleInput, 'Task title is required.']);
    if (!dueDateInput?.value) invalidFields.push([dueDateInput, 'Due date is required.']);

    invalidFields.forEach(([field, message]) => {
      field.classList.add('is-invalid');
      field.setAttribute('aria-invalid', 'true');
      const helper = DOM.create('div', 'form-error task-form-error', Utils.escape(message));
      field.closest('.form-group')?.appendChild(helper);
    });

    if (invalidFields.length) {
      invalidFields[0][0].focus();
      Toasts.show('Please complete the highlighted fields.', 'error', 'Missing details');
      return false;
    }

    return true;
  }

  clearValidation() {
    DOM.queryAll('#addTaskModal .is-invalid').forEach((field) => {
      field.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
    });
    DOM.queryAll('#addTaskModal .task-form-error').forEach((error) => error.remove());
  }

  setSaving(isSaving) {
    const button = DOM.query('#addTaskModal .modal-footer .btn-primary');
    if (!button) return;
    button.disabled = isSaving;
    button.classList.toggle('is-loading', isSaving);
  }

  matchesFilters(task) {
    const haystack = `${task.title} ${task.description} ${task.assignee}`.toLowerCase();
    const search = this.filters.search.trim().toLowerCase();
    if (search && !haystack.includes(search)) return false;
    if (this.filters.priority !== 'all' && task.priority.toLowerCase() !== this.filters.priority) return false;
    if (this.filters.status !== 'all' && task.status !== this.filters.status) return false;
    if (this.filters.due === 'overdue' && !Utils.isOverdue(task)) return false;
    if (this.filters.due === 'today' && task.dueDate !== new Date().toISOString().slice(0, 10)) return false;
    return true;
  }

  render() {
    const tasks = TaskStore.all();
    const visibleTasks = tasks.filter((task) => this.matchesFilters(task));

    DOM.query('.kanban-container')?.classList.add('is-loading-board');
    DOM.queryAll('.kanban-list').forEach((list) => { list.innerHTML = ''; });
    visibleTasks.forEach((task) => {
      const list = DOM.query(`.kanban-list[data-column="${task.status}"]`);
      if (list) list.appendChild(this.taskCard(task));
    });

    DOM.queryAll('.kanban-column').forEach((column) => {
      const list = DOM.query('.kanban-list', column);
      const count = DOM.query('.kanban-count', column);
      if (count && list) count.textContent = list.children.length;
    });
    requestAnimationFrame(() => DOM.query('.kanban-container')?.classList.remove('is-loading-board'));
  }

  previewDropPosition(list, pointerY) {
    const draggedCard = DOM.query(`.task-card[data-task-id="${this.draggedId}"]`);
    if (!draggedCard) return;

    const afterCard = this.getCardAfterPointer(list, pointerY);
    if (!afterCard) {
      list.appendChild(draggedCard);
    } else if (afterCard !== draggedCard) {
      list.insertBefore(draggedCard, afterCard);
    }
  }

  getCardAfterPointer(list, pointerY) {
    const cards = DOM.queryAll('.task-card:not(.dragging)', list);
    return cards.reduce((closest, card) => {
      const box = card.getBoundingClientRect();
      const offset = pointerY - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: card };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }

  taskCard(task) {
    const priority = task.priority.toLowerCase();
    const completed = task.status === 'completed';
    const overdue = Utils.isOverdue(task);
    const card = DOM.create('article', `task-card ${priority}-priority ${completed ? 'is-completed' : ''} ${overdue ? 'is-overdue' : ''}`);
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.dataset.searchable = 'true';
    card.setAttribute('data-task-id', task.id);
    card.innerHTML = `
      <div class="task-card-actions">
        <button type="button" class="task-action task-complete" title="${completed ? 'Move to To Do' : 'Mark completed'}" aria-label="${completed ? 'Move to To Do' : 'Mark completed'}">
          <i class="fas ${completed ? 'fa-rotate-left' : 'fa-check'}"></i>
        </button>
        <button type="button" class="task-action task-edit" title="Edit task" aria-label="Edit task"><i class="fas fa-pen"></i></button>
        <button type="button" class="task-action task-delete" title="Delete task" aria-label="Delete task"><i class="fas fa-trash"></i></button>
      </div>
      <div class="task-labels">
        <span class="label ${priority === 'high' ? 'urgent' : priority === 'medium' ? 'backend' : 'frontend'}">${Utils.escape(AppState.statuses[task.status])}</span>
        ${overdue ? '<span class="label urgent">Overdue</span>' : ''}
      </div>
      <div class="task-title" data-task-id="${Utils.escape(task.id)}">${Utils.escape(task.title)}</div>
      <div class="task-description">${Utils.escape(task.description || 'No description added.')}</div>
      <div class="task-meta">
        <span class="task-priority ${priority}">
          <i class="fas ${priority === 'high' ? 'fa-arrow-up' : priority === 'medium' ? 'fa-minus' : 'fa-arrow-down'}"></i>${Utils.escape(task.priority)}
        </span>
        <span class="task-due-date"><i class="fas fa-calendar"></i>${Utils.formatDate(task.dueDate)}</span>
      </div>
      <div class="task-assignees">
        <div class="avatar-sm" title="${Utils.escape(task.assignee)}">${Utils.initials(task.assignee)}</div>
        <span class="task-assignee-name">${Utils.escape(task.assignee)}</span>
      </div>
    `;

    card.addEventListener('dragstart', (event) => {
      this.draggedId = task.id;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => {
      this.draggedId = '';
      card.classList.remove('dragging');
      DOM.queryAll('.kanban-list').forEach((list) => list.classList.remove('drag-over'));
    });
    DOM.query('.task-edit', card).addEventListener('click', () => this.openForm(task));
    DOM.query('.task-delete', card).addEventListener('click', () => {
      TaskStore.delete(task.id);
      Toasts.show('Task deleted.', 'success');
    });
    DOM.query('.task-complete', card).addEventListener('click', () => {
      const nextStatus = completed ? 'todo' : 'completed';
      TaskStore.updateStatus(task.id, nextStatus);
      Toasts.show(completed ? 'Task moved back to To Do.' : 'Task completed.', 'success');
    });

    return card;
  }

  checkDeadlines() {
    const today = new Date().toISOString().slice(0, 10);
    const reminderKey = `${today}`;
    const shown = Store.read(AppState.keys.reminders, []);
    if (shown.includes(reminderKey)) return;

    const urgentCount = TaskStore.all().filter((task) => {
      if (task.status === 'completed' || !task.dueDate) return false;
      const diff = Math.ceil((new Date(`${task.dueDate}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000);
      return diff >= 0 && diff <= 1;
    }).length;

    if (urgentCount) {
      Toasts.show(`${urgentCount} task${urgentCount > 1 ? 's are' : ' is'} due today or tomorrow.`, 'warning', 'Deadline reminder');
      Store.write(AppState.keys.reminders, [...shown, reminderKey]);
    }
  }
}

class Dashboard {
  init() {
    if (Utils.currentPage() !== 'dashboard' || !DOM.query('.stats-grid')) return;
    this.render();
    window.addEventListener('tasks-updated', () => this.render());
  }

  render() {
    this.ensureProductivityCard();
    const tasks = TaskStore.all();
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'completed').length;
    const overdue = tasks.filter((task) => Utils.isOverdue(task)).length;
    const pending = total - completed;
    const productivity = total ? Math.round((completed / total) * 100) : 0;
    const values = [total, completed, pending, overdue, productivity];

    DOM.queryAll('.stat-value').forEach((item, index) => {
      if (index < values.length) this.animateValue(item, values[index], index === 4 ? '%' : '');
    });

    const pageTitle = DOM.query('.page-title p');
    if (pageTitle && Utils.currentPage() === 'dashboard') {
      pageTitle.textContent = `Welcome back. Productivity is at ${productivity}% with ${pending} active task${pending === 1 ? '' : 's'}.`;
    }

    DOM.queryAll('.stat-change span').forEach((item, index) => {
      const labels = [
        `${productivity}% productivity`,
        `${completed} shipped`,
        `${pending} active`,
        overdue ? 'Action needed' : 'On schedule',
        `${completed}/${total || 0} complete`,
      ];
      if (labels[index]) item.textContent = labels[index];
    });
  }

  ensureProductivityCard() {
    if (Utils.currentPage() !== 'dashboard' || DOM.query('[data-stat="productivity"]')) return;
    const statsGrid = DOM.query('.stats-grid');
    if (!statsGrid) return;
    statsGrid.appendChild(DOM.create('div', 'stat-card blue', `
      <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
        <i class="fas fa-chart-pie"></i>
      </div>
      <div class="stat-label">Productivity</div>
      <div class="stat-value" data-stat="productivity">0%</div>
      <div class="stat-change positive">
        <i class="fas fa-bolt"></i>
        <span>0/0 complete</span>
      </div>
    `));
  }

  animateValue(element, target, suffix = '') {
    const start = Number(element.textContent.replace(/\D/g, '')) || 0;
    const duration = 450;
    const started = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      element.textContent = `${Math.round(start + (target - start) * progress)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

class SearchManager {
  init() {
    if (DOM.query('.kanban-container')) return;
    DOM.queryAll('.search-input').forEach((input) => {
      input.addEventListener('input', (event) => {
        const query = event.target.value.toLowerCase();
        DOM.queryAll('[data-searchable]').forEach((item) => {
          item.style.opacity = !query || item.textContent.toLowerCase().includes(query) ? '1' : '0.25';
        });
      });
    });
  }
}

class QuickActions {
  init() {
    if (DOM.query('.kanban-container')) return;
    DOM.queryAll('.page-header .btn-primary').forEach((button) => {
      if (button.textContent.toLowerCase().includes('new task')) {
        button.addEventListener('click', () => { window.location.href = 'tasks.html'; });
      }
    });
  }
}

class FormManager {
  init() {
    DOM.queryAll('form').forEach((form) => {
      if (form.dataset.storageKey === 'user-login' || form.dataset.storageKey === 'user-register' || form.closest('#addTaskModal')) return;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        Store.write(form.dataset.storageKey || `form-${Utils.currentPage()}`, data);
        Toasts.show('Changes saved successfully.', 'success');
      });
    });
  }
}

class NotificationManager {
  init() {
    const notifications = Store.read(AppState.keys.notifications, []);
    this.updateBadge(notifications.filter((item) => !item.read).length);

    DOM.queryAll('.navbar-icon[title="Notifications"]').forEach((button) => {
      button.addEventListener('click', () => {
        Toasts.show('Notifications are live. Task reminders and completions appear here.', 'info', 'Notification center');
        this.updateBadge(0);
        Store.write(AppState.keys.notifications, notifications.map((item) => ({ ...item, read: true })));
      });
    });
  }

  updateBadge(count) {
    DOM.queryAll('.notification-badge').forEach((badge) => {
      badge.textContent = count;
      badge.style.display = count ? 'flex' : 'none';
    });
  }
}

class MicroInteractions {
  init() {
    document.body.classList.add('page-ready');
    DOM.queryAll('.btn, .navbar-icon').forEach((button) => {
      button.addEventListener('click', (event) => {
        const ripple = DOM.create('span', 'ripple');
        const rect = button.getBoundingClientRect();
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }
}

class App {
  init() {
    const auth = new AuthManager();
    const modals = new ModalManager();
    auth.init();
    new ThemeManager().init();
    new NavigationManager(auth).init();
    new ResponsiveSidebar().init();
    modals.init();
    new TaskBoard(modals).init();
    new Dashboard().init();
    new QuickActions().init();
    new FormManager().init();
    new SearchManager().init();
    new NotificationManager().init();
    new MicroInteractions().init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App().init());
} else {
  new App().init();
}
