const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Add JSON parsing middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Configure nodemailer transporter (use your Gmail and app password)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shareloophp@gmail.com',
        pass: 'jxzmqqbneekxxikr'
    }
});
// Helper to schedule email reminders
function scheduleEmailReminders(meeting, userEmail) {
    if (!Array.isArray(meeting.reminders)) return;
    meeting.reminders.forEach(hoursBefore => {
        const meetingTime = new Date(meeting.meetingDate).getTime();
        const reminderTime = meetingTime - hoursBefore * 60 * 60 * 1000;
        const delay = reminderTime - Date.now();
        if (delay > 0) {
            setTimeout(() => {
                transporter.sendMail({
                    from: 'shareloophp@gmail.com',
                    to: userEmail,
                    subject: `Meeting Reminder: ${meeting.meetingName}`,
                    text: `This is a reminder for your meeting "${meeting.meetingName}" scheduled at ${meeting.meetingDate}.
Notes: ${meeting.notes || 'None'}`
                }, (err, info) => {
                    if (err) {
                        console.error('Error sending reminder email:', err);
                    } else {
                        console.log('Reminder email sent:', info.response);
                    }
                });
            }, delay);
        }
    });
}

// Signup endpoint
app.post('/api/signup', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required.' });
    }
    const users = JSON.parse(fs.readFileSync('users.json'));
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ message: 'User already exists.' });
    }
    const hashed = bcrypt.hashSync(password, 10);
    users.push({ email, password: hashed });
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.status(201).json({ message: 'Signup successful.' });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required.' });
    }
    const users = JSON.parse(fs.readFileSync('users.json'));
    const user = users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }
    req.session.user = { email };
    res.json({ message: 'Login successful.' });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ message: 'Logged out.' });
    });
});

// Middleware to check authentication
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }
    next();
}

// Update meeting endpoint to require authentication and save meetings per user
app.post('/api/meetings', requireAuth, (req, res) => {
    const meeting = req.body;
    const userEmail = req.session.user.email;
    let meetings = [];
    if (fs.existsSync('meetings.json')) {
        meetings = JSON.parse(fs.readFileSync('meetings.json'));
    }
    meetings.push({ ...meeting, user: userEmail });
    fs.writeFileSync('meetings.json', JSON.stringify(meetings, null, 2));
    // Schedule email reminders
    scheduleEmailReminders(meeting, userEmail);
    res.status(201).json({ message: 'Meeting scheduled successfully' });
});

// Endpoint to get meetings for logged-in user
app.get('/api/meetings', requireAuth, (req, res) => {
    const userEmail = req.session.user.email;
    let meetings = [];
    if (fs.existsSync('meetings.json')) {
        meetings = JSON.parse(fs.readFileSync('meetings.json'));
    }
    const userMeetings = meetings.filter(m => m.user === userEmail);
    res.json(userMeetings);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});