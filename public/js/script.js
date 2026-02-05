// TODO: Wire up the app's behavior here.
// NOTE: The TODOs are listed in index.html

// TODO: The following options are currently static values to show you sample data.
// AJAX to replace them with dynamic data from GET https://json-server-ft3qa5--3000.local.webcontainer.io/api/v1/courses
// NOTE: all AJAX in this project is via fetch
// <!-- Use your own unique URL you recorded, not the sample one above.

//* Loads courses from api to course select dropdown
async function LoadCourses() {
  const response = await window.fetch('/api/v2/courses');
  const courses = await response.json();

  const courseSelect = document.getElementById('course');

  let optionsHTML = '<option selected value="none">Choose Courses</option>';

  for (const course of courses) {
    optionsHTML += `<option value=${course.id}>${course.display}</option>`;
  }

  courseSelect.innerHTML = optionsHTML;
}

//* Fetch request and update logs
async function LoadLogs(courseId, uvuId) {
  const logsList = document.getElementById('logs-list');
  logsList.innerHTML = '';

  // fire ajax GET
  try {
    const response = await fetch(
      `/api/v1/logs?courseId=${courseId}&uvuId=${uvuId}`
    );

    if (response.status === 200 || response.status === 304) {
      const logs = await response.json();

      if (logs.length === 0) {
        logsList.innerHTML = 'No logs found for that UVU ID in this course.';
      }

      for (const log of logs) {
        logsList.innerHTML += `<li class="log"><div><small>${log.date}</small></div><pre><p class="log-text">${log.text}</p></pre></li>`;
      }
    } else {
      logsList.innerHTML = 'No logs found for that id.';
    }
  } catch (err) {
    logsList.innerHTML = 'Error. Try again later.';
  }
}

//* Show/hides id entry on course selected
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

//* Validates id input, populates student logs, adds new logs
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

    // fire ajax POST
    try {
      const response = await fetch(`/api/v1/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          courseId: courseDropDown.value,
          uvuId: idInput.value,
          text: newLogText.value,
          date: new Date().toLocaleString(),
        }),
      });

      const newLog = await response.json();

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
  LoadCourses();
  showIdEntry();
  setupLogs();
});
