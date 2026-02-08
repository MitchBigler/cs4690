//* detect and apply theme
function applyTheme() {
  let userPref = 'unknown';
  let browserPref = 'unknown';
  let osPref = 'unknown';
  let theme = 'light';

  // check local storage for theme
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    userPref = storedTheme;
    theme = storedTheme;
  } else {
    // check browser pref
    if (window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        browserPref = 'dark';
        theme = 'dark';
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        browserPref = 'light';
        theme = 'light';
      }
    }

    // check os pref
  }

  // apply theme
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);

  // log detection
  console.log(`User Pref: ${userPref}`);
  console.log(`Browser Pref: ${browserPref}`);
  console.log(`OS Pref: ${osPref}`);
  console.log(`Applied Theme: ${theme}`);
}


//* updates the theme button
function updateThemeIcon(theme) {
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}


//* toggles theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  
  localStorage.setItem('theme', newTheme);   // save pref

  updateThemeIcon(newTheme);
  console.log(`Theme switched to: ${newTheme}`);
}


//* init theme toggle
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}


//* loads courses from api to course select dropdown
async function LoadCourses() {
  const response = await axios.get('/api/v2/courses');
  const courses = response.data;

  const courseSelect = document.getElementById('course');

  let optionsHTML = '<option selected value="none">Choose Courses</option>';

  for (const course of courses) {
    optionsHTML += `<option value=${course.id}>${course.display}</option>`;
  }

  courseSelect.innerHTML = optionsHTML;
}


//* get and update logs
async function LoadLogs(courseId, uvuId) {
  const logsList = document.getElementById('logs-list');
  logsList.innerHTML = '';

  // fire GET
  try {
    const response = await axios.get(
      `/api/v1/logs?courseId=${courseId}&uvuId=${uvuId}`
    );

      const logs = response.data

      if (logs.length === 0) {
        logsList.innerHTML = 'No logs found for that UVU ID in this course.';
      }

      for (const log of logs) {
        logsList.innerHTML += `<li class="log"><div><small>${log.date}</small></div><pre><p class="log-text">${log.text}</p></pre></li>`;
      }
  } catch (err) {
    if (err.response) {
      logsList.innerHTML = 'No logs found for that id.';
    } else {
    logsList.innerHTML = 'Error. Try again later.';
    }
  }
}


//* show/hides id entry on course selected
function showIdEntry() {
  const courseDropDown = document.getElementById('course');
  const idEntryDiv = document.getElementById('id-entry');
  const idEntry = document.getElementById('uvuId');
  const logsList = document.getElementById('logs-list');
  const studentLogs = document.getElementById('student-logs');
  const newLogText = document.getElementById('new-log-text');
  const addLogBtn = document.getElementById('add-log-btn');

  courseDropDown.addEventListener('change', () => {
    idEntryDiv.classList.toggle('hidden', courseDropDown.value === 'none');
    idEntry.value = '';
    logsList.innerHTML = '';
    studentLogs.classList.add('hidden');
    newLogText.value = '';
    addLogBtn.disabled = true;
  });
}


//* validates id input, populates student logs, adds new logs
function setupLogs() {
  const idInput = document.getElementById('uvuId');
  const studentLogs = document.getElementById('student-logs');
  const logsList = document.getElementById('logs-list');
  const courseDropDown = document.getElementById('course');
  const idDisplay = document.getElementById('uvuIdDisplay');
  let lastId = '';
  let lastCourseId = '';

  idInput.addEventListener('input', async (e) => {
    // validate id entry
    let id = e.target.value.replace(/\D/g, '').slice(0, 8);
    e.target.value = id;
    logsList.innerHTML = '';

    if (id.length < 8) {
      studentLogs.classList.add('hidden');
      lastId = '';
      return;
    } else {
      studentLogs.classList.remove('hidden');
    }

    idDisplay.innerHTML = `Student Logs for ${id}`;
    courseId = courseDropDown.value;

    if (id === lastId && courseId === lastCourseId) return;
    lastId = id;
    lastCourseId = courseId;

    LoadLogs(courseId, id);
  });

  // make logs toggleable
  logsList.addEventListener('click', (e) => {
    const log = e.target.closest('.log');
    if (!log) return;

    const text = log.querySelector('.log-text');
    text.classList.toggle('hidden');
  });

  // handle adding new logs
  const addLogBtn = document.getElementById('add-log-btn');
  const newLogText = document.getElementById('new-log-text');

  newLogText.addEventListener('input', () => {
    addLogBtn.disabled = newLogText.value.trim() === '';
  });

  addLogBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const text = newLogText.value.trim();

    // fire POST
    try {
      const response = await axios.post(`/api/v1/logs`, {
        id: crypto.randomUUID(),
        courseId: courseDropDown.value,
        uvuId: idInput.value,
        text: text,
        date: new Date().toLocaleString(),
      });

      const newLog = response.data;

      const li = document.createElement('li');
      li.textContent = newLog.text;
      logsList.appendChild(li);

      newLogText.value = '';
      addLogBtn.disabled = true;
    } catch (err) {
      console.error('Error adding log:', err);
    }

    LoadLogs(courseDropDown.value, idInput.value);
  });
}


// init
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  setupThemeToggle();
  LoadCourses();
  showIdEntry();
  setupLogs();
});
