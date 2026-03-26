
//////// THEME /////////

//* detect and apply theme
function applyTheme() {
  let userPref: string = 'unknown';
  let browserPref: string = 'unknown';
  let osPref: string = 'unknown';
  let theme: string = 'light';

  // check local storage for theme
  const storedTheme: string | null = localStorage.getItem('theme');
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

  }

  // apply theme
  $('html').attr('data-bs-theme', theme);
  updateThemeIcon(theme);

  // log detection
  console.log(`User Pref: ${userPref}`);
  console.log(`Browser Pref: ${browserPref}`);
  console.log(`OS Pref: ${osPref}`);
  console.log(`Applied Theme: ${theme}`);
}


//* updates the theme button
function updateThemeIcon(theme: string): void {
  $('.theme-icon').text(theme === 'dark' ? '☀️' : '🌙');
}


//* toggles theme
function toggleTheme(): void {
  const currentTheme: string = $('html').attr('data-bs-theme') ?? 'light';
  const newTheme: string = currentTheme === 'dark' ? 'light' : 'dark';

  $('html').attr('data-bs-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
  console.log(`Theme switched to: ${newTheme}`);
}


//* init theme toggle
function setupThemeToggle(): void {
  $('#theme-toggle').on('click', toggleTheme);
}


///////// API /////////

//* loads courses from api to course select dropdown
async function loadCourses() {
  const response = await $.getJSON('/courses');
  const courses = response;

  let optionsHTML: string = '<option selected value="none">Choose Courses</option>';
  for (const course of courses) {
    optionsHTML += `<option value="${course.id}">${course.display}</option>`;
  }

  optionsHTML += `<option value='add'>Add new course</option>`;
  $('#course').html(optionsHTML);
}

async function postCourse(courseId: string, courseName: string, updateCourse: boolean = false): Promise<void> {
    try {
      const originalId = $('#course-original-id').val() as string;

      await $.ajax({
        url: '/courses',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          id: courseId,
          display: courseName,
          updateCourse: updateCourse,
          originalId: updateCourse ? originalId : undefined
        }),
      });

      $('#course-id').val('');
      $('#course-name').val('');
      $('#course-id-update').val('');
      $('#course-name-update').val('');

      await loadCourses();
    } catch (err: unknown) {
      console.error('Error adding course:', err);
    }
}

//* get and update logs
async function loadLogs(courseId: string, uvuId: string): Promise<void> {
  const $logsList = $('#logs-list');
  $logsList.empty();

  // fire GET
  try {
    const logs: { date: string; text: string }[] = await $.getJSON(
      `/logs?courseId=${courseId}&uvuId=${uvuId}`
    );

      if (logs.length === 0) {
        $logsList.html('<li class="list-group-item text-muted">No logs found for that UVU ID in this course.</li>');
        return;
      }

    for (const log of logs) {
      $logsList.append(
        `<li class="list-group-item log" style="cursor:pointer;">
           <small class="text-muted">${log.date}</small>
           <p class="log-text mb-0 mt-1">${log.text}</p>
         </li>`
      );
    }
  } catch (err: unknown) {
    const jqErr = err as JQuery.jqXHR;
    if (jqErr.status) {
      $logsList.html('<li class="list-group-item text-danger">No logs found for that id.</li>');
    } else {
      $logsList.html('<li class="list-group-item text-danger">Error. Try again later.</li>');
    }
  }
}

async function postLog(courseId: string, uvuId: string, text: string): Promise<void> {
    try {
    await $.ajax({
      url: '/logs',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        id: crypto.randomUUID(),
        courseId,
        uvuId,
        text,
        date: new Date().toLocaleString(),
      }),
    });

    await loadLogs(courseId, uvuId);
  } catch (err: unknown) {
    console.error('Error adding log:', err);
  }
}
///////// EVENT /////////

//* show/hides id entry on course selected
function showIdEntry(): void {
  $('#course').on('change', function () {
    const value = $(this).val() as string;

    // hide all
    $('#id-entry').addClass('d-none');
    $('#add-course').addClass('d-none');
    $('#uvuId').val('');
    $('#logs-list').empty();
    $('#student-logs').addClass('d-none');
    $('#update-course').addClass('d-none');
    $('#new-log-text').val('');
    $('#add-log-btn').prop('disabled', true);
    $('#show-update-course-btn').addClass('d-none');


    if (value === 'none') {
    } else if (value === 'add') {
      $('#add-course').removeClass('d-none');
    } else {
      $('#id-entry').removeClass('d-none');
      $('#show-update-course-btn').removeClass('d-none');
    }
  });
}

// logic for adding new course
function setupAddCourses() {
  // POST new log
  $('#add-course-btn').on('click', async function (e: JQuery.ClickEvent) {
    e.preventDefault();

    const courseId: string = $('#course-id').val() as string;
    const courseName: string = $('#course-name').val() as string;

    if (!courseId || !courseName) {
      alert('Please fill out all fields');
      return;
    }

    $('#add-course-btn').prop('disabled', true);
    await postCourse(courseId, courseName);
    $('#add-course-btn').prop('disabled', false);

  })
}

// logic for updating course
function setupUpdateCourses() {
  // show update form
  $('#show-update-course-btn').on('click', async function (e: JQuery.ClickEvent) {
    e.preventDefault();
    if ($('#update-course').hasClass('d-none')) {
      $('#update-course').removeClass('d-none');
      const currentCourse: string = $('#course option:selected').text() as string;
      const currentCourseId: string = $('#course').val() as string;

      $('#course-name-update').val(currentCourse);
      $('#course-id-update').val(currentCourseId);
      $('#course-original-id').val(currentCourseId);

    } else {
      $('#update-course').addClass('d-none');
    }
  })

  $('#update-course-btn').on('click', async function (e: JQuery.ClickEvent) {
    e.preventDefault();

    const courseId: string = $('#course-id-update').val() as string;
    const courseName: string = $('#course-name-update').val() as string;

    if (!courseId || !courseName) {
      alert('Please fill out all fields');
      return;
    }
    
    $('#update-course-btn').prop('disabled', true);
    await postCourse(courseId, courseName, true);
    $('#update-course-btn').prop('disabled', false);

    $('#update-course').addClass('d-none');
  })
}

//* validates id input, populates student logs, adds new logs
function setupLogs() {
  let lastId = '';
  let lastCourseId = '';

  // validate id entry
  $('#uvuId').on('input', async function () {
    let id: string = ($(this).val() as string).replace(/\D/g, '').slice(0, 8);
    $(this).val(id);
    $('#logs-list').empty();

    if (id.length < 8) {
      $('#student-logs').addClass('d-none');
      lastId = ''
      return;
    }

    $('#student-logs').removeClass('d-none');
    $('#uvuIdDisplay').text(`Student Logs for ${id}`);

    const courseId: string = $('#course').val() as string;
    if (id === lastId && courseId === lastCourseId) return;
    lastId = id;
    lastCourseId = courseId;

    await loadLogs(courseId, id);

    // disable button
    $('#add-log-button').prop('disabled', ($('#new-log-text').val() as string).trim() === '');
  });

  // toggle log visibility
  $('#logs-list').on('click', '.log', function () {
    $(this).find('.log-text').toggleClass('d-none');
  });

  // enable add log button when text in new log
  $('#new-log-text').on('input', function () {
    $('#add-log-btn').prop('disabled', ($(this).val() as string).trim() === '');
  });

  // POST new log
  $('#add-log-btn').on('click', async function (e: JQuery.ClickEvent) {
    e.preventDefault();

    const text: string = ($('#new-log-text').val() as string).trim();
    const courseId: string = $('#course').val() as string;
    const uvuId: string = $('#uvuId').val() as string;

    $('#new-log-text').val('');
    $('#add-log-btn').prop('disabled', true);

    postLog(courseId, uvuId, text);
  });
}


///////// INIT /////////

document.addEventListener('DOMContentLoaded', async () => {
  applyTheme();
  setupThemeToggle();
  await loadCourses();
  showIdEntry();
  setupAddCourses();
  setupUpdateCourses();
  setupLogs();
});
