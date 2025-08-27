// TNTT Student Management System - Frontend Application
// Cloud-based architecture with REST API integration

// Configuration
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://tntt-backend-wandering-mountain-2009.fly.dev/api',
    TOKEN_KEY: 'tntt_token',
    USER_KEY: 'tntt_user',
    REQUEST_TIMEOUT: 10000
};

// API Service Layer
class APIService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.token = localStorage.getItem(CONFIG.TOKEN_KEY);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = { message: await response.text() };
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Yêu cầu bị timeout');
            }
            throw error;
        }
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem(CONFIG.TOKEN_KEY, token);
        } else {
            localStorage.removeItem(CONFIG.TOKEN_KEY);
        }
    }

    // Auth endpoints
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(data.token);
        return data;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.setToken(null);
            localStorage.removeItem(CONFIG.USER_KEY);
        }
    }

    async verifyToken() {
        return await this.request('/auth/verify');
    }

    // Students endpoints
    async getStudents() {
        return await this.request('/students');
    }

    async getStudent(id) {
        return await this.request(`/students/${id}`);
    }

    async createStudent(data) {
        return await this.request('/students', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateStudent(id, data) {
        return await this.request(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteStudent(id) {
        return await this.request(`/students/${id}`, {
            method: 'DELETE'
        });
    }

    // Users endpoints
    async getUsers() {
        return await this.request('/users');
    }

    async createUser(data) {
        return await this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateUser(id, data) {
        return await this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteUser(id) {
        return await this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Classes endpoints
    async getClasses() {
        return await this.request('/classes');
    }

    async createClass(data) {
        return await this.request('/classes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateClass(id, data) {
        return await this.request(`/classes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteClass(id) {
        return await this.request(`/classes/${id}`, {
            method: 'DELETE'
        });
    }

    // Scores endpoints
    async getScores() {
        return await this.request('/scores');
    }

    async getStudentScores(studentId) {
        return await this.request(`/scores/student/${studentId}`);
    }

    async createScore(data) {
        return await this.request('/scores', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateScore(id, data) {
        return await this.request(`/scores/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteScore(id) {
        return await this.request(`/scores/${id}`, {
            method: 'DELETE'
        });
    }

    // Health check
    async checkHealth() {
        try {
            await this.request('/health');
            return true;
        } catch {
            return false;
        }
    }
}

// Initialize API service
const api = new APIService();

// Application State
const state = {
    currentUser: null,
    currentPage: 'students',
    students: [],
    users: [],
    classes: [],
    scores: {},
    filters: {
        studentsClass: 'all',
        scoresClass: 'all',
        scoreType: 'GK1'
    },
    search: '',
    editingItem: null,
    isOnline: false
};

// Demo data for offline mode
const demoData = {
    users: [
        {
            id: "user_1",
            email: "admin@tntt.com",
            password: "admin123",
            role: "ADMIN",
            fullName: "Quản trị viên",
            assignedClasses: ["ALL"],
            avatar: "A"
        },
        {
            id: "user_2",
            email: "teacher1@tntt.com",
            password: "teacher123",
            role: "TEACHER",
            fullName: "Cô Maria Nguyễn",
            assignedClasses: ["TL3A", "TL3B"],
            avatar: "M"
        }
    ],
    students: [
        {
            id: "ST001",
            tenThanh: "Martin",
            hoDem: "Nguyễn Văn",
            ten: "An",
            lop: "TL3B",
            ngaySinh: "2010-03-15",
            ngayRuaToi: "2010-05-20",
            phuHuynh: "Nguyễn Văn Minh",
            giaoKhu: "Giáo khu A",
            sdt: "0901234567"
        },
        {
            id: "ST002",
            tenThanh: "Teresa",
            hoDem: "Trần Thị",
            ten: "Chi",
            lop: "TL3A",
            ngaySinh: "2010-02-20",
            ngayRuaToi: "2010-04-25",
            phuHuynh: "Trần Văn Bình",
            giaoKhu: "Giáo khu B",
            sdt: "0901234568"
        }
    ],
    classes: [
        { id: "TL3A", name: "Toán Lý 3A" },
        { id: "TL3B", name: "Toán Lý 3B" },
        { id: "SD1A", name: "Sinh Địa 1A" }
    ],
    scores: {
        "ST001": {
            "GK1": { score: 8.5, date: "2024-01-15" },
            "HK1": { score: 8.8, date: "2024-01-20" }
        }
    }
};

// Utility Functions
function showLoading(show = true) {
    const overlay = document.getElementById('loading-overlay');
    const submitBtn = document.getElementById('login-submit-btn');
    
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
    
    // Handle button loading states
    if (submitBtn) {
        if (show) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        } else {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toast-message');
    
    if (toast && messageEl) {
        messageEl.textContent = message;
        toast.className = `toast show toast--${type}`;
        
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('show');
        }, 4000);
    }
}

function updateConnectionStatus(isOnline) {
    state.isOnline = isOnline;
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');
    
    if (indicator && text) {
        if (isOnline) {
            indicator.className = 'status-indicator online';
            text.textContent = 'Đã kết nối';
        } else {
            indicator.className = 'status-indicator offline';
            text.textContent = 'Mất kết nối - Chế độ demo';
        }
    }
}

function generateId(prefix = 'ID') {
    return prefix + Date.now() + Math.floor(Math.random() * 1000);
}

function getInitials(tenThanh, hoDem, ten) {
    if (tenThanh) return tenThanh.charAt(0).toUpperCase();
    return (hoDem.charAt(0) + ten.charAt(0)).toUpperCase();
}

function getFullName(student) {
    return `${student.hoDem} ${student.ten}`;
}

function getAvatarColor(id) {
    const colors = ['avatar-color-1', 'avatar-color-2', 'avatar-color-3', 'avatar-color-4', 'avatar-color-5', 'avatar-color-6', 'avatar-color-7', 'avatar-color-8', 'avatar-color-9', 'avatar-color-10'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN');
}

// Authentication Management
class AuthManager {
    static async login(email, password) {
        try {
            if (!state.isOnline) {
                // Demo login for offline mode
                const user = demoData.users.find(u => u.email === email && u.password === password);
                if (user) {
                    const userData = { ...user };
                    delete userData.password;
                    state.currentUser = userData;
                    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(userData));
                    return userData;
                } else {
                    throw new Error('Email hoặc mật khẩu không chính xác');
                }
            }
            
            const response = await api.login(email, password);
            state.currentUser = response.user;
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
            return response.user;
        } catch (error) {
            throw error;
        }
    }

    static async logout() {
        try {
            if (state.isOnline) {
                await api.logout();
            }
        } finally {
            state.currentUser = null;
            localStorage.removeItem(CONFIG.USER_KEY);
            localStorage.removeItem(CONFIG.TOKEN_KEY);
        }
    }

    static getCurrentUser() {
        if (state.currentUser) return state.currentUser;
        
        const stored = localStorage.getItem(CONFIG.USER_KEY);
        if (stored) {
            try {
                state.currentUser = JSON.parse(stored);
                return state.currentUser;
            } catch {
                localStorage.removeItem(CONFIG.USER_KEY);
            }
        }
        
        return null;
    }

    static async verifySession() {
        try {
            if (!state.isOnline) return false;
            
            const response = await api.verifyToken();
            state.currentUser = response.user;
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
            return true;
        } catch {
            this.logout();
            return false;
        }
    }

    static hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        switch (permission) {
            case 'admin':
                return user.role === 'ADMIN';
            case 'teacher':
                return user.role === 'ADMIN' || user.role === 'TEACHER';
            case 'guest':
                return true;
            default:
                return false;
        }
    }
}

// Data Management
class DataManager {
    static async loadStudents() {
        try {
            if (!state.isOnline) {
                state.students = [...demoData.students];
                return;
            }
            
            const response = await api.getStudents();
            state.students = response.students || response;
        } catch (error) {
            showToast('Lỗi tải danh sách học sinh', 'error');
            console.error('Load students error:', error);
            // Fallback to demo data
            state.students = [...demoData.students];
        }
    }

    static async loadUsers() {
        try {
            if (!state.isOnline) {
                state.users = [...demoData.users];
                return;
            }
            
            const response = await api.getUsers();
            state.users = response.users || response;
        } catch (error) {
            showToast('Lỗi tải danh sách người dùng', 'error');
            console.error('Load users error:', error);
            state.users = [...demoData.users];
        }
    }

    static async loadClasses() {
        try {
            if (!state.isOnline) {
                state.classes = [...demoData.classes];
                return;
            }
            
            const response = await api.getClasses();
            state.classes = response.classes || response;
        } catch (error) {
            showToast('Lỗi tải danh sách lớp học', 'error');
            console.error('Load classes error:', error);
            state.classes = [...demoData.classes];
        }
    }

    static async loadScores() {
        try {
            if (!state.isOnline) {
                state.scores = { ...demoData.scores };
                return;
            }
            
            const response = await api.getScores();
            state.scores = response.scores || response;
        } catch (error) {
            showToast('Lỗi tải điểm số', 'error');
            console.error('Load scores error:', error);
            state.scores = { ...demoData.scores };
        }
    }

    static getFilteredStudents() {
        let filtered = [...state.students];
        const user = AuthManager.getCurrentUser();
        
        // Apply role-based filtering
        if (user && user.role === 'TEACHER' && user.assignedClasses && !user.assignedClasses.includes('ALL')) {
            filtered = filtered.filter(student => user.assignedClasses.includes(student.lop));
        }
        
        // Apply class filter
        if (state.filters.studentsClass !== 'all') {
            filtered = filtered.filter(student => student.lop === state.filters.studentsClass);
        }
        
        // Apply search filter
        if (state.search) {
            const searchTerm = state.search.toLowerCase();
            filtered = filtered.filter(student => {
                const fullName = getFullName(student).toLowerCase();
                const saintName = (student.tenThanh || '').toLowerCase();
                const studentId = (student.id || '').toLowerCase();
                return fullName.includes(searchTerm) || 
                       saintName.includes(searchTerm) || 
                       studentId.includes(searchTerm);
            });
        }
        
        return filtered;
    }

    static getClassName(classId) {
        const classItem = state.classes.find(c => c.id === classId);
        return classItem ? classItem.name : classId;
    }
}

// UI Management
class UIManager {
    static showLoginPage() {
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        
        if (loginPage && mainApp) {
            loginPage.classList.remove('hidden');
            mainApp.classList.add('hidden');
        }
    }

    static showMainApp() {
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        
        if (loginPage && mainApp) {
            loginPage.classList.add('hidden');
            mainApp.classList.remove('hidden');
            this.updateUserInfo();
            this.showPage('students');
        }
    }

    static updateUserInfo() {
        const user = AuthManager.getCurrentUser();
        if (!user) return;
        
        const roleEl = document.getElementById('user-role');
        const nameEl = document.getElementById('user-name');
        
        if (roleEl) roleEl.textContent = user.role;
        if (nameEl) nameEl.textContent = user.fullName;
        
        // Show/hide admin items
        const adminItems = document.querySelectorAll('.navbar__item--admin');
        adminItems.forEach(item => {
            item.classList.toggle('show', AuthManager.hasPermission('admin'));
        });
    }

    static showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        
        // Show selected page
        const page = document.getElementById(pageId + '-page');
        if (page) {
            page.classList.remove('hidden');
        }
        
        // Update navigation
        document.querySelectorAll('.navbar__item').forEach(item => {
            item.classList.remove('navbar__item--active');
        });
        
        const activeItem = document.querySelector(`[data-page="${pageId}"]`);
        if (activeItem) {
            activeItem.classList.add('navbar__item--active');
        }
        
        state.currentPage = pageId;
        
        // Load page content
        this.loadPageContent(pageId);
    }

    static async loadPageContent(pageId) {
        showLoading(true);
        
        try {
            switch(pageId) {
                case 'students':
                    await DataManager.loadStudents();
                    await DataManager.loadClasses();
                    this.renderStudentsPage();
                    break;
                case 'scores':
                    await DataManager.loadStudents();
                    await DataManager.loadClasses();
                    await DataManager.loadScores();
                    this.renderScoresPage();
                    break;
                case 'dashboard':
                    await Promise.all([
                        DataManager.loadStudents(),
                        DataManager.loadClasses(),
                        DataManager.loadScores()
                    ]);
                    this.renderDashboard();
                    break;
                case 'users':
                    if (AuthManager.hasPermission('admin')) {
                        await DataManager.loadUsers();
                        this.renderUsersPage();
                    }
                    break;
                case 'classes':
                    if (AuthManager.hasPermission('admin')) {
                        await DataManager.loadClasses();
                        this.renderClassesPage();
                    }
                    break;
            }
        } catch (error) {
            showToast('Lỗi tải dữ liệu trang', 'error');
            console.error('Load page error:', error);
        } finally {
            showLoading(false);
        }
    }

    // Students Page
    static renderStudentsPage() {
        this.renderStudentsFilter();
        this.renderStudentsGrid();
    }

    static renderStudentsFilter() {
        const container = document.getElementById('students-filter');
        if (!container) return;

        const user = AuthManager.getCurrentUser();
        let availableClasses = [...state.classes];
        let students = [...state.students];

        // Apply role-based filtering
        if (user && user.role === 'TEACHER' && user.assignedClasses && !user.assignedClasses.includes('ALL')) {
            availableClasses = availableClasses.filter(cls => user.assignedClasses.includes(cls.id));
            students = students.filter(student => user.assignedClasses.includes(student.lop));
        }

        const allCount = students.length;

        let buttonsHTML = `
            <button class="filter-btn ${state.filters.studentsClass === 'all' ? 'filter-btn--active' : ''}" data-class="all">
                Tất cả <span class="count">(${allCount})</span>
            </button>
        `;

        availableClasses.forEach(classData => {
            const count = students.filter(s => s.lop === classData.id).length;
            if (count > 0) {
                buttonsHTML += `
                    <button class="filter-btn ${state.filters.studentsClass === classData.id ? 'filter-btn--active' : ''}" data-class="${classData.id}">
                        ${classData.name} <span class="count">(${count})</span>
                    </button>
                `;
            }
        });

        container.innerHTML = buttonsHTML;
    }

    static renderStudentsGrid() {
        const filtered = DataManager.getFilteredStudents();
        const container = document.getElementById('students-grid');
        const noResults = document.getElementById('students-no-results');

        if (!container || !noResults) return;

        if (filtered.length === 0) {
            container.classList.add('hidden');
            noResults.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        noResults.classList.add('hidden');

        const studentsHTML = filtered.map(student => `
            <div class="student-card" data-student-id="${student.id}">
                <div class="student-card__avatar ${getAvatarColor(student.id)}">
                    ${getInitials(student.tenThanh, student.hoDem, student.ten)}
                </div>
                <div class="student-card__info">
                    <div class="student-card__name">${student.tenThanh} ${getFullName(student)}</div>
                    <div class="student-card__class">${DataManager.getClassName(student.lop)}</div>
                    <div class="student-card__details">
                        <div class="student-card__id">${student.id}</div>
                        <div>${student.giaoKhu}</div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = studentsHTML;
    }

    // Dashboard (simplified for demo)
    static renderDashboard() {
        const totalStudents = state.students.length;
        const totalClasses = state.classes.length;
        const excellentCount = Math.floor(totalStudents * 0.3); // Demo calculation

        const elements = {
            'total-students': totalStudents,
            'total-classes': totalClasses,
            'excellent-students': excellentCount
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });

        // Simple chart rendering for demo
        setTimeout(() => {
            this.renderSimpleCharts();
        }, 100);
    }

    static renderSimpleCharts() {
        const ctx1 = document.getElementById('class-distribution-chart');
        const ctx2 = document.getElementById('district-distribution-chart');

        if (ctx1) {
            const existingChart = Chart.getChart(ctx1);
            if (existingChart) existingChart.destroy();

            const classData = {};
            state.students.forEach(student => {
                const className = DataManager.getClassName(student.lop);
                classData[className] = (classData[className] || 0) + 1;
            });

            new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: Object.keys(classData),
                    datasets: [{
                        label: 'Số học sinh',
                        data: Object.values(classData),
                        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }

        if (ctx2) {
            const existingChart = Chart.getChart(ctx2);
            if (existingChart) existingChart.destroy();

            const districtData = {};
            state.students.forEach(student => {
                districtData[student.giaoKhu] = (districtData[student.giaoKhu] || 0) + 1;
            });

            new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(districtData),
                    datasets: [{
                        data: Object.values(districtData),
                        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    // Users Page (simplified)
    static renderUsersPage() {
        if (!AuthManager.hasPermission('admin')) {
            const container = document.getElementById('users-grid');
            if (container) {
                container.innerHTML = '<p>Bạn không có quyền truy cập trang này.</p>';
            }
            return;
        }

        const container = document.getElementById('users-grid');
        if (!container) return;

        const usersHTML = state.users.map(user => `
            <div class="user-card">
                <div class="user-card__header">
                    <div class="user-card__avatar">
                        ${user.avatar || user.fullName.charAt(0)}
                    </div>
                    <div class="user-card__info">
                        <div class="user-card__name">${user.fullName}</div>
                        <div class="user-card__email">${user.email}</div>
                    </div>
                </div>
                <div class="user-card__role">
                    <span class="status ${user.role === 'ADMIN' ? 'status--error' : 'status--success'}">
                        ${user.role}
                    </span>
                </div>
            </div>
        `).join('');

        container.innerHTML = usersHTML;
    }

    // Classes Page (simplified)
    static renderClassesPage() {
        if (!AuthManager.hasPermission('admin')) {
            const container = document.getElementById('classes-grid');
            if (container) {
                container.innerHTML = '<p>Bạn không có quyền truy cập trang này.</p>';
            }
            return;
        }

        const container = document.getElementById('classes-grid');
        if (!container) return;

        const classesHTML = state.classes.map(classItem => {
            const studentCount = state.students.filter(s => s.lop === classItem.id).length;

            return `
                <div class="class-card">
                    <div class="class-card__header">
                        <div class="class-card__icon">
                            ${classItem.name.charAt(0)}
                        </div>
                        <div class="class-card__info">
                            <div class="class-card__name">${classItem.name}</div>
                        </div>
                    </div>
                    <div class="class-card__stats">
                        <strong>Số học sinh:</strong> ${studentCount}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = classesHTML;
    }
}

// Event Listeners Setup
function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted');
            
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            
            if (!emailInput || !passwordInput) {
                console.error('Login inputs not found');
                return;
            }
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (email && password) {
                try {
                    showLoading(true);
                    console.log('Attempting login for:', email);
                    
                    const user = await AuthManager.login(email, password);
                    console.log('Login successful:', user);
                    
                    showToast(`Chào mừng ${user.fullName}!`, 'success');
                    
                    setTimeout(() => {
                        UIManager.showMainApp();
                    }, 500);
                } catch (error) {
                    console.error('Login error:', error);
                    showToast('Đăng nhập thất bại: ' + error.message, 'error');
                } finally {
                    showLoading(false);
                }
            } else {
                showToast('Vui lòng nhập email và mật khẩu', 'error');
            }
        });
    } else {
        console.error('Login form not found');
    }

    // Demo account buttons
    const demoButtons = document.querySelectorAll('.demo-btn');
    console.log('Found demo buttons:', demoButtons.length);
    
    demoButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Demo button clicked');
            
            const email = e.target.getAttribute('data-email');
            const password = e.target.getAttribute('data-password');
            
            console.log('Demo credentials:', email, password);
            
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            
            if (emailInput && passwordInput && email && password) {
                emailInput.value = email;
                passwordInput.value = password;
                console.log('Demo credentials filled');
            } else {
                console.error('Failed to fill demo credentials');
            }
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await AuthManager.logout();
                UIManager.showLoginPage();
                showToast('Đã đăng xuất thành công!', 'success');
            } catch (error) {
                showToast('Lỗi khi đăng xuất', 'error');
            }
        });
    }

    // Navigation
    document.querySelectorAll('.navbar__item').forEach(item => {
        item.addEventListener('click', (e) => {
            const page = e.target.getAttribute('data-page');
            if (page) {
                console.log('Navigating to page:', page);
                UIManager.showPage(page);
            }
        });
    });

    // Search
    const searchInput = document.getElementById('students-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.search = e.target.value;
            UIManager.renderStudentsGrid();
        });
    }

    // Event delegation for dynamic content
    document.addEventListener('click', (e) => {
        // Student cards
        if (e.target.closest('.student-card')) {
            const studentCard = e.target.closest('.student-card');
            const studentId = studentCard.getAttribute('data-student-id');
            console.log('Student card clicked:', studentId);
            // For demo, just show toast
            showToast(`Xem chi tiết học sinh ${studentId}`, 'info');
        }

        // Filter buttons
        if (e.target.closest('.filter-btn')) {
            const filterBtn = e.target.closest('.filter-btn');
            const classFilter = filterBtn.getAttribute('data-class');
            console.log('Filter button clicked:', classFilter);
            
            if (e.target.closest('#students-filter')) {
                state.filters.studentsClass = classFilter;
                UIManager.renderStudentsPage();
            }
        }
    });

    // Toast close
    const toastClose = document.getElementById('toast-close');
    if (toastClose) {
        toastClose.addEventListener('click', () => {
            document.getElementById('toast').classList.add('hidden');
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });

    console.log('Event listeners setup complete');
}

// Connection monitoring
async function checkConnection() {
    try {
        const isOnline = await api.checkHealth();
        updateConnectionStatus(isOnline);
        return isOnline;
    } catch (error) {
        updateConnectionStatus(false);
        return false;
    }
}

// Initialize Application
async function init() {
    console.log('Initializing TNTT Management System...');

    // Setup event listeners first
    setupEventListeners();

    // Check connection
    const isOnline = await checkConnection();
    console.log('Connection status:', isOnline);

    // Check authentication
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    const storedUser = localStorage.getItem(CONFIG.USER_KEY);
    
    if (token && storedUser && isOnline) {
        const isValid = await AuthManager.verifySession();
        if (isValid) {
            console.log('Valid session found, showing main app');
            UIManager.showMainApp();
        } else {
            console.log('Invalid session, showing login page');
            UIManager.showLoginPage();
        }
    } else {
        console.log('No valid session, showing login page');
        UIManager.showLoginPage();
    }

    // Start connection monitoring
    setInterval(checkConnection, 30000);

    console.log('TNTT Management System initialized');
}

// Start the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}