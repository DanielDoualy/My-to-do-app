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


from .models import *


# Create your views here.
def index(request):
    return render(request, "task/index.html")

# register view
def register_view(request):
    # le cas ou l'utilisateur soumet ces informations dans le formulaire 
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        
        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        
        if password != confirmation:
            return render(request, "task/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
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

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
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
    """ Recuperer les valeurs entrer dans le formulaire de la to-do-list
    et les stocker dans les variables une fois le formulaire soumis"""
    
    if request.method == "POST":
        title = request.POST["title"]
        description = request.POST["description"]
        user = request.user
        
        task = Task(title=title, description=description, user=user)
        task.save()
        
        # Rediriger vers la même page pour afficher la liste
        return HttpResponseRedirect(reverse("task"))
    
    else:
        # Afficher la liste des tâches en GET
        task_list = Task.objects.filter(user=request.user).order_by('-id')
        
        return render(request, "task/task_list.html", {
            "task_list": task_list
        })
        

@login_required
def edit_task(request, task_id):
    """Modifier une tâche existante"""
    try:
        # Vérifier que la tâche existe ET appartient à l'utilisateur
        task = get_object_or_404(Task, id=task_id, user=request.user)
    except Http404:
        # Si la tâche n'existe pas, rediriger vers la liste
        return HttpResponseRedirect(reverse("task"))
    
    if request.method == "POST":
        task.title = request.POST.get("title", task.title)
        task.description = request.POST.get("description", task.description)
        task.save()
        return HttpResponseRedirect(reverse("task"))
    
    return render(request, "task/edit_task.html", {
        "task": task
    })

@login_required
def delete_task(request, task_id):
    """Supprimer une tâche"""
    if request.method == "POST":
        try:
            # Vérifier que la tâche existe ET appartient à l'utilisateur
            task = get_object_or_404(Task, id=task_id, user=request.user)
            task.delete()
        except Http404:
            pass  # Si la tâche n'existe pas, ignorer
    
    return HttpResponseRedirect(reverse("task"))


# ==================== API ENDPOINTS ====================

@login_required
@ensure_csrf_cookie
def api_tasks(request):
    """API pour lister ou créer des tâches"""
    if request.method == "GET":
        # Récupérer toutes les tâches de l'utilisateur
        tasks = Task.objects.filter(user=request.user).order_by('-created_at')
        
        # Formater les données pour React
        tasks_data = []
        for task in tasks:
            tasks_data.append({
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'created_at': task.created_at.isoformat(),  # Format ISO pour JavaScript
                'completed': False  # Si vous n'avez pas ce champ dans le modèle
            })
        
        return JsonResponse({'tasks': tasks_data})

    elif request.method == "POST":
        data = json.loads(request.body)
        task = Task.objects.create(
            title=data.get('title', ''),
            description=data.get('description', ''),
            user=request.user
        )
        return JsonResponse({
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "created_at": task.created_at.isoformat()
            }
        })


@login_required
def api_task_delete(request, task_id):
    """API pour supprimer une tâche"""
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
    """API pour mettre à jour une tâche"""
    if request.method in ["PUT", "PATCH"]:
        try:
            task = get_object_or_404(Task, id=task_id, user=request.user)
            data = json.loads(request.body)
            
            task.title = data.get("title", task.title)
            task.description = data.get("description", task.description)
            task.save()
            
            return JsonResponse({
                "success": True,
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "created_at": task.created_at.isoformat()
                }
            })
        except Http404:
            return JsonResponse({"success": False, "error": "Task not found"}, status=404)
    
    return JsonResponse({"error": "Invalid request method"}, status=400)


@login_required
def api_task_toggle(request, task_id):
    """API pour basculer le statut de complétion d'une tâche"""
    if request.method in ["PUT", "PATCH", "POST"]:
        try:
            task = get_object_or_404(Task, id=task_id, user=request.user)
            
            # Basculer le statut
            task.status = not task.status
            task.save()
            
            return JsonResponse({
                "success": True,
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "created_at": task.created_at.isoformat(),
                    "status": task.status
                }
            })
        except Http404:
            return JsonResponse({"success": False, "error": "Task not found"}, status=404)
    
    return JsonResponse({"error": "Invalid request method"}, status=400)

# Modifiez aussi api_tasks pour inclure le statut
@login_required
@ensure_csrf_cookie
def api_tasks(request):
    """API pour lister ou créer des tâches"""
    if request.method == "GET":
        # Récupérer toutes les tâches de l'utilisateur
        tasks = Task.objects.filter(user=request.user).order_by('-created_at')
        
        # Formater les données pour React
        tasks_data = []
        for task in tasks:
            tasks_data.append({
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'created_at': task.created_at.isoformat(),
                'status': task.status  # AJOUTEZ CE CHAMP
            })
        
        return JsonResponse({'tasks': tasks_data})

    elif request.method == "POST":
        data = json.loads(request.body)
        task = Task.objects.create(
            title=data.get('title', ''),
            description=data.get('description', ''),
            user=request.user,
            status=False  # Nouvelle tâche non complétée par défaut
        )
        return JsonResponse({
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "created_at": task.created_at.isoformat(),
                "status": task.status
            }
        })