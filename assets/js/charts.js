/* ============================================
   CHART.JS CONFIGURATION & INITIALIZATION
   ============================================ */

// Chart color palette
const ChartColors = {
  primary: 'rgba(102, 126, 234, 1)',
  primaryLight: 'rgba(102, 126, 234, 0.1)',
  secondary: 'rgba(240, 147, 251, 1)',
  secondaryLight: 'rgba(240, 147, 251, 0.1)',
  accent: 'rgba(79, 172, 254, 1)',
  accentLight: 'rgba(79, 172, 254, 0.1)',
  success: 'rgba(16, 185, 129, 1)',
  successLight: 'rgba(16, 185, 129, 0.1)',
  warning: 'rgba(245, 158, 11, 1)',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  danger: 'rgba(239, 68, 68, 1)',
  dangerLight: 'rgba(239, 68, 68, 0.1)',
  gray: 'rgba(107, 114, 128, 1)',
  grayLight: 'rgba(107, 114, 128, 0.1)',
};

function getStoredTasks() {
  try {
    const tasks = JSON.parse(localStorage.getItem('taskflow-tasks') || '[]');
    return Array.isArray(tasks) ? tasks : [];
  } catch {
    return [];
  }
}

function isStoredTaskOverdue(task) {
  if (!task.dueDate || task.status === 'completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${task.dueDate}T00:00:00`) < today;
}

function getTaskDistributionData() {
  const tasks = getStoredTasks();
  return [
    tasks.filter((task) => task.status === 'completed').length,
    tasks.filter((task) => task.status === 'inprogress').length,
    tasks.filter((task) => task.status === 'todo').length,
    tasks.filter((task) => isStoredTaskOverdue(task)).length,
  ];
}

function getWeeklyProductivityData() {
  const tasks = getStoredTasks();
  const days = [...Array(7)].map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });

  return {
    completed: days.map((day) => tasks.filter((task) => (task.completedAt || '').slice(0, 10) === day).length),
    active: days.map((day) => tasks.filter((task) => task.status !== 'completed' && (!task.dueDate || task.dueDate >= day)).length),
  };
}

// Global chart options
const ChartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        font: {
          size: 12,
          weight: 600,
          family: "system-ui, -apple-system, 'Segoe UI', 'Roboto'",
        },
        color: '#718096',
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        font: {
          size: 12,
          weight: 500,
        },
        color: '#cbd5e0',
      },
    },
    y: {
      display: true,
      grid: {
        color: 'rgba(203, 213, 224, 0.1)',
        drawBorder: false,
      },
      ticks: {
        font: {
          size: 12,
          weight: 500,
        },
        color: '#cbd5e0',
        beginAtZero: true,
      },
    },
  },
};

// ============================================
// PRODUCTIVITY CHART (Line Chart)
// ============================================

function initProductivityChart(canvasId = 'productivityChart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, ChartColors.primaryLight);
  gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
  const weeklyData = getWeeklyProductivityData();

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Tasks Completed',
          data: weeklyData.completed,
          borderColor: ChartColors.primary,
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: ChartColors.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
        },
        {
          label: 'Tasks Pending',
          data: weeklyData.active,
          borderColor: ChartColors.secondary,
          backgroundColor: ChartColors.secondaryLight,
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: ChartColors.secondary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      ...ChartDefaults,
      plugins: {
        ...ChartDefaults.plugins,
        filler: {
          propagate: true,
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    },
  });
}

// ============================================
// TASK DISTRIBUTION CHART (Doughnut)
// ============================================

function initTaskDistributionChart(canvasId = 'taskDistributionChart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'In Progress', 'To Do', 'Overdue'],
      datasets: [
        {
          data: getTaskDistributionData(),
          backgroundColor: [
            ChartColors.success,
            ChartColors.primary,
            ChartColors.warning,
            ChartColors.danger,
          ],
          borderColor: '#fff',
          borderWidth: 3,
          borderRadius: 8,
        },
      ],
    },
    options: {
      ...ChartDefaults,
      plugins: {
        ...ChartDefaults.plugins,
        legend: {
          ...ChartDefaults.plugins.legend,
          position: 'bottom',
        },
      },
      cutout: '70%',
    },
  });
}

// ============================================
// TEAM PERFORMANCE CHART (Bar Chart)
// ============================================

function initTeamPerformanceChart(canvasId = 'teamPerformanceChart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank'],
      datasets: [
        {
          label: 'Tasks Completed',
          data: [24, 19, 28, 21, 26, 22],
          backgroundColor: ChartColors.primary,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Tasks In Progress',
          data: [8, 12, 6, 9, 5, 11],
          backgroundColor: ChartColors.accent,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      ...ChartDefaults,
      scales: {
        x: {
          ...ChartDefaults.scales.x,
          stacked: false,
        },
        y: {
          ...ChartDefaults.scales.y,
          stacked: false,
        },
      },
    },
  });
}

// ============================================
// PRIORITY DISTRIBUTION CHART (Pie)
// ============================================

function initPriorityChart(canvasId = 'priorityChart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['High Priority', 'Medium Priority', 'Low Priority'],
      datasets: [
        {
          data: [35, 45, 20],
          backgroundColor: [
            ChartColors.danger,
            ChartColors.warning,
            ChartColors.success,
          ],
          borderColor: '#fff',
          borderWidth: 3,
          borderRadius: 8,
        },
      ],
    },
    options: {
      ...ChartDefaults,
      plugins: {
        ...ChartDefaults.plugins,
        legend: {
          ...ChartDefaults.plugins.legend,
          position: 'bottom',
        },
      },
    },
  });
}

// ============================================
// WEEKLY PROGRESS CHART (Area)
// ============================================

function initWeeklyProgressChart(canvasId = 'weeklyProgressChart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const gradient1 = ctx.createLinearGradient(0, 0, 0, 300);
  gradient1.addColorStop(0, ChartColors.primaryLight);
  gradient1.addColorStop(1, 'rgba(102, 126, 234, 0)');

  const gradient2 = ctx.createLinearGradient(0, 0, 0, 300);
  gradient2.addColorStop(0, ChartColors.accentLight);
  gradient2.addColorStop(1, 'rgba(79, 172, 254, 0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
      datasets: [
        {
          label: 'Tasks Completed',
          data: [65, 78, 82, 88, 92, 95],
          borderColor: ChartColors.primary,
          backgroundColor: gradient1,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: ChartColors.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Team Efficiency %',
          data: [70, 75, 80, 85, 88, 91],
          borderColor: ChartColors.accent,
          backgroundColor: gradient2,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: ChartColors.accent,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      ...ChartDefaults,
      interaction: {
        intersect: false,
        mode: 'index',
      },
    },
  });
}

// ============================================
// DEPARTMENT COMPARISON CHART (Horizontal Bar)
// ============================================

function initDepartmentChart(canvasId = 'departmentChart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'],
      datasets: [
        {
          label: 'Completed',
          data: [156, 128, 95, 78, 52, 64],
          backgroundColor: ChartColors.success,
          borderRadius: 6,
        },
        {
          label: 'In Progress',
          data: [42, 38, 28, 25, 18, 22],
          backgroundColor: ChartColors.primary,
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...ChartDefaults.plugins,
      },
      scales: {
        x: {
          ...ChartDefaults.scales.x,
          stacked: false,
        },
        y: {
          ...ChartDefaults.scales.y,
          stacked: false,
        },
      },
    },
  });
}

// ============================================
// HEATMAP STYLE CALENDAR CHART
// ============================================

function initActivityHeatmap(canvasId = 'activityHeatmap') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: [
        {
          label: 'Task Activity',
          data: [
            { x: 1, y: 1, r: 8 },
            { x: 2, y: 2, r: 12 },
            { x: 3, y: 1, r: 6 },
            { x: 4, y: 3, r: 15 },
            { x: 5, y: 2, r: 10 },
            { x: 6, y: 1, r: 7 },
            { x: 7, y: 3, r: 14 },
          ],
          backgroundColor: ChartColors.primary,
          borderColor: ChartColors.primary,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          min: 0,
          max: 8,
          ticks: { stepSize: 1 },
        },
        y: {
          min: 0,
          max: 4,
          ticks: { stepSize: 1 },
        },
      },
    },
  });
}

// ============================================
// INITIALIZATION HELPER
// ============================================

function initializeCharts(chartConfigs) {
  window.addEventListener('load', () => {
    chartConfigs.forEach(({ id, init }) => {
      if (document.getElementById(id)) {
        setTimeout(() => init(id), 100);
      }
    });
  });
}

// Auto-initialize common charts on page load
document.addEventListener('DOMContentLoaded', () => {
  const charts = [
    { id: 'productivityChart', init: initProductivityChart },
    { id: 'taskDistributionChart', init: initTaskDistributionChart },
    { id: 'teamPerformanceChart', init: initTeamPerformanceChart },
    { id: 'priorityChart', init: initPriorityChart },
    { id: 'weeklyProgressChart', init: initWeeklyProgressChart },
    { id: 'departmentChart', init: initDepartmentChart },
    { id: 'activityHeatmap', init: initActivityHeatmap },
  ];

  charts.forEach(({ id, init }) => {
    if (document.getElementById(id)) {
      init(id);
    }
  });
});
