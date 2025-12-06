Taskflow— Django + React Hybrid Application
Overview

This project is a hybrid web application built using Django for the backend and React for the dynamic frontend experience. The To-Do App(Taskflow) allows authenticated users to create, edit, delete, and organize personal tasks in a clean and responsive interface. Although task applications are common, the purpose of this project was not only to reproduce basic functionality, but to design an architecture that integrates a traditional Django application with a modern React-based interface inside the same template system. This combination required careful planning, non-trivial debugging, and a deeper understanding of how Django’s static files, REST patterns, and React’s rendering pipelines interact within a shared environment.

One of the distinct goals of this project was to explore how React can progressively enhance a server-rendered Django page, instead of replacing it entirely. This approach differs significantly from typical full-stack projects where React acts as a standalone SPA consuming Django REST APIs. In this project, React components are embedded inside Django templates through Babel compilation, allowing React to control interactive components while Django manages routing, authentication, and base templates. Working within this dual-layer architecture introduced challenges related to script compilation, CSRF handling, cross-component communication, and adapting React to operate without the typical bundling process.

The complexity of this project also lies in the implementation of a custom, lightweight API system inside Django, enabling React to handle important features such as task deletion, completion, and live task updates without reloading the page. Instead of relying on Django’s default form submissions or large libraries like Django REST Framework, I implemented manual JSON endpoints using Django views. This decision forced me to deeply understand request methods, JSON serialization, status codes, CSRF tokens, and how to return structured API responses compatible with React components. The project required designing reusable utility functions to manage fetch requests, error handling, and CSRF management on the client side.

What also distinguishes this project is the attention to UI/UX detail, including responsive card layouts, hover effects, conditional rendering of missing descriptions, visually appealing icons with Bootstrap Icons, and fully dynamic confirmation dialogs written in React rather than using the browser’s default alert() or confirm() pop-ups. The app is designed to work across devices, including iOS browsers, which required additional handling for script loading, viewport behavior, and cross-origin restrictions. Taken together, these considerations elevate the project beyond a simple CRUD app into a polished, modern, hybrid environment.

Features
✔ Task Management

Create new tasks

Edit existing tasks

Delete tasks with a React confirmation popup

Mark tasks as completed (React-driven UI interaction)

Show creation date and formatted timestamps

Display “no description” placeholder when needed

✔ Modern UI

Responsive task cards

Clean and minimal design using Bootstrap 4 and Bootstrap Icons

Blue hover highlight on task cards

Grid layout with spacing and large cards for readability

Smooth experience on mobile and iOS browsers

✔ Authentication

Users must be logged in to view or manage tasks

Username visible in the navigation bar

✔ Hybrid Frontend (Django + React)

React components rendered inside Django templates

No build tools — Babel compiles React code in the browser

Dedicated API utilities for communicating with Django views

Real-time UI updates without reloading the page

Project Structure
task/
│
├── templates/task/
│     ├── layout.html
│     ├── task_list.html
│     └── edit_task.html
│
├── static/task/js/
│     ├── utils/
│     │     ├── csrf.js
│     │     ├── api.js
│     │
│     ├── components/
│     │     ├── TaskCard.js
│     │     ├── TaskList.js
│     │     └── TaskForm.js
│     │
│     └── app.js
│
└── views.py

Backend (Django)
Models

A simple and clean Task model:

class Task(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)

Views

Standard Django template views (index, task list, edit page)

JSON-based API views:

delete_task_api(request, id)

complete_task_api(request, id)

create_task_api(request)

update_task_api(request, id)

These views return structured JSON responses such as:

{
  "success": true,
  "message": "Task deleted successfully"
}

Routing

urls.py includes both template routes and /api/... routes for React.

Frontend (React)

React is used to enhance specific parts of the app:

TaskCard.js

Renders each task card

Handles delete and completion actions

Shows a custom confirmation popup

Updates UI without reloading

TaskList.js

Fetches all tasks from Django

Renders all cards dynamically

TaskForm.js

Displays a React form

Sends POST requests to Django API to create new tasks

Utilities

csrf.js extracts CSRF token from cookies

api.js wraps fetch() with consistent error handling

Installation & Usage
1. Clone the repository
git clone <repo-url>
cd todo-project

2. Install dependencies
pip install -r requirements.txt

3. Run migrations
python manage.py makemigrations
python manage.py migrate

4. Run the server
python manage.py runserver


Visit:

http://127.0.0.1:8000

Future Improvements

Allow task categories

Add drag-and-drop reordering

Add due dates and reminders

Add progress analytics per user

Add API pagination for large task lists

Conclusion

This project is much more than a standard CRUD app.
It demonstrates the ability to:

combine Django and React without a build system

design custom JSON APIs

manage frontend interactions with real-time updates

address UX constraints across platforms (desktop, Android, iOS)

create a clean and visually polished interface

understand CSRF, routing, state management, and component architecture

This hybrid approach reflects a modern full-stack development workflow and provides a strong foundation for more advanced web applications.
