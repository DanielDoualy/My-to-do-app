from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register_view, name="register"),
    path("task/", views.task_view, name="task"),
    path("task/edit/<int:task_id>/", views.edit_task, name="edit_task"),
    path("task/delete/<int:task_id>/", views.delete_task, name="delete_task"),
    
    # API - TRÈS IMPORTANT : mêmes noms que dans les fetch()
    path("api/tasks/", views.api_tasks, name="api_tasks"),
    path("api/tasks/<int:task_id>/delete/", views.api_task_delete, name="api_task_delete"),
    path("api/tasks/<int:task_id>/update/", views.api_task_update, name="api_task_update"),
    path("api/tasks/<int:task_id>/toggle/", views.api_task_toggle, name="api_task_toggle"), 
]