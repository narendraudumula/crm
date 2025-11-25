// =============================================
// CRM SYSTEM - COMPLETE JAVASCRIPT
// =============================================
let db = null;
let SQL = null;
let currentUser = null;
// =============================================
// DATABASE INITIALIZATION
// =============================================
async function initializeDatabase() {
    try {
        console.log('Initializing SQL.js database...');
        
        // Load SQL.js
        SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        
        // Create database
        db = new SQL.Database();
        
        // Create tables
        createTables();
        
        // Insert default data
        insertDefaultData();
        
        console.log('✅ Database initialized successfully!');
        return true;
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        alert('Database initialization failed. Please refresh the page.');
        return false;
    }
}
// Create all database tables
function createTables() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Employees table
    db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        department TEXT NOT NULL,
        designation TEXT NOT NULL,
        salary REAL NOT NULL,
        status TEXT DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Departments table
    db.run(`CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        head TEXT,
        employee_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Leave requests table
    db.run(`CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee TEXT NOT NULL,
        leave_type TEXT NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        days INTEGER NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Attendance table
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee TEXT NOT NULL,
        date DATE NOT NULL,
        in_time TEXT,
        out_time TEXT,
        status TEXT DEFAULT 'Present',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Payroll table
    db.run(`CREATE TABLE IF NOT EXISTS payroll (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee TEXT NOT NULL,
        basic_salary REAL NOT NULL,
        allowances REAL DEFAULT 0,
        deductions REAL DEFAULT 0,
        net_salary REAL NOT NULL,
        status TEXT DEFAULT 'Processed',
        month TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
}
// Insert default data
function insertDefaultData() {
    // Check if data already exists
    const userCount = db.exec("SELECT COUNT(*) as count FROM users");
    if (userCount[0] && userCount[0].values[0][0] > 0) {
        return; // Data already exists
    }
    // Insert default admin user
    db.run(`INSERT INTO users (username, name, email, password) 
            VALUES ('admin', 'Admin User', 'admin@crm.com', 'admin123')`);
    // Insert default departments
    const departments = [
        ['Finance', 'John Doe', 0],
        ['Human Resources', 'Jane Smith', 0],
        ['Information Technology', 'Mike Johnson', 0],
        ['Marketing', 'Sarah Williams', 0]
    ];
    
    const deptStmt = db.prepare("INSERT INTO departments (name, head, employee_count) VALUES (?, ?, ?)");
    departments.forEach(dept => deptStmt.run(dept));
    deptStmt.free();
    // Insert sample employees
    const employees = [
        ['EMP001', 'Ahmed Ali', 'ahmed@company.com', 'Finance', 'Accountant', 50000, 'Active'],
        ['EMP002', 'Sara Khan', 'sara@company.com', 'Human Resources', 'HR Manager', 60000, 'Active'],
        ['EMP003', 'Usman Sheikh', 'usman@company.com', 'Information Technology', 'Developer', 70000, 'Active'],
        ['EMP004', 'Fatima Noor', 'fatima@company.com', 'Marketing', 'Marketing Executive', 55000, 'Active'],
        ['EMP005', 'Ali Raza', 'ali@company.com', 'Finance', 'Financial Analyst', 52000, 'Active']
    ];
    
    const empStmt = db.prepare(`INSERT INTO employees (employee_id, name, email, department, designation, salary, status) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)`);
    employees.forEach(emp => {
        empStmt.run(emp);
        // Update department count
        db.run("UPDATE departments SET employee_count = employee_count + 1 WHERE name = ?", [emp[3]]);
    });
    empStmt.free();
    console.log('✅ Default data inserted');
}
// =============================================
// DATABASE HELPER FUNCTIONS
// =============================================
function sqlSelect(query, params = []) {
    try {
        const stmt = db.prepare(query);
        stmt.bind(params);
        
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        
        stmt.free();
        return results;
    } catch (error) {
        console.error("SQL Select Error:", error);
        return [];
    }
}
function sqlExecute(query, params = []) {
    try {
        const stmt = db.prepare(query);
        stmt.run(params);
        stmt.free();
        return true;
    } catch (error) {
        console.error("SQL Execute Error:", error);
        return false;
    }
}
// =============================================
// AUTHENTICATION
// =============================================
function showPage(pageName) {
    // Hide all auth pages
    document.querySelectorAll('.auth-page').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show requested page
    const pageMap = {
        'signin': 'signin-page',
        'signup': 'signup-page'
    };
    
    const pageId = pageMap[pageName];
    if (pageId) {
        document.getElementById(pageId).style.display = 'flex';
    }
}
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
// Sign In
document.addEventListener('DOMContentLoaded', function() {
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('signin-username').value;
            const password = document.getElementById('signin-password').value;
            
            const users = sqlSelect("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
            
            if (users.length > 0) {
                currentUser = users[0];
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Hide auth pages, show dashboard
                document.querySelectorAll('.auth-page').forEach(page => page.style.display = 'none');
                document.getElementById('dashboard-page').style.display = 'flex';
                
                // Update user info
                document.getElementById('user-name').textContent = currentUser.name;
                document.getElementById('user-avatar').src = 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=667eea&color=fff&size=128`;
                
                // Load dashboard data
                loadDashboard();
            } else {
                showMessage('signin-error', 'Invalid username or password!', 'error');
            }
        });
    }
});
// Sign Up
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('signup-name').value;
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            
            // Check if username exists
            const existing = sqlSelect("SELECT * FROM users WHERE username = ?", [username]);
            if (existing.length > 0) {
                showMessage('signup-error', 'Username already exists!', 'error');
                return;
            }
            
            // Insert new user
            const success = sqlExecute(
                "INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)",
                [username, name, email, password]
            );
            
            if (success) {
                showMessage('signup-message', 'Account created successfully! Please sign in.', 'success');
                setTimeout(() => showPage('signin'), 2000);
            } else {
                showMessage('signup-error', 'Failed to create account!', 'error');
            }
        });
    }
});
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.add('show');
    
    setTimeout(() => {
        element.classList.remove('show');
    }, 3000);
}
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('currentUser');
        currentUser = null;
        
        document.getElementById('dashboard-page').style.display = 'none';
        document.getElementById('signin-page').style.display = 'flex';
        
        // Clear form
        document.getElementById('signin-form').reset();
    }
}
// =============================================
// NAVIGATION
// =============================================
function showSection(sectionName) {
    // Update sidebar active state
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        li.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show requested section
    const section = document.getElementById(sectionName);
    if (section) {
        section.classList.add('active');
        
        // Load section data
        switch(sectionName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'employees':
                loadEmployees();
                break;
            case 'departments':
                loadDepartments();
                break;
            case 'attendance':
                loadAttendance();
                break;
            case 'leave':
                loadLeaveRequests();
                break;
            case 'payroll':
                loadPayroll();
                break;
            case 'reports':
                loadReports();
                break;
        }
    }
}
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('full-width');
}
// =============================================
// DASHBOARD
// =============================================
function loadDashboard() {
    // Update date
    const today = new Date();
    document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Update counts
    const employees = sqlSelect("SELECT * FROM employees");
    const departments = sqlSelect("SELECT * FROM departments");
    const leaveRequests = sqlSelect("SELECT * FROM leave_requests");
    const attendance = sqlSelect("SELECT * FROM attendance WHERE date = date('now')");
    
    document.getElementById('total-employees-count').textContent = employees.length;
    document.getElementById('present-count').textContent = attendance.length;
    document.getElementById('department-count').textContent = departments.length;
    document.getElementById('leave-requests-count').textContent = leaveRequests.length;
    
    // Load recent employees
    const tbody = document.getElementById('dashboard-employee-body');
    tbody.innerHTML = '';
    
    employees.slice(0, 5).forEach(emp => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${emp.employee_id}</strong></td>
            <td>${emp.name}</td>
            <td>${emp.department}</td>
            <td>${emp.email}</td>
            <td><span class="status-badge status-${emp.status.toLowerCase()}">${emp.status}</span></td>
        `;
    });
}
// =============================================
// EMPLOYEES
// =============================================
function loadEmployees() {
    const employees = sqlSelect("SELECT * FROM employees ORDER BY employee_id");
    const tbody = document.getElementById('employee-body');
    tbody.innerHTML = '';
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No employees found</td></tr>';
        return;
    }
    
    employees.forEach(emp => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${emp.employee_id}</strong></td>
            <td>${emp.name}</td>
            <td>${emp.email}</td>
            <td>${emp.department}</td>
            <td>${emp.designation}</td>
            <td>Rs. ${emp.salary.toLocaleString()}</td>
            <td><span class="status-badge status-${emp.status.toLowerCase()}">${emp.status}</span></td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editEmployee('${emp.employee_id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${emp.employee_id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}
function openAddEmployeeModal() {
    // Populate department dropdown
    const departments = sqlSelect("SELECT * FROM departments");
    const deptSelect = document.getElementById('emp-department');
    deptSelect.innerHTML = '<option value="">Select Department</option>';
    departments.forEach(dept => {
        deptSelect.innerHTML += `<option value="${dept.name}">${dept.name}</option>`;
    });
    
    // Generate employee ID
    const employees = sqlSelect("SELECT employee_id FROM employees ORDER BY id DESC LIMIT 1");
    let nextId = 1;
    if (employees.length > 0) {
        const lastId = parseInt(employees[0].employee_id.replace('EMP', ''));
        nextId = lastId + 1;
    }
    document.getElementById('emp-id').value = 'EMP' + String(nextId).padStart(3, '0');
    
    // Clear form
    document.getElementById('emp-name').value = '';
    document.getElementById('emp-email').value = '';
    document.getElementById('emp-designation').value = '';
    document.getElementById('emp-salary').value = '';
    
    openModal('employee-modal');
}
function saveEmployee() {
    const empId = document.getElementById('emp-id').value;
    const name = document.getElementById('emp-name').value;
    const email = document.getElementById('emp-email').value;
    const department = document.getElementById('emp-department').value;
    const designation = document.getElementById('emp-designation').value;
    const salary = parseFloat(document.getElementById('emp-salary').value);
    
    if (!name || !email || !department || !designation || !salary) {
        alert('Please fill all required fields!');
        return;
    }
    
    const success = sqlExecute(
        `INSERT INTO employees (employee_id, name, email, department, designation, salary, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
        [empId, name, email, department, designation, salary]
    );
    
    if (success) {
        // Update department count
        sqlExecute("UPDATE departments SET employee_count = employee_count + 1 WHERE name = ?", [department]);
        
        closeModal('employee-modal');
        loadEmployees();
        loadDashboard();
        showNotification('Employee added successfully!', 'success');
    } else {
        alert('Failed to add employee!');
    }
}
function deleteEmployee(empId) {
    if (!confirm('Are you sure you want to delete this employee?')) {
        return;
    }
    
    const emp = sqlSelect("SELECT * FROM employees WHERE employee_id = ?", [empId]);
    if (emp.length === 0) return;
    
    const success = sqlExecute("DELETE FROM employees WHERE employee_id = ?", [empId]);
    
    if (success) {
        // Update department count
        sqlExecute("UPDATE departments SET employee_count = employee_count - 1 WHERE name = ?", [emp[0].department]);
        
        loadEmployees();
        loadDashboard();
        showNotification('Employee deleted successfully!', 'success');
    }
}
function refreshEmployees() {
    loadEmployees();
    showNotification('Employee list refreshed!', 'success');
}
// =============================================
// DEPARTMENTS
// =============================================
function loadDepartments() {
    const departments = sqlSelect("SELECT * FROM departments");
    const tbody = document.getElementById('department-body');
    tbody.innerHTML = '';
    
    if (departments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No departments found</td></tr>';
        return;
    }
    
    departments.forEach(dept => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${dept.name}</strong></td>
            <td>${dept.head || 'Not Assigned'}</td>
            <td>${dept.employee_count}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editDepartment(${dept.id})">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
    });
}
function openAddDepartmentModal() {
    document.getElementById('dept-name').value = '';
    document.getElementById('dept-head').value = '';
    openModal('department-modal');
}
function saveDepartment() {
    const name = document.getElementById('dept-name').value;
    const head = document.getElementById('dept-head').value;
    
    if (!name) {
        alert('Please enter department name!');
        return;
    }
    
    const success = sqlExecute(
        "INSERT INTO departments (name, head, employee_count) VALUES (?, ?, 0)",
        [name, head]
    );
    
    if (success) {
        closeModal('department-modal');
        loadDepartments();
        showNotification('Department added successfully!', 'success');
    } else {
        alert('Failed to add department! Name might already exist.');
    }
}
// =============================================
// ATTENDANCE
// =============================================
function loadAttendance() {
    const attendance = sqlSelect("SELECT * FROM attendance ORDER BY date DESC LIMIT 50");
    const tbody = document.getElementById('attendance-body');
    tbody.innerHTML = '';
    
    if (attendance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No attendance records found</td></tr>';
        return;
    }
    
    attendance.forEach(att => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${att.employee}</td>
            <td>${new Date(att.date).toLocaleDateString()}</td>
            <td>${att.in_time || '-'}</td>
            <td>${att.out_time || '-'}</td>
            <td><span class="status-badge status-${att.status.toLowerCase()}">${att.status}</span></td>
        `;
    });
}
function markAttendance() {
    const employees = sqlSelect("SELECT * FROM employees WHERE status = 'Active'");
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString();
    
    let count = 0;
    employees.forEach(emp => {
        // Check if already marked
        const existing = sqlSelect("SELECT * FROM attendance WHERE employee = ? AND date = ?", [emp.name, today]);
        if (existing.length === 0) {
            sqlExecute(
                "INSERT INTO attendance (employee, date, in_time, status) VALUES (?, ?, ?, 'Present')",
                [emp.name, today, time]
            );
            count++;
        }
    });
    
    loadAttendance();
    loadDashboard();
    showNotification(`Attendance marked for ${count} employees!`, 'success');
}
// =============================================
// LEAVE MANAGEMENT
// =============================================
function loadLeaveRequests() {
    const leaves = sqlSelect("SELECT * FROM leave_requests ORDER BY created_at DESC");
    const tbody = document.getElementById('leave-body');
    tbody.innerHTML = '';
    
    if (leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No leave requests found</td></tr>';
        return;
    }
    
    leaves.forEach(leave => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${leave.employee}</td>
            <td>${leave.leave_type}</td>
            <td>${new Date(leave.from_date).toLocaleDateString()}</td>
            <td>${new Date(leave.to_date).toLocaleDateString()}</td>
            <td>${leave.days}</td>
            <td><span class="status-badge status-${leave.status.toLowerCase()}">${leave.status}</span></td>
            <td>
                <button class="btn btn-sm btn-success" onclick="approveLeave(${leave.id})">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="rejectLeave(${leave.id})">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
    });
}
function openLeaveModal() {
    // Populate employee dropdown
    const employees = sqlSelect("SELECT * FROM employees WHERE status = 'Active'");
    const empSelect = document.getElementById('leave-employee');
    empSelect.innerHTML = '<option value="">Select Employee</option>';
    employees.forEach(emp => {
        empSelect.innerHTML += `<option value="${emp.name}">${emp.name}</option>`;
    });
    
    openModal('leave-modal');
}
function saveLeave() {
    const employee = document.getElementById('leave-employee').value;
    const leaveType = document.getElementById('leave-type').value;
    const fromDate = document.getElementById('leave-from').value;
    const toDate = document.getElementById('leave-to').value;
    const reason = document.getElementById('leave-reason').value;
    
    if (!employee || !leaveType || !fromDate || !toDate || !reason) {
        alert('Please fill all fields!');
        return;
    }
    
    // Calculate days
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    
    const success = sqlExecute(
        `INSERT INTO leave_requests (employee, leave_type, from_date, to_date, days, reason, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
        [employee, leaveType, fromDate, toDate, days, reason]
    );
    
    if (success) {
        closeModal('leave-modal');
        loadLeaveRequests();
        loadDashboard();
        showNotification('Leave request submitted successfully!', 'success');
    }
}
function approveLeave(id) {
    sqlExecute("UPDATE leave_requests SET status = 'Approved' WHERE id = ?", [id]);
    loadLeaveRequests();
    showNotification('Leave request approved!', 'success');
}
function rejectLeave(id) {
    sqlExecute("UPDATE leave_requests SET status = 'Rejected' WHERE id = ?", [id]);
    loadLeaveRequests();
    showNotification('Leave request rejected!', 'success');
}
// =============================================
// PAYROLL
// =============================================
function loadPayroll() {
    const payroll = sqlSelect("SELECT * FROM payroll ORDER BY created_at DESC");
    const tbody = document.getElementById('payroll-body');
    tbody.innerHTML = '';
    
    if (payroll.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No payroll records found</td></tr>';
        return;
    }
    
    payroll.forEach(pay => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${pay.employee}</td>
            <td>Rs. ${pay.basic_salary.toLocaleString()}</td>
            <td>Rs. ${pay.allowances.toLocaleString()}</td>
            <td>Rs. ${pay.deductions.toLocaleString()}</td>
            <td><strong>Rs. ${pay.net_salary.toLocaleString()}</strong></td>
            <td><span class="status-badge status-${pay.status.toLowerCase()}">${pay.status}</span></td>
        `;
    });
}
function processPayroll() {
    const employees = sqlSelect("SELECT * FROM employees WHERE status = 'Active'");
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    let count = 0;
    employees.forEach(emp => {
        const basicSalary = emp.salary;
        const allowances = basicSalary * 0.1; // 10% allowances
        const deductions = basicSalary * 0.05; // 5% deductions
        const netSalary = basicSalary + allowances - deductions;
        
        // Check if already processed for this month
        const existing = sqlSelect("SELECT * FROM payroll WHERE employee = ? AND month = ?", [emp.name, month]);
        if (existing.length === 0) {
            sqlExecute(
                `INSERT INTO payroll (employee, basic_salary, allowances, deductions, net_salary, status, month) 
                 VALUES (?, ?, ?, ?, ?, 'Processed', ?)`,
                [emp.name, basicSalary, allowances, deductions, netSalary, month]
            );
            count++;
        }
    });
    
    loadPayroll();
    showNotification(`Payroll processed for ${count} employees!`, 'success');
}
// =============================================
// REPORTS
// =============================================
function loadReports() {
    const leaves = sqlSelect("SELECT * FROM leave_requests");
    const employees = sqlSelect("SELECT * FROM employees");
    const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);
    
    document.getElementById('report-leave-count').textContent = leaves.length;
    document.getElementById('report-salary-total').textContent = `Rs. ${(totalSalary / 1000).toFixed(0)}k`;
    
    // Create chart
    createReportChart();
}
function createReportChart() {
    const ctx = document.getElementById('reportChart');
    if (!ctx) return;
    
    const departments = sqlSelect("SELECT name, employee_count FROM departments");
    const labels = departments.map(d => d.name);
    const data = departments.map(d => d.employee_count);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Employees per Department',
                data: data,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgb(102, 126, 234)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 158, 11)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}
// =============================================
// MODAL FUNCTIONS
// =============================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}
// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});
// =============================================
// NOTIFICATIONS
// =============================================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
// =============================================
// INITIALIZATION
// =============================================
// Initialize database when page loads
window.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 CRM System Starting...');
    
    const dbInitialized = await initializeDatabase();
    
    if (dbInitialized) {
        console.log('✅ CRM System Ready!');
        
        // Check if user is already logged in
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            document.querySelectorAll('.auth-page').forEach(page => page.style.display = 'none');
            document.getElementById('dashboard-page').style.display = 'flex';
            document.getElementById('user-name').textContent = currentUser.name;
            loadDashboard();
        }
    }
});
console.log('📄 CRM JavaScript loaded successfully!');
