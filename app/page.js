"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

const CATEGORIES = [
  { id: "work", label: "Work", color: "#5b9e8f" },
  { id: "personal", label: "Personal", color: "#d4736e" },
  { id: "health", label: "Health", color: "#7ab87a" },
  { id: "shopping", label: "Shopping", color: "#e6a65d" },
  { id: "study", label: "Study", color: "#6b9ec4" },
  { id: "other", label: "Other", color: "#a8a194" },
];

const PRIORITIES = ["high", "medium", "low"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── HELPERS ───────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const days = [];

  // Previous month padding
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, otherMonth: true });
  }
  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), otherMonth: false });
  }
  // Next month padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), otherMonth: true });
  }
  return days;
}

function getWeekDays(date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ─── STORAGE ───────────────────────────────────────────
function loadTasks() {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("chronos-tasks");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  if (typeof window === "undefined") return;
  localStorage.setItem("chronos-tasks", JSON.stringify(tasks));
}

// ─── MAIN APP ──────────────────────────────────────────
export default function CalendarApp() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState("month");
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage after mount
  useEffect(() => {
    setTasks(loadTasks());
    setMounted(true);
  }, []);

  // Save on change
  useEffect(() => {
    if (mounted) saveTasks(tasks);
  }, [tasks, mounted]);

  // Toast helper
  const showToast = useCallback((message, type = "success") => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Task CRUD
  const addTask = useCallback(
    (taskData) => {
      const task = { ...taskData, id: generateId(), completed: false, createdAt: new Date().toISOString() };
      setTasks((prev) => [...prev, task]);
      showToast("Task created successfully ✨");
    },
    [showToast]
  );

  const updateTask = useCallback(
    (id, updates) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      showToast("Task updated 📝");
    },
    [showToast]
  );

  const deleteTask = useCallback(
    (id) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("Task deleted 🗑️", "info");
    },
    [showToast]
  );

  const toggleComplete = useCallback(
    (id) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    },
    []
  );

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tasks, activeCategory, searchQuery]);

  // Tasks for a specific date
  const getTasksForDate = useCallback(
    (date) => {
      const dateStr = formatDate(date);
      return filteredTasks.filter((t) => t.date === dateStr);
    },
    [filteredTasks]
  );

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: tasks.length };
    CATEGORIES.forEach((c) => {
      counts[c.id] = tasks.filter((t) => t.category === c.id).length;
    });
    return counts;
  }, [tasks]);

  // Upcoming tasks (next 7 days)
  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    return tasks
      .filter((t) => {
        const d = new Date(t.date);
        return d >= now && d <= weekLater && !t.completed;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 6);
  }, [tasks]);

  // Navigation
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setDate(newDate.getDate() + 7 * direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Calendar data
  const monthDays = useMemo(
    () => getMonthDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  );

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const getCategoryColor = (catId) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    return cat ? cat.color : "#9d9db8";
  };

  if (!mounted) {
    return (
      <div className="app-container" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📅</div>
          <div style={{ color: "var(--text-muted)" }}>Loading Chronos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">📅</div>
            <span className="logo-text">Chronos</span>
          </div>

          {/* Mini Calendar */}
          <MiniCalendar
            currentDate={currentDate}
            selectedDate={selectedDate}
            onSelect={(d) => { setSelectedDate(d); setCurrentDate(d); }}
            tasks={tasks}
          />
        </div>

        <div className="sidebar-content">
          {/* Categories */}
          <div className="sidebar-section">
            <div className="section-title">Categories</div>
            <div className="category-list">
              <button
                className={`category-item ${activeCategory === "all" ? "active" : ""}`}
                onClick={() => setActiveCategory("all")}
              >
                <span className="category-dot" style={{ background: "var(--gradient-glow)" }}></span>
                All Tasks
                <span className="category-count">{categoryCounts.all}</span>
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-item ${activeCategory === cat.id ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className="category-dot" style={{ background: cat.color }}></span>
                  {cat.label}
                  <span className="category-count">{categoryCounts[cat.id] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="sidebar-section">
            <div className="section-title">Upcoming</div>
            {upcomingTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎉</div>
                <div className="empty-state-text">All clear! No upcoming tasks.</div>
              </div>
            ) : (
              <div className="upcoming-tasks">
                {upcomingTasks.map((task) => (
                  <button
                    key={task.id}
                    className="upcoming-task"
                    onClick={() => {
                      setSelectedDate(new Date(task.date));
                      setCurrentDate(new Date(task.date));
                    }}
                  >
                    <span
                      className="upcoming-task-color"
                      style={{ background: getCategoryColor(task.category) }}
                    ></span>
                    <div className="upcoming-task-info">
                      <div className="upcoming-task-title">{task.title}</div>
                      <div className="upcoming-task-time">
                        {new Date(task.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {task.time ? ` • ${task.time}` : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", padding: "1.5rem", borderTop: "1px solid var(--border-subtle)", textAlign: "center", background: "var(--bg-secondary)" }}>
          <div style={{ fontSize: "var(--font-size-sm)", fontWeight: "600", color: "var(--text-primary)" }}>Shradha Shrivastava</div>
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginTop: "4px" }}>0201AI221067</div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <div className="current-date-display">
              <h1 className="current-month-year">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h1>
              <span className="current-day-info">
                Today is {DAYS[today.getDay()]}, {MONTHS[today.getMonth()]}{" "}
                {getOrdinal(today.getDate())}
              </span>
            </div>
            <div className="nav-buttons">
              <button className="nav-btn" onClick={() => navigate(-1)} title="Previous">
                ‹
              </button>
              <button className="nav-btn today-btn" onClick={goToToday}>
                Today
              </button>
              <button className="nav-btn" onClick={() => navigate(1)} title="Next">
                ›
              </button>
            </div>
          </div>

          <div className="header-right">
            <div className="view-switcher">
              <button
                className={`view-btn ${view === "month" ? "active" : ""}`}
                onClick={() => setView("month")}
              >
                Month
              </button>
              <button
                className={`view-btn ${view === "week" ? "active" : ""}`}
                onClick={() => setView("week")}
              >
                Week
              </button>
            </div>

            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              className="add-task-btn"
              onClick={() => {
                setEditingTask(null);
                setShowModal(true);
              }}
            >
              <span>+</span> Add Task
            </button>
          </div>
        </header>

        {/* Calendar Area */}
        <div className="calendar-area">
          {view === "month" ? (
            <MonthView
              days={monthDays}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              getTasksForDate={getTasksForDate}
              getCategoryColor={getCategoryColor}
              onTaskClick={(task) => {
                setEditingTask(task);
                setShowModal(true);
              }}
              onDateDoubleClick={(d) => {
                setSelectedDate(d);
                setEditingTask(null);
                setShowModal(true);
              }}
              toggleComplete={toggleComplete}
            />
          ) : (
            <WeekView
              days={weekDays}
              getTasksForDate={getTasksForDate}
              getCategoryColor={getCategoryColor}
              onTaskClick={(task) => {
                setEditingTask(task);
                setShowModal(true);
              }}
              onCellClick={(d) => {
                setSelectedDate(d);
                setEditingTask(null);
                setShowModal(true);
              }}
              toggleComplete={toggleComplete}
            />
          )}
        </div>
      </main>

      {/* ===== TASK MODAL ===== */}
      {showModal && (
        <TaskModal
          task={editingTask}
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSave={(data) => {
            if (editingTask) {
              updateTask(editingTask.id, data);
            } else {
              addTask(data);
            }
            setShowModal(false);
          }}
          onDelete={
            editingTask
              ? () => {
                  deleteTask(editingTask.id);
                  setShowModal(false);
                }
              : null
          }
          onToggleComplete={
            editingTask
              ? () => {
                  toggleComplete(editingTask.id);
                  setShowModal(false);
                }
              : null
          }
        />
      )}

      {/* ===== TOASTS ===== */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MINI CALENDAR COMPONENT ───────────────────────────
function MiniCalendar({ currentDate, selectedDate, onSelect, tasks }) {
  const [miniDate, setMiniDate] = useState(new Date(currentDate));

  useEffect(() => {
    setMiniDate(new Date(currentDate));
  }, [currentDate]);

  const days = useMemo(
    () => getMonthDays(miniDate.getFullYear(), miniDate.getMonth()),
    [miniDate]
  );

  const today = new Date();

  const hasTasksOnDate = (date) => {
    const dateStr = formatDate(date);
    return tasks.some((t) => t.date === dateStr);
  };

  return (
    <div className="mini-calendar">
      <div className="mini-cal-header">
        <span className="mini-cal-title">
          {MONTHS[miniDate.getMonth()].slice(0, 3)} {miniDate.getFullYear()}
        </span>
        <div className="mini-cal-nav">
          <button
            onClick={() => {
              const d = new Date(miniDate);
              d.setMonth(d.getMonth() - 1);
              setMiniDate(d);
            }}
          >
            ‹
          </button>
          <button
            onClick={() => {
              const d = new Date(miniDate);
              d.setMonth(d.getMonth() + 1);
              setMiniDate(d);
            }}
          >
            ›
          </button>
        </div>
      </div>
      <div className="mini-cal-grid">
        {DAYS.map((d) => (
          <div key={d} className="mini-cal-day-name">
            {d.charAt(0)}
          </div>
        ))}
        {days.map((day, i) => (
          <button
            key={i}
            className={`mini-cal-day${day.otherMonth ? " other-month" : ""}${isSameDay(day.date, today) ? " today" : ""}${isSameDay(day.date, selectedDate) && !isSameDay(day.date, today) ? " selected" : ""}${hasTasksOnDate(day.date) ? " has-tasks" : ""}`}
            onClick={() => onSelect(day.date)}
          >
            {day.date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MONTH VIEW COMPONENT ─────────────────────────────
function MonthView({
  days,
  selectedDate,
  onSelectDate,
  getTasksForDate,
  getCategoryColor,
  onTaskClick,
  onDateDoubleClick,
  toggleComplete,
}) {
  const today = new Date();

  return (
    <div className="month-grid">
      {DAYS.map((d) => (
        <div key={d} className="day-name-header">
          {d}
        </div>
      ))}
      {days.map((day, i) => {
        const dayTasks = getTasksForDate(day.date);
        const isToday = isSameDay(day.date, today);
        const isSelected = isSameDay(day.date, selectedDate);

        return (
          <div
            key={i}
            className={`calendar-day${day.otherMonth ? " other-month" : ""}${isToday ? " today" : ""}${isSelected ? " selected" : ""}`}
            onClick={() => onSelectDate(day.date)}
            onDoubleClick={() => onDateDoubleClick(day.date)}
          >
            <div className="day-number">{day.date.getDate()}</div>
            <div className="day-tasks">
              {dayTasks.slice(0, 3).map((task) => (
                <button
                  key={task.id}
                  className={`day-task-pill${task.completed ? " completed" : ""}`}
                  style={{ background: getCategoryColor(task.category) }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task);
                  }}
                  title={task.title}
                >
                  {task.title}
                </button>
              ))}
              {dayTasks.length > 3 && (
                <div className="day-more-tasks">+{dayTasks.length - 3} more</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── WEEK VIEW COMPONENT ──────────────────────────────
function WeekView({
  days,
  getTasksForDate,
  getCategoryColor,
  onTaskClick,
  onCellClick,
  toggleComplete,
}) {
  const today = new Date();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="week-grid">
      {/* Header row */}
      <div className="week-header-spacer"></div>
      {days.map((d, i) => (
        <div
          key={i}
          className={`week-day-header${isSameDay(d, today) ? " today" : ""}`}
        >
          <div className="week-day-name">{DAYS[d.getDay()]}</div>
          <div className="week-day-num">{d.getDate()}</div>
        </div>
      ))}

      {/* Time slots */}
      {hours.map((hour) => (
        <div key={hour} style={{ display: 'contents' }}>
          <div className="time-slot-label">
            {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
          </div>
          {days.map((d, di) => {
            const dayTasks = getTasksForDate(d);
            const hourTasks = dayTasks.filter((t) => {
              if (!t.time) return hour === 9; // default to 9 AM
              const h = parseInt(t.time.split(":")[0]);
              return h === hour;
            });

            return (
              <div
                key={di}
                className={`week-cell${isSameDay(d, today) ? " today" : ""}`}
                onClick={() => onCellClick(d)}
              >
                {hourTasks.map((task) => (
                  <button
                    key={task.id}
                    className={`day-task-pill${task.completed ? " completed" : ""}`}
                    style={{ background: getCategoryColor(task.category), fontSize: "0.6rem" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    title={task.title}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── TASK MODAL COMPONENT ──────────────────────────────
function TaskModal({ task, selectedDate, onClose, onSave, onDelete, onToggleComplete }) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [date, setDate] = useState(task?.date || formatDate(selectedDate));
  const [time, setTime] = useState(task?.time || "");
  const [category, setCategory] = useState(task?.category || "work");
  const [priority, setPriority] = useState(task?.priority || "medium");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description, date, time, category, priority });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{task ? "Edit Task" : "New Task"}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input
                type="time"
                className="form-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <div className="priority-selector">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`priority-option ${p} ${priority === p ? "active" : ""}`}
                  onClick={() => setPriority(p)}
                >
                  {p === "high" ? "🔴" : p === "medium" ? "🟡" : "🟢"} {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            {onDelete && (
              <button type="button" className="btn-danger" onClick={onDelete}>
                Delete
              </button>
            )}
            {onToggleComplete && (
              <button type="button" className="btn-secondary" onClick={onToggleComplete}>
                {task?.completed ? "Mark Incomplete" : "Mark Complete"}
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {task ? "Update" : "Create"} Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
