from django.shortcuts import render
from django.http import HttpResponseRedirect, Http404, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
import json
from datetime import datetime

from .models import *


# Create your views here.
def index(request):
    return render(request, "task/index.html")

# register view
def register_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        
        if password != confirmation:
            return render(request, "task/register.html", {
                "message": "Passwords must match."
            })

        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "task/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "task/register.html")
    

# login view
def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "task/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "task/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


# task view
@login_required
@ensure_csrf_cookie
def task_view(request):
    if request.method == "POST":
        title = request.POST["title"]
        description = request.POST["description"]
        task_time = request.POST.get("task_time")  # NOUVEAU
        user = request.user
        
        # Créer la tâche avec l'heure si fournie
        task = Task(
            title=title, 
            description=description, 
            user=user,
            task_time=task_time if task_time else None
        )
        task.save()
        
        return HttpResponseRedirect(reverse("task"))
    
    else:
        task_list = Task.objects.filter(user=request.user).order_by('-id')
        
        return render(request, "task/task_list.html", {
            "task_list": task_list
        })
        

@login_required
def edit_task(request, task_id):
    try:
        task = get_object_or_404(Task, id=task_id, user=request.user)
    except Http404:
        return HttpResponseRedirect(reverse("task"))
    
    if request.method == "POST":
        task.title = request.POST.get("title", task.title)
        task.description = request.POST.get("description", task.description)
        task_time = request.POST.get("task_time")  # NOUVEAU
        
        # Mettre à jour l'heure
        if task_time:
            task.task_time = task_time
        else:
            task.task_time = None
            
        task.save()
        return HttpResponseRedirect(reverse("task"))
    
    return render(request, "task/edit_task.html", {
        "task": task
    })

@login_required
def delete_task(request, task_id):
    if request.method == "POST":
        try:
            task = get_object_or_404(Task, id=task_id, user=request.user)
            task.delete()
        except Http404:
            pass
    
    return HttpResponseRedirect(reverse("task"))


# ==================== API ENDPOINTS ====================

@login_required
@ensure_csrf_cookie
def api_tasks(request):
    """API pour lister ou créer des tâches"""
    if request.method == "GET":
        tasks = Task.objects.filter(user=request.user).order_by('-created_at')
        
        tasks_data = []
        for task in tasks:
            tasks_data.append({
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'created_at': task.created_at.isoformat(),
                'status': task.status,
                'task_time': task.task_time.strftime('%H:%M') if task.task_time else None  # NOUVEAU
            })
        
        return JsonResponse({'tasks': tasks_data})

    elif request.method == "POST":
        data = json.loads(request.body)
        
        # Gérer le champ task_time
        task_time = data.get('task_time')
        if task_time:
            try:
                # Convertir la chaîne en objet time
                task_time = datetime.strptime(task_time, '%H:%M').time()
            except:
                task_time = None
        
        task = Task.objects.create(
            title=data.get('title', ''),
            description=data.get('description', ''),
            user=request.user,
            status=False,
            task_time=task_time  # NOUVEAU
        )
        return JsonResponse({
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "created_at": task.created_at.isoformat(),
                "status": task.status,
                "task_time": task.task_time.strftime('%H:%M') if task.task_time else None  # NOUVEAU
            }
        })


@login_required
def api_task_delete(request, task_id):
    if request.method == "DELETE":
        try:
            task = get_object_or_404(Task, id=task_id, user=request.user)
            task.delete()
            return JsonResponse({"success": True, "message": "Task deleted successfully"})
        except Http404:
            return JsonResponse({"success": False, "error": "Task not found"}, status=404)
    
    return JsonResponse({"error": "Invalid request method"}, status=400)


@login_required
def api_task_update(request, task_id):
    if request.method in ["PUT", "PATCH"]:
        try:
            task = get_object_or_404(Task, id=task_id, user=request.user)
            data = json.loads(request.body)
            
            task.title = data.get("title", task.title)
            task.description = data.get("description", task.description)
            
            # Gérer le champ task_time
            if 'task_time' in data:
                task_time = data.get('task_time')
                if task_time:
                    try:
                        task.task_time = datetime.strptime(task_time, '%H:%M').time()
                    except:
                        pass
                else:
                    task.task_time = None
            
            task.save()
            
            return JsonResponse({
                "success": True,
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "created_at": task.created_at.isoformat(),
                    "task_time": task.task_time.strftime('%H:%M') if task.task_time else None  # NOUVEAU
                }
            })
        except Http404:
            return JsonResponse({"success": False, "error": "Task not found"}, status=404)
    
    return JsonResponse({"error": "Invalid request method"}, status=400)


@login_required
def api_task_toggle(request, task_id):
    if request.method in ["PUT", "PATCH", "POST"]:
        try:
            task = get_object_or_404(Task, id=task_id, user=request.user)
            
            task.status = not task.status
            task.save()
            
            return JsonResponse({
                "success": True,
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "created_at": task.created_at.isoformat(),
                    "status": task.status,
                    "task_time": task.task_time.strftime('%H:%M') if task.task_time else None  # NOUVEAU
                }
            })
        except Http404:
            return JsonResponse({"success": False, "error": "Task not found"}, status=404)
    
    return JsonResponse({"error": "Invalid request method"}, status=400)