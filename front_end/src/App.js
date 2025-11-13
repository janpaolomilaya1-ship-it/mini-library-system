// App.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) setUser(data.user);
          else logout();
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const register = async (name, email, password, role = 'user') => {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const LoginPage = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (!result.success) setError(result.message || 'Login failed');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <div className="logo">📚</div>
          <h1>Digital Library</h1>
          <p className="subtitle">Sign in to your account</p>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary">
            Sign In
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? 
            <span className="link" onClick={onSwitchToRegister}> Create one</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const RegisterPage = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) return setError('All fields are required');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    const result = await register(name, email, password, role);
    if (!result.success) setError(result.message || 'Registration failed');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <div className="logo">📚</div>
          <h1>Digital Library</h1>
          <p className="subtitle">Create your account</p>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              placeholder="Enter your name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Minimum 6 characters" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Account Type</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User (View Only)</option>
              <option value="admin">Admin (Full Access)</option>
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary">
            Create Account
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? 
            <span className="link" onClick={onSwitchToLogin}> Sign in</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [books, setBooks] = useState([]);
  const [formData, setFormData] = useState({ title: '', author: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const { token, logout, user } = useAuth();

  const fetchBooks = () => {
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => setBooks(data))
      .catch(err => console.error('Error fetching books:', err));
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData),
    })
      .then(res => res.json())
      .then(() => {
        setFormData({ title: '', author: '', description: '' });
        setShowForm(false);
        fetchBooks();
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      fetch(`http://localhost:5000/api/books/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(() => fetchBooks());
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="nav-left">
            <span className="logo">📚</span>
            <span className="brand">Digital Library</span>
          </div>
          <div className="nav-right">
            <span className="user-badge admin">Admin</span>
            <span className="user-name">{user?.name}</span>
            <button onClick={logout} className="btn btn-logout">Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="page-header">
          <div>
            <h2>Library Management</h2>
            <p className="page-subtitle">Manage your book collection</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? '✕ Cancel' : '+ Add Book'}
          </button>
        </div>

        {showForm && (
          <div className="card add-book-card">
            <h3>Add New Book</h3>
            <form onSubmit={handleSubmit} className="book-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Book Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    placeholder="Enter book title" 
                    value={formData.title} 
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Author</label>
                  <input 
                    type="text" 
                    name="author" 
                    placeholder="Enter author name" 
                    value={formData.author} 
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  name="description" 
                  placeholder="Enter book description" 
                  value={formData.description} 
                  onChange={handleChange}
                  rows="3"
                />
              </div>
              <button type="submit" className="btn btn-primary">Save Book</button>
            </form>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h3>All Books</h3>
            <span className="badge">{books.length} books</span>
          </div>
          
          {books.length === 0 ? (
            <div className="empty-state">
              <p>📚 No books in the library yet.</p>
              <p className="empty-subtitle">Add your first book to get started!</p>
            </div>
          ) : (
            <div className="book-grid">
              {books.map((book) => (
                <div key={book._id} className="book-card">
                  <div className="book-card-header">
                    <h4>{book.title}</h4>
                    <button onClick={() => handleDelete(book._id)} className="btn-icon" title="Delete book">
                      🗑️
                    </button>
                  </div>
                  <p className="book-author">by {book.author || "Unknown Author"}</p>
                  <p className="book-description">{book.description || "No description available"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { logout, user } = useAuth();

  useEffect(() => {
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => setBooks(data));
  }, []);

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="nav-left">
            <span className="logo">📚</span>
            <span className="brand">Digital Library</span>
          </div>
          <div className="nav-right">
            <span className="user-badge">User</span>
            <span className="user-name">{user?.name}</span>
            <button onClick={logout} className="btn btn-logout">Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="page-header">
          <div>
            <h2>Browse Library</h2>
            <p className="page-subtitle">Explore our collection of books</p>
          </div>
        </div>

        <div className="search-bar">
          <input 
            type="text" 
            placeholder="🔍 Search books by title or author..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Available Books</h3>
            <span className="badge">{filteredBooks.length} books</span>
          </div>
          
          {filteredBooks.length === 0 ? (
            <div className="empty-state">
              <p>📚 {searchTerm ? 'No books found matching your search.' : 'No books available yet.'}</p>
            </div>
          ) : (
            <div className="book-grid">
              {filteredBooks.map((book) => (
                <div key={book._id} className="book-card user-view">
                  <h4>{book.title}</h4>
                  <p className="book-author">by {book.author || "Unknown Author"}</p>
                  <p className="book-description">{book.description || "No description available"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [showLogin, setShowLogin] = useState(true);
  const { user } = useAuth();

  if (!user) {
    return showLogin ? (
      <LoginPage onSwitchToRegister={() => setShowLogin(false)} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setShowLogin(true)} />
    );
  }

  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
};

export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}