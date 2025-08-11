document.getElementById('meetingForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const reminderInputs = remindersContainer.querySelectorAll('input[name="reminderHours[]"]');
    const reminders = Array.from(reminderInputs).map(input => Number(input.value));
    const data = {
        meetingName: document.getElementById('meetingName').value,
        meetingDate: document.getElementById('meetingDate').value,
        notes: document.getElementById('notes').value,
        reminders: reminders
    };
    try {
        const response = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            document.getElementById('successMessage').style.display = 'block';
            document.getElementById('meetingForm').reset();
            remindersContainer.innerHTML = '';
            // Add back one default reminder input
            const div = document.createElement('div');
            div.className = 'reminder-input';
            div.innerHTML = `<input type="number" name="reminderHours[]" min="1" max="48" value="1" required>
                <button type="button" class="remove-reminder" style="display:none;">Remove</button>`;
            remindersContainer.appendChild(div);
            setTimeout(() => {
                document.getElementById('successMessage').style.display = 'none';
            }, 2500);
        } else {
            alert('Failed to schedule meeting.');
        }
    } catch (err) {
        alert('Error connecting to server.');
    }
});

// Dynamic reminders logic
const remindersContainer = document.getElementById('remindersContainer');
const addReminderBtn = document.getElementById('addReminder');

addReminderBtn.addEventListener('click', function () {
    const div = document.createElement('div');
    div.className = 'reminder-input';
    div.innerHTML = `<input type="number" name="reminderHours[]" min="1" max="48" value="1" required>
        <button type="button" class="remove-reminder">Remove</button>`;
    remindersContainer.appendChild(div);
    updateRemoveButtons();
});

remindersContainer.addEventListener('click', function (e) {
    if (e.target.classList.contains('remove-reminder')) {
        e.target.parentElement.remove();
        updateRemoveButtons();
    }
});

function updateRemoveButtons() {
    const reminderInputs = remindersContainer.querySelectorAll('.reminder-input');
    reminderInputs.forEach((div, idx) => {
        const btn = div.querySelector('.remove-reminder');
        btn.style.display = reminderInputs.length > 1 ? 'inline-block' : 'none';
    });
}

// Fetch and display meetings for the logged-in user
async function loadMeetings() {
    const table = document.getElementById('meetingsTable');
    if (!table) return;
    table.innerHTML = '<tr><th>Name</th><th>Date & Time</th><th>Notes</th><th>Reminders (hrs before)</th></tr>';
    try {
        const res = await fetch('/api/meetings');
        if (!res.ok) throw new Error('Not logged in');
        const meetings = await res.json();
        if (meetings.length === 0) {
            table.innerHTML += '<tr><td colspan="4" style="text-align:center;">No meetings scheduled.</td></tr>';
        } else {
            meetings.forEach(m => {
                table.innerHTML += `<tr>
                    <td>${m.meetingName || ''}</td>
                    <td>${m.meetingDate ? new Date(m.meetingDate).toLocaleString() : ''}</td>
                    <td>${m.notes || ''}</td>
                    <td>${Array.isArray(m.reminders) ? m.reminders.join(', ') : ''}</td>
                </tr>`;
            });
        }
    } catch (err) {
        table.innerHTML += '<tr><td colspan="4" style="text-align:center; color:#b91c1c;">Please log in to view meetings.</td></tr>';
    }
}

window.addEventListener('DOMContentLoaded', loadMeetings);

document.getElementById('logoutBtn')?.addEventListener('click', async function () {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = 'auth.html';
});
