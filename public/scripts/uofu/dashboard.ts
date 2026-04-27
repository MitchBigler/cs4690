export {};
const UNI = 'uofu';
const BRAND_TEXT = 'uofu-text';
const BRAND_BTN = 'uofu-btn';

interface SessionUser {
  userId: string;
  username: string;
  role: string;
  university: string;
  uvuId?: string;
}

interface Course {
  _id: string;
  id: string;
  display: string;
  university: string;
}

interface Log {
  _id: string;
  courseId: string;
  uvuId: string;
  text: string;
  date: string;
}

let currentUser: SessionUser | null = null;
let selectedCourseId: string | null = null;

function showToast(msg: string, type: 'success' | 'danger' = 'success'): void {
  const id = `toast-${Date.now()}`;
  const container = document.getElementById('toast-container')!;
  container.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center text-bg-${type} border-0 show" role="alert">
      <div class="d-flex">
        <div class="toast-body">${msg}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`);
  setTimeout(() => document.getElementById(id)?.remove(), 4000);
}

async function api(method: string, path: string, body?: object): Promise<Response> {
  const res = await fetch(`/${UNI}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    window.location.href = `/${UNI}/login`;
    throw new Error('Unauthorized');
  }
  return res;
}

async function loadSession(): Promise<void> {
  const res = await fetch(`/${UNI}/api/me`);
  if (!res.ok) { window.location.href = `/${UNI}/login`; return; }
  currentUser = await res.json();
  document.getElementById('nav-user')!.textContent = currentUser!.username;
  document.getElementById('nav-role')!.textContent = currentUser!.role.toUpperCase();
  showRoleSections();
  await loadMyCourses();
}

function showRoleSections(): void {
  const role = currentUser!.role;
  if (role === 'admin') {
    document.getElementById('section-admin')!.classList.remove('d-none');
    document.getElementById('log-filter')!.classList.remove('d-none');
    document.getElementById('users-panel')!.classList.remove('d-none');
    loadUsers();
  } else if (role === 'teacher') {
    document.getElementById('section-teacher')!.classList.remove('d-none');
    document.getElementById('log-filter')!.classList.remove('d-none');
    document.getElementById('users-panel')!.classList.remove('d-none');
    loadUsers();
  } else if (role === 'ta') {
    document.getElementById('section-ta')!.classList.remove('d-none');
    document.getElementById('log-filter')!.classList.remove('d-none');
    document.getElementById('users-panel')!.classList.remove('d-none');
    loadUsers();
  } else {
    document.getElementById('section-student')!.classList.remove('d-none');
  }
}

async function loadMyCourses(): Promise<void> {
  const container = document.getElementById('my-courses')!;
  try {
    const res = await api('GET', '/courses');
    const courses: Course[] = await res.json();
    if (courses.length === 0) {
      container.innerHTML = '<p class="text-muted mb-0">No courses yet.</p>';
      return;
    }
    container.innerHTML = courses.map(c =>
      `<span class="course-chip" data-id="${c.id}" data-display="${c.display}">${c.display}</span>`
    ).join('');
    container.querySelectorAll<HTMLElement>('.course-chip').forEach(el => {
      el.addEventListener('click', () => openCourse(el.dataset.id!, el.dataset.display!));
    });
  } catch {
    container.innerHTML = '<p class="text-danger mb-0">Failed to load courses.</p>';
  }
}

function openCourse(courseId: string, display: string): void {
  selectedCourseId = courseId;
  document.getElementById('logs-section')!.classList.remove('d-none');
  document.getElementById('logs-course-label')!.textContent = display;
  const uvuInput = document.getElementById('log-uvuid') as HTMLInputElement;
  if (currentUser?.role === 'student' && currentUser.uvuId) {
    uvuInput.value = currentUser.uvuId;
    uvuInput.readOnly = true;
  } else {
    uvuInput.readOnly = false;
  }
  loadLogs();
}

async function loadLogs(): Promise<void> {
  if (!selectedCourseId) return;
  const filterVal = (document.getElementById('filter-uvuid') as HTMLInputElement)?.value.trim() || '';
  let path = `/logs?courseId=${encodeURIComponent(selectedCourseId)}`;
  if (filterVal) path += `&uvuId=${encodeURIComponent(filterVal)}`;
  const container = document.getElementById('logs-list')!;
  try {
    const res = await api('GET', path);
    const logs: Log[] = await res.json();
    if (logs.length === 0) {
      container.innerHTML = '<p class="text-muted">No logs yet.</p>';
      return;
    }
    container.innerHTML = logs.map(l => `
      <div class="card log-card p-0 mb-2 overflow-hidden">
        <div class="d-flex justify-content-between align-items-center px-2 py-2 log-toggle" style="cursor:pointer" data-target="log-body-${l._id}">
          <small class="text-muted mb-0">ID: ${l.uvuId} &bull; ${l.date}</small>
          <div class="d-flex align-items-center gap-2">
            ${currentUser?.role !== 'student' || l.uvuId === currentUser?.uvuId
              ? `<button class="btn btn-link btn-sm p-0 ${BRAND_TEXT} text-decoration-none" data-logid="${l._id}" data-uvuid="${l.uvuId}" data-text="${encodeURIComponent(l.text)}">Edit</button>`
              : ''}
            <span class="log-chevron text-muted" style="font-size:0.75rem">&#9660;</span>
          </div>
        </div>
        <div id="log-body-${l._id}" class="px-2 pb-2 d-none border-top">${l.text}</div>
      </div>`).join('');
    container.querySelectorAll<HTMLElement>('[data-logid]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        editLog(el.dataset.logid!, el.dataset.uvuid!, decodeURIComponent(el.dataset.text!));
      });
    });
    container.querySelectorAll<HTMLElement>('.log-toggle').forEach(row => {
      row.addEventListener('click', () => {
        const body = document.getElementById(row.dataset.target!);
        const chevron = row.querySelector<HTMLElement>('.log-chevron');
        if (!body) return;
        const hidden = body.classList.toggle('d-none');
        if (chevron) chevron.innerHTML = hidden ? '&#9660;' : '&#9650;';
      });
    });
  } catch {
    container.innerHTML = '<p class="text-danger">Failed to load logs.</p>';
  }
}

async function editLog(logId: string, uvuId: string, currentText: string): Promise<void> {
  const newText = prompt('Edit log entry:', currentText);
  if (!newText || newText === currentText) return;
  const res = await api('POST', '/logs', {
    courseId: selectedCourseId,
    uvuId,
    text: newText,
    date: new Date().toLocaleString(),
    logId,
  });
  if (res.ok) { showToast('Log updated'); await loadLogs(); }
  else { const d = await res.json(); showToast(d.message || 'Update failed', 'danger'); }
}

async function createUser(username: string, password: string, displayName: string, uvuId: string, role: string): Promise<void> {
  const res = await api('POST', '/signup', { username, password, displayName, uvuId, role });
  if (res.ok) { showToast(`${role.charAt(0).toUpperCase() + role.slice(1)} created`); await loadUsers(); }
  else { const d = await res.json(); showToast(d.message || 'Failed to create user', 'danger'); }
}

async function loadUsers(): Promise<void> {
  const container = document.getElementById('users-list')!;
  const roleFilter = (document.getElementById('user-role-filter') as HTMLSelectElement)?.value || '';
  try {
    const res = await api('GET', '/persons');
    let persons: { _id: string; username: string; role: string; displayName?: string; uvuId?: string }[] = await res.json();
    if (roleFilter) persons = persons.filter(p => p.role === roleFilter);
    if (persons.length === 0) { container.innerHTML = '<p class="text-muted mb-0">No users found.</p>'; return; }
    container.innerHTML = `
      <table class="table table-sm table-hover mb-0">
        <thead><tr>
          <th>Username</th><th>Display Name</th><th>Role</th><th>ID</th>
          ${currentUser?.role === 'admin' ? '<th></th>' : ''}
        </tr></thead>
        <tbody>${persons.map(p => `
          <tr>
            <td class="fw-semibold">${p.username}</td>
            <td>${p.displayName || '—'}</td>
            <td><span class="badge bg-secondary">${p.role}</span></td>
            <td class="text-muted small">${p.uvuId || '—'}</td>
            ${currentUser?.role === 'admin' && p._id !== currentUser.userId ? `
              <td><button class="btn btn-sm btn-outline-danger py-0" data-delete-id="${p._id}" data-delete-name="${p.username}">Delete</button></td>
            ` : '<td></td>'}
          </tr>`).join('')}
        </tbody>
      </table>`;
    container.querySelectorAll<HTMLElement>('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(btn.dataset.deleteId!, btn.dataset.deleteName!));
    });
  } catch {
    container.innerHTML = '<p class="text-danger mb-0">Failed to load users.</p>';
  }
}

async function deleteUser(id: string, username: string): Promise<void> {
  if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
  const res = await api('DELETE', `/persons/${id}`);
  if (res.ok) { showToast(`Deleted ${username}`); await loadUsers(); }
  else { const d = await res.json(); showToast(d.message || 'Delete failed', 'danger'); }
}

// Logout
document.getElementById('btn-logout')?.addEventListener('click', async () => {
  await api('POST', '/logout');
  window.location.href = `/${UNI}/login`;
});

// Close logs
document.getElementById('btn-close-logs')?.addEventListener('click', () => {
  document.getElementById('logs-section')!.classList.add('d-none');
  selectedCourseId = null;
});

// Load logs with filter
document.getElementById('btn-load-logs')?.addEventListener('click', loadLogs);

// Add log
document.getElementById('btn-add-log')?.addEventListener('click', async () => {
  const uvuId = (document.getElementById('log-uvuid') as HTMLInputElement).value.trim();
  const text  = (document.getElementById('log-text') as HTMLTextAreaElement).value.trim();
  if (!uvuId || !text || !selectedCourseId) { showToast('Fill in Student ID and log text', 'danger'); return; }
  const res = await api('POST', '/logs', { courseId: selectedCourseId, uvuId, text, date: new Date().toLocaleString() });
  if (res.ok) {
    showToast('Log added');
    (document.getElementById('log-text') as HTMLTextAreaElement).value = '';
    await loadLogs();
  } else { const d = await res.json(); showToast(d.message || 'Error', 'danger'); }
});

// Admin: create course
document.getElementById('btn-admin-create-course')?.addEventListener('click', async () => {
  const id      = (document.getElementById('admin-course-id') as HTMLInputElement).value.trim();
  const display = (document.getElementById('admin-course-display') as HTMLInputElement).value.trim();
  if (!id || !display) { showToast('Course ID and display name required', 'danger'); return; }
  const res = await api('POST', '/courses', { id, display });
  if (res.ok) { showToast('Course created'); await loadMyCourses(); }
  else { const d = await res.json(); showToast(d.message || 'Error', 'danger'); }
});

// Admin: create user
document.getElementById('btn-admin-create-user')?.addEventListener('click', async () => {
  const username    = (document.getElementById('admin-new-username') as HTMLInputElement).value.trim();
  const password    = (document.getElementById('admin-new-password') as HTMLInputElement).value;
  const displayName = (document.getElementById('admin-new-displayname') as HTMLInputElement).value.trim();
  const uvuId       = (document.getElementById('admin-new-uvuid') as HTMLInputElement).value.trim();
  const role        = (document.getElementById('admin-new-role') as HTMLSelectElement).value;
  await createUser(username, password, displayName, uvuId, role);
});

// Teacher: create course
document.getElementById('btn-teacher-create-course')?.addEventListener('click', async () => {
  const id      = (document.getElementById('teacher-course-id') as HTMLInputElement).value.trim();
  const display = (document.getElementById('teacher-course-display') as HTMLInputElement).value.trim();
  if (!id || !display) { showToast('Course ID and display name required', 'danger'); return; }
  const res = await api('POST', '/courses', { id, display });
  if (res.ok) { showToast('Course created'); await loadMyCourses(); }
  else { const d = await res.json(); showToast(d.message || 'Error', 'danger'); }
});

// Teacher: create user
document.getElementById('btn-teacher-create-user')?.addEventListener('click', async () => {
  const username    = (document.getElementById('teacher-new-username') as HTMLInputElement).value.trim();
  const password    = (document.getElementById('teacher-new-password') as HTMLInputElement).value;
  const displayName = (document.getElementById('teacher-new-displayname') as HTMLInputElement).value.trim();
  const uvuId       = (document.getElementById('teacher-new-uvuid') as HTMLInputElement).value.trim();
  const role        = (document.getElementById('teacher-new-role') as HTMLSelectElement).value;
  await createUser(username, password, displayName, uvuId, role);
});

// TA: create student
document.getElementById('btn-ta-create-student')?.addEventListener('click', async () => {
  const username    = (document.getElementById('ta-new-username') as HTMLInputElement).value.trim();
  const password    = (document.getElementById('ta-new-password') as HTMLInputElement).value;
  const displayName = (document.getElementById('ta-new-displayname') as HTMLInputElement).value.trim();
  const uvuId       = (document.getElementById('ta-new-uvuid') as HTMLInputElement).value.trim();
  await createUser(username, password, displayName, uvuId, 'student');
});

// Student: self-enroll
document.getElementById('btn-enroll')?.addEventListener('click', async () => {
  const courseId = (document.getElementById('enroll-course-id') as HTMLInputElement).value.trim();
  if (!courseId) { showToast('Enter a Course ID', 'danger'); return; }
  const res = await api('POST', `/courses/${encodeURIComponent(courseId)}/enroll`);
  if (res.ok) { showToast('Enrolled successfully!'); await loadMyCourses(); }
  else { const d = await res.json(); showToast(d.message || 'Enrollment failed', 'danger'); }
});

// Refresh users list
document.getElementById('btn-refresh-users')?.addEventListener('click', loadUsers);
document.getElementById('user-role-filter')?.addEventListener('change', loadUsers);

// Boot
loadSession();
