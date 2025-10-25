import React, { useState, useEffect, createContext, useContext } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  LogOut,
  Folder,
  CheckCircle,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import "./App.css";

// Types
interface User {
  userId: number;
  username: string;
  email: string;
}

interface AuthResponse {
  userId: number;
  username: string;
  email: string;
  token: string;
  expiresAt: string;
}

interface Project {
  id: number;
  title: string;
  description?: string;
  createdDate: string;
  taskCount: number;
  completedTaskCount: number;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  completedDate?: string;
  projectId: number;
  projectTitle: string;
  createdDate: string;
}

// API Configuration
const API_BASE_URL = "http://localhost:5293/api";

// Auth Context
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// API Service
const api = {
  async register(
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }
    return response.json();
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }
    return response.json();
  },

  async getProjects(token: string): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch projects");
    return response.json();
  },

  async createProject(
    token: string,
    title: string,
    description?: string
  ): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description }),
    });
    if (!response.ok) throw new Error("Failed to create project");
    return response.json();
  },

  async deleteProject(token: string, projectId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to delete project");
  },

  async getProjectTasks(token: string, projectId: number): Promise<Task[]> {
    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/tasks`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch tasks");
    return response.json();
  },

  async createTask(
    token: string,
    projectId: number,
    title: string,
    description?: string,
    dueDate?: string
  ): Promise<Task> {
    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/tasks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, dueDate }),
      }
    );
    if (!response.ok) throw new Error("Failed to create task");
    return response.json();
  },

  async updateTask(
    token: string,
    taskId: number,
    title: string,
    description: string,
    dueDate: string | null,
    isCompleted: boolean
  ): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, dueDate, isCompleted }),
    });
    if (!response.ok) throw new Error("Failed to update task");
    return response.json();
  },

  async deleteTask(token: string, taskId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to delete task");
  },
};

// Get today's date in YYYY-MM-DD format for min attribute
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Auth Page Component
const AuthPage: React.FC<{ onAuthSuccess: () => void }> = ({
  onAuthSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const validate = () => {
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }
    if (!isLogin && (!email || !email.includes("@"))) {
      setError("Please enter a valid email");
      return false;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const response = isLogin
        ? await api.login(username, password)
        : await api.register(username, email, password);

      login(response.token, {
        userId: response.userId,
        username: response.username,
        email: response.email,
      });
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-icon">
          <Folder size={40} color="white" />
        </div>
        <h1 className="auth-title">Project Manager</h1>
        <p className="auth-subtitle">
          {isLogin ? "Welcome back!" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="Enter username"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter email"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter password"
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="link-btn"
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  loading,
}) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 340 }}
      >
        <div className="modal-header" style={{ marginBottom: 0 }}>
          <h2 className="modal-title">Confirm Deletion</h2>
        </div>
        <p
          style={{
            margin: "2rem 0",
            color: "var(--gray-700)",
            textAlign: "center",
          }}
        >
          {message}
        </p>
        <div className="modal-actions">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard: React.FC<{ onSelectProject: (id: number) => void }> = ({
  onSelectProject,
}) => {
  const { token, user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // For confirm modal
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    projectId: null as number | null,
    loading: false,
  });

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line
  }, []);

  const loadProjects = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await api.getProjects(token);
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  // Show modal instead of window.confirm
  const promptDelete = (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ open: true, projectId, loading: false });
  };

  const confirmDelete = async () => {
    setConfirmModal((cm) => ({ ...cm, loading: true }));
    if (!token || confirmModal.projectId === null) return;
    try {
      await api.deleteProject(token, confirmModal.projectId);
      setProjects(projects.filter((p) => p.id !== confirmModal.projectId));
      setConfirmModal({ open: false, projectId: null, loading: false });
    } catch (err) {
      alert("Failed to delete project");
      setConfirmModal({ open: false, projectId: null, loading: false });
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={confirmModal.open}
        message="Are you sure you want to delete this project?"
        loading={confirmModal.loading}
        onConfirm={confirmDelete}
        onCancel={() =>
          setConfirmModal({ open: false, projectId: null, loading: false })
        }
      />

      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-icon">
              <Folder size={24} color="white" />
            </div>
            <h1 className="header-title">Project Manager</h1>
          </div>
          <div className="header-actions">
            <div className="user-info">
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, color: "var(--gray-700)" }}>
                {user?.username}
              </span>
            </div>
            <button onClick={logout} className="icon-btn danger">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title">My Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Folder size={40} color="var(--gray-400)" />
            </div>
            <h3 className="empty-title">No projects yet</h3>
            <p className="empty-description">
              Create your first project to get started
            </p>
          </div>
        ) : (
          <div className="card-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card"
                onClick={() => onSelectProject(project.id)}
              >
                <div className="card-header">
                  <h3 className="card-title">{project.title}</h3>
                  <button
                    onClick={(e) => promptDelete(project.id, e)}
                    className="icon-btn danger"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {project.description && (
                  <p className="card-description">{project.description}</p>
                )}
                <div className="card-stats">
                  <div className="stat-item">
                    <CheckCircle size={18} />
                    <span>
                      {project.completedTaskCount} / {project.taskCount} tasks
                    </span>
                  </div>
                  <div className="stat-item">
                    <Calendar size={18} />
                    <span>
                      {new Date(project.createdDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {project.taskCount > 0 && (
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${
                          (project.completedTaskCount / project.taskCount) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadProjects();
          }}
        />
      )}
    </>
  );
};

// Create Project Modal
const CreateProjectModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title || title.length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }

    if (!token) return;
    setLoading(true);
    try {
      await api.createProject(token, title, description || undefined);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Project</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Enter project title"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input form-textarea"
              placeholder="Enter project description"
            ></textarea>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProjectDetails: React.FC<{ projectId: number; onBack: () => void }> = ({
  projectId,
  onBack,
}) => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);

  // MODAL STATE FOR CONFIRM DELETE
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    taskId: null as number | null,
    loading: false,
  });

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await api.getProjectTasks(token, projectId);
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!token) return;
    try {
      const updated = await api.updateTask(
        token,
        task.id,
        task.title,
        task.description || "",
        task.dueDate || null,
        !task.isCompleted
      );
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      alert("Failed to update task");
    }
  };

  // Instead of window.confirm, show modal
  const promptDeleteTask = (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ open: true, taskId, loading: false });
  };

  const confirmDeleteTask = async () => {
    setConfirmModal((cm) => ({ ...cm, loading: true }));
    if (!token || confirmModal.taskId === null) return;
    try {
      await api.deleteTask(token, confirmModal.taskId);
      setTasks(tasks.filter((t) => t.id !== confirmModal.taskId));
      setConfirmModal({ open: false, taskId: null, loading: false });
    } catch (err) {
      alert("Failed to delete task");
      setConfirmModal({ open: false, taskId: null, loading: false });
    }
  };

  const projectTitle = tasks[0]?.projectTitle || "Project Details";

  return (
    <>
      {/* Modal: place once in your component */}
      <ConfirmModal
        isOpen={confirmModal.open}
        message="Are you sure you want to delete this task?"
        loading={confirmModal.loading}
        onConfirm={confirmDeleteTask}
        onCancel={() =>
          setConfirmModal({ open: false, taskId: null, loading: false })
        }
      />
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-icon">
              <Folder size={24} color="white" />
            </div>
            <h1 className="header-title">{projectTitle}</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
        <button onClick={onBack} className="back-btn">
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="page-header">
          <h2 className="page-title">Tasks</h2>
          

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus size={20} />
            New Task
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CheckCircle size={40} color="var(--gray-400)" />
            </div>
            <h3 className="empty-title">No tasks yet</h3>
            <p className="empty-description">
              Create your first task to get started
            </p>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => {
              const isOverdue =
                !task.isCompleted &&
                task.dueDate &&
                new Date(task.dueDate) < new Date();

              return (
                <div
                  key={task.id}
                  className={`task-item ${task.isCompleted ? "completed" : ""}`}
                >
                  <div
                    className={`task-checkbox ${
                      task.isCompleted ? "checked" : ""
                    }`}
                    onClick={() => handleToggleComplete(task)}
                  >
                    {task.isCompleted && (
                      <CheckCircle size={20} color="white" />
                    )}
                  </div>
                  <div className="task-content">
                    <div
                      className={`task-title ${
                        task.isCompleted ? "completed" : ""
                      }`}
                    >
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="task-description">{task.description}</div>
                    )}
                    <div className="task-meta">
                      {task.dueDate && (
                        <>
                          <Calendar size={14} />
                          <span>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      {isOverdue && (
                        <span
                          className="badge badge-danger"
                          style={{ marginLeft: "0.5rem" }}
                        >
                          Missed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="icon-btn"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => promptDeleteTask(task.id, e)}
                      className="icon-btn danger"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTasks();
          }}
        />
      )}
      {showScheduler && (
        <SchedulerModal
          isOpen={showScheduler}
          onClose={() => setShowScheduler(false)}
          projectId={projectId}
          token={token ?? ""}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null);
            loadTasks();
          }}
        />
      )}
    </>
  );
};

interface SchedulerTask {
  title: string;
  estimatedHours: number;
  dueDate: string;
  dependencies: string[];
}
interface SchedulerResult {
  recommendedOrder: string[];
  errorMessage?: string;
}
interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  token: string;
}

const SchedulerModal: React.FC<SchedulerModalProps> = ({
  isOpen,
  onClose,
  projectId,
  token,
}) => {
  const [tasks, setTasks] = React.useState<SchedulerTask[]>([]);
  const [input, setInput] = React.useState<{
    title: string;
    hours: string;
    date: string;
    dependencies: string;
  }>({ title: "", hours: "", date: "", dependencies: "" });
  const [result, setResult] = React.useState<SchedulerResult | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const addTask = () => {
    if (!input.title.trim() || !input.hours.trim() || !input.date.trim())
      return;
    setTasks([
      ...tasks,
      {
        title: input.title,
        estimatedHours: Number(input.hours),
        dueDate: input.date,
        dependencies: input.dependencies
          .split(",")
          .map((dep) => dep.trim())
          .filter((dep) => dep),
      },
    ]);
    setInput({ title: "", hours: "", date: "", dependencies: "" });
  };

  const removeTask = (idx: number) =>
    setTasks(tasks.filter((_, i) => i !== idx));

  const runScheduler = async () => {
    setLoading(true);
    setApiError(null);
    setResult(null);
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tasks }),
      });
      const data = await response.json();
      if (!response.ok) {
        setApiError(data.errorMessage || "API error occurred.");
        setLoading(false);
        return;
      }
      setResult(data);
    } catch {
      setApiError("Network or server error.");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 600, width: "100%" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Smart Scheduler</h2>
        </div>
        <div>
          <h4 style={{ marginTop: 0 }}>Define Project Tasks</h4>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "1.2rem",
            }}
          >
            <input
              placeholder="Title"
              className="form-input"
              style={{ flex: 2 }}
              value={input.title}
              onChange={(e) => setInput({ ...input, title: e.target.value })}
            />
            <input
              placeholder="Hours"
              type="number"
              className="form-input"
              style={{ width: 85 }}
              value={input.hours}
              onChange={(e) => setInput({ ...input, hours: e.target.value })}
            />
            <input
              placeholder="Due date"
              type="date"
              className="form-input"
              style={{ width: 150 }}
              value={input.date}
              onChange={(e) => setInput({ ...input, date: e.target.value })}
            />
            <input
              placeholder="Dependencies (comma-separated)"
              className="form-input"
              style={{ flex: 2 }}
              value={input.dependencies}
              onChange={(e) =>
                setInput({ ...input, dependencies: e.target.value })
              }
            />
            <button className="btn btn-primary" type="button" onClick={addTask}>
              <Plus size={16} />
              Add
            </button>
          </div>
          {tasks.length > 0 && (
            <div style={{ marginBottom: "1.4rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ padding: "0.5rem", textAlign: "left" }}>
                      Title
                    </th>
                    <th>Hours</th>
                    <th>Due Date</th>
                    <th>Dependencies</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "0.4rem 0.5rem" }}>{t.title}</td>
                      <td style={{ textAlign: "center" }}>
                        {t.estimatedHours}
                      </td>
                      <td style={{ textAlign: "center" }}>{t.dueDate}</td>
                      <td style={{ fontSize: "0.95em", color: "#6b7280" }}>
                        {t.dependencies.join(", ")}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-btn danger"
                          aria-label="Remove"
                          onClick={() => removeTask(idx)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "1.5rem",
              alignItems: "center",
            }}
          >
            <button
              className="btn btn-primary"
              onClick={runScheduler}
              disabled={loading || tasks.length === 0}
            >
              {loading ? "Scheduling..." : "Get Recommended Order"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
          </div>
          {apiError && (
            <div className="alert alert-error" style={{ marginTop: "1rem" }}>
              {apiError}
            </div>
          )}
          {result && (
            <div style={{ marginTop: "2rem" }}>
              <h4 style={{ margin: "0 0 1rem 0" }}>
                Recommended Task Execution Order:
              </h4>
              <ol>
                {result.recommendedOrder.map((title, i) => (
                  <li
                    key={i}
                    style={{ fontWeight: 600, marginBottom: "0.3rem" }}
                  >
                    <CheckCircle size={15} /> {title}
                  </li>
                ))}
              </ol>
              {result.errorMessage && (
                <div className="alert alert-error">{result.errorMessage}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Create Task Modal
const CreateTaskModal: React.FC<{
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ projectId, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title || title.length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }

    if (!token) return;
    setLoading(true);
    try {
      await api.createTask(
        token,
        projectId,
        title,
        description || undefined,
        dueDate || undefined
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Task</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Enter task title"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input form-textarea"
              placeholder="Enter task description"
            ></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={getTodayDate()}
              className="form-input"
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Task Modal
const EditTaskModal: React.FC<{
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ task, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.split("T")[0] : ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title || title.length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }

    if (!token) return;
    setLoading(true);
    try {
      await api.updateTask(
        token,
        task.id,
        title,
        description,
        dueDate || null,
        task.isCompleted
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Task</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Enter task title"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input form-textarea"
              placeholder="Enter task description"
            ></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={getTodayDate()}
              className="form-input"
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<
    "auth" | "dashboard" | "project"
  >("auth");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      setCurrentView("dashboard");
    } else {
      setCurrentView("auth");
    }
  }, [token]);

  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setCurrentView("project");
  };

  const handleBackToDashboard = () => {
    setSelectedProjectId(null);
    setCurrentView("dashboard");
  };

  return (
    <div>
      {currentView === "auth" && (
        <AuthPage onAuthSuccess={() => setCurrentView("dashboard")} />
      )}
      {currentView === "dashboard" && (
        <Dashboard onSelectProject={handleSelectProject} />
      )}
      {currentView === "project" && selectedProjectId && (
        <ProjectDetails
          projectId={selectedProjectId}
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  );
};

// Root Component with Provider
const Root: React.FC = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default Root;
