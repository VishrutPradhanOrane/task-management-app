# Task Management Application

A simple task management application built with SAP UI5 for managers.

## Features

- View all tasks in a table format
- Filter tasks by status (All, Pending, In Progress, Completed)
- Search tasks by title, description, or assignee
- Create new tasks
- Edit existing tasks
- Delete tasks
- Task details include:
  - Title
  - Description
  - Assignee
  - Priority (Low, Medium, High)
  - Status (Pending, In Progress, Completed)
  - Due Date

## Getting Started

### Local Development

1. Start a local web server:
   ```bash
   python -m http.server 8000
   ```
   Or use Node.js:
   ```bash
   npx http-server -p 8000
   ```

2. Open `http://localhost:8000` in your browser
3. The application will load with mock data
4. Use the "New Task" button to create tasks
5. Use the search and filter options to find specific tasks
6. Click the edit or delete icons to manage tasks

### Demo Credentials
- **Manager**: `manager` / `manager123`
- **Admin**: `admin` / `admin123`
- **User 1**: `user1` / `user123`
- **User 2**: `user2` / `user123`

## Deployment to Render

### Prerequisites
- A GitHub account
- A Render account (free tier available)

### Steps to Deploy

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure:
     - **Name**: task-management (or any name you prefer)
     - **Build Command**: Leave empty (no build needed)
     - **Publish Directory**: `.` (root directory)
   - Click "Create Static Site"
   - Render will automatically deploy your site

3. **Your app will be live at**: `https://your-app-name.onrender.com`

### Alternative: Using render.yaml

If you prefer using the `render.yaml` file:
- The `render.yaml` file is already configured
- Render will automatically detect and use it
- No additional configuration needed

## Technical Details

- Built with SAP UI5 framework
- Uses mock JSON data (no backend required)
- Responsive design that works on desktop, tablet, and mobile
- Modern Horizon theme

## File Structure

```
Task Management/
├── index.html                 # Application entry point
├── manifest.json             # UI5 application manifest
├── Component.js              # Main application component
├── webapp/
│   ├── controller/
│   │   └── TaskList.controller.js  # Main controller
│   ├── view/
│   │   ├── TaskList.view.xml       # Main view
│   │   └── TaskDialog.fragment.xml # Task dialog fragment
│   ├── model/
│   │   ├── tasks.json              # Mock task data
│   │   └── models.js               # Model utilities
│   └── i18n/
│       └── i18n.properties         # Internationalization
└── README.md
```

