//////// THEME /////////
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    }
    else {
        // check browser pref
        if (window.matchMedia) {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                browserPref = 'dark';
                theme = 'dark';
            }
            else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                browserPref = 'light';
                theme = 'light';
            }
        }
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
    localStorage.setItem('theme', newTheme); // save pref
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
///////// API /////////
//* loads courses from api to course select dropdown
function loadCourses() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield $.getJSON('/api/v2/courses');
        const courses = response;
        let optionsHTML = '<option selected value="none">Choose Courses</option>';
        for (const course of courses) {
            optionsHTML += `<option value=${course.id}>${course.display}</option>`;
        }
        $('#course').html(optionsHTML);
    });
}
//* get and update logs
function loadLogs(courseId, uvuId) {
    return __awaiter(this, void 0, void 0, function* () {
        const $logsList = $('#logs-list');
        $logsList.empty();
        // fire GET
        try {
            const logs = yield $.getJSON(`/api/v1/logs?courseId=${courseId}&uvuId=${uvuId}`);
            if (logs.length === 0) {
                $logsList.html('<li class="list-group-item text-muted">No logs found for that UVU ID in this course.</li>');
                return;
            }
            for (const log of logs) {
                $logsList.append(`<li class="list-group-item log" style="cursor:pointer;">
           <small class="text-muted">${log.date}</small>
           <p class="log-text mb-0 mt-1">${log.text}</p>
         </li>`);
            }
        }
        catch (err) {
            const jqErr = err;
            if (jqErr.status) {
                $logsList.html('<li class="list-group-item text-danger">No logs found for that id.</li>');
            }
            else {
                $logsList.html('<li class="list-group-item text-danger">Error. Try again later.</li>');
            }
        }
    });
}
///////// EVENT /////////
//* show/hides id entry on course selected
function showIdEntry() {
    $('#course').on('change', function () {
        const isNone = $(this).val() === 'none';
        $('#id-entry').toggleClass('d-none', isNone);
        $('#uvuId').val('');
        $('#logs-list').empty();
        $('#student-logs').addClass('d-none');
        $('#new-log-text').val('');
        $('#add-log-btn').prop('disabled', true);
    });
}
//* validates id input, populates student logs, adds new logs
function setupLogs() {
    let lastId = '';
    let lastCourseId = '';
    // validate id entry
    $('#uvuId').on('input', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let id = $(this).val().replace(/\D/g, '').slice(0, 8);
            $(this).val(id);
            $('#logs-list').empty();
            if (id.length < 8) {
                $('#student-logs').addClass('d-none');
                lastId = '';
                return;
            }
            $('#student-logs').removeClass('d-none');
            $('#uvuIdDisplay').text(`Student Logs for ${id}`);
            const courseId = $('#course').val();
            if (id === lastId && courseId === lastCourseId)
                return;
            lastId = id;
            lastCourseId = courseId;
            yield loadLogs(courseId, id);
            // disable button
            $('#add-log-button').prop('disabled', $('#new-log-text').val().trim() === '');
        });
    });
    // toggle log visibility
    $('#logs-list').on('click', '.log', function () {
        $(this).find('.log-text').toggleClass('d-none');
    });
    // enable add log button when text in new log
    $('#new-log-text').on('input', function () {
        $('#add-log-btn').prop('disabled', $(this).val().trim() === '');
    });
    // POST new log
    $('#add-log-btn').on('click', function (e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const text = $('#new-log-text').val().trim();
            const courseId = $('#course').val();
            const uvuId = $('#uvuId').val();
            try {
                yield $.ajax({
                    url: '/api/v1/logs',
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
                $('#new-log-text').val('');
                $('#add-log-btn').prop('disabled', true);
                yield loadLogs(courseId, uvuId);
            }
            catch (err) {
                console.error('Error adding log:', err);
            }
        });
    });
}
///////// INIT /////////
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    applyTheme();
    setupThemeToggle();
    yield loadCourses();
    showIdEntry();
    setupLogs();
}));
//# sourceMappingURL=script.js.map