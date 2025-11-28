# 🎯 HR AI - Système de Recrutement Intelligent

## 📋 Description

**HR AI** est une plateforme web de recrutement assistée par Intelligence Artificielle qui analyse automatiquement les CV et matche les candidats avec les offres d'emploi en utilisant un modèle NLP fine-tuné (MiniLM).

### 🎯 Fonctionnalités Principales

- 🤖 **Analyse IA des CV** avec scoring automatique et extraction de compétences
- 👥 **3 types d'utilisateurs** : Administrateur, Recruteur, Candidat
- 📊 **Tableaux de bord interactifs** avec statistiques en temps réel
- 📧 **Notifications email** (SMTP) et réinitialisation de mot de passe
- 🔍 **Recherche et filtrage avancés** d'offres d'emploi
- 🏆 **Classement intelligent** des candidatures par score IA
- 📈 **Recommandations IA** personnalisées pour chaque candidature

## 🛠️ Technologies Utilisées

**Backend** : Django 5.2.8, Django REST Framework, PostgreSQL, JWT  
**Frontend** : React 19.2.0, Vite, React Router, Axios  
**IA/ML** : sentence-transformers (MiniLM-L6-v2), PyTorch, PyPDF2

## 📂 Structure du Projet

```
cv_ia/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── accounts/           # Gestion utilisateurs et authentification
│   ├── ai_engine/          # Moteur IA (MiniLM, analyse CV)
│   │   ├── pipeline.py
│   │   ├── train_minilm.py
│   │   ├── data/
│   │   │   └── resume_dataset_1200.csv
│   │   └── models/
│   │       └── hr_matching_minilm/  # Modèle fine-tuné (non versionné)
│   ├── applications/       # Gestion des candidatures
│   ├── jobs/              # Gestion des offres d'emploi
│   └── hr_ai/             # Configuration Django
└── frontend/
    ├── package.json
    ├── src/
    │   ├── pages/         # Login, Register, Dashboards, Profile
    │   ├── components/    # Navbar, ProtectedRoute
    │   ├── context/       # AuthContext
    │   └── api/          # Configuration Axios
    └── public/
```

## 🚀 Installation Rapide

### 📋 Prérequis
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Git

---

### 1️⃣ Cloner le Projet

```bash
git clone https://github.com/essidabdel/smart_recruiter.git
cd smart_recruiter
```

---

### 2️⃣ Configuration PostgreSQL

Ouvrir **psql** ou **pgAdmin** et exécuter :

```sql
CREATE USER hr_user WITH PASSWORD '1234';
CREATE DATABASE cv_ia_db OWNER hr_user;
GRANT ALL PRIVILEGES ON DATABASE cv_ia_db TO hr_user;
```

---

### 3️⃣ Installation Backend (Django)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

#### Configuration Email (Optionnel)

Créer un fichier `.env` dans `backend/` :

```env
EMAIL_HOST_USER=votre.email@gmail.com
EMAIL_HOST_PASSWORD=votre_mot_de_passe_app
FRONTEND_URL=http://localhost:5173
```

---

### 4️⃣ Installation Frontend (React)

```bash
cd frontend
npm install
```

---

### ⚠️ 5️⃣ **IMPORTANT : Installation du Modèle IA**

Le modèle MiniLM fine-tuné (~450 MB) **n'est pas versionné sur GitHub**. Vous devez soit le télécharger, soit l'entraîner.

#### 🔹 **Option 1 : Télécharger le modèle de base (Recommandé - 2 min)**

```bash
cd backend
pip install sentence-transformers
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2').save('ai_engine/models/hr_matching_minilm/')"
```

✅ Le modèle sera sauvegardé dans `backend/ai_engine/models/hr_matching_minilm/`

#### 🔹 **Option 2 : Entraîner votre propre modèle (10-15 min)**

```bash
cd backend
python ai_engine/train_minilm.py
```

✅ Le modèle sera entraîné sur le dataset `resume_dataset_1200.csv` et sauvegardé automatiquement

> **Note** : L'Option 1 utilise un modèle pré-entraîné générique. L'Option 2 crée un modèle spécialisé pour le matching CV/Emploi.

---

### 6️⃣ Lancer l'Application

#### Terminal 1 - Backend
```bash
cd backend
venv\Scripts\activate  # Windows
python manage.py runserver
```
➡️ Backend : **http://localhost:8000**  
➡️ Admin : **http://localhost:8000/admin**

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
➡️ Frontend : **http://localhost:5173**

---

## 📖 Guide d'Utilisation

### Créer un Compte

1. Aller sur **http://localhost:5173/register**
2. Choisir le rôle (Candidat ou Recruteur)
3. Remplir le formulaire d'inscription

### Workflow Complet

1. **Recruteur** : Créer une offre d'emploi dans le Dashboard
2. **Candidat** : Consulter les offres et postuler (upload CV PDF)
3. **Système IA** : Analyse automatique du CV et calcul du score
4. **Recruteur** : Voir le score IA, recommandations et gérer les statuts
5. **Candidat** : Recevoir une notification email

---

## 🎓 Questions / Réponses Techniques

### 1. Comment implémenter la gestion des utilisateurs avec des rôles différents dans Django ?

Pour implémenter la gestion des utilisateurs avec des rôles différents dans Django, il est intéressant d'utiliser les **Groupes intégrés** au système d'authentification. Chaque rôle est défini comme un **Groupe** auquel nous attribuons des permissions spécifiques, par exemple la modification d'une offre ou encore la suppression d'un commentaire.

**Dans notre projet**, nous avons créé un modèle `User` personnalisé avec un champ `role` :

```python
class User(AbstractUser):
    class Role(models.TextChoices):
        CANDIDATE = "candidate", "Candidat"
        RECRUITER = "recruiter", "Recruteur"
        ADMIN = "admin", "Admin"
    
    role = models.CharField(max_length=20, choices=Role.choices)
```

Pour vérifier les accès :
- `request.user.groups.filter(name='Administrateur').exists()`
- `request.user.has_perm('jobs.change_jobposting')`
- Ou simplement : `request.user.role == User.Role.RECRUITER`

### 2. Quels sont les mécanismes pour sécuriser les mots de passe des utilisateurs ?

Dans Django, la sécurité des mots de passe repose principalement sur le **hachage fort** et l'utilisation de **sel**. Les mots de passe ne sont jamais stockés en clair mais utilisent l'algorithme **PBKDF2 avec SHA256** pour créer une empreinte cryptographique. 

Ensuite, un **sel unique et aléatoire** est ajouté au mot de passe avant le hachage afin de se protéger contre les attaques par tables arc-en-ciel (rainbow tables).

**Dans notre projet**, Django gère automatiquement le hachage :
```python
# Django hash automatiquement avec create_user()
user = User.objects.create_user(
    username=username,
    password=password,  # Sera haché automatiquement
    email=email
)
```

Configuration des validateurs dans `settings.py` :
```python
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
```

### 3. Comment entraîner un modèle NLP pour l'analyse des CV ?

Pour entraîner un modèle NLP, il faut :

1. **Avoir un grand ensemble de données** de CV correspondant à nos tâches
2. **Choisir une architecture de modèle NLP**, comme BERT ou MiniLM
3. **Entraîner le modèle** avec ce jeu de données pour apprendre à identifier et extraire les informations pertinentes

**Dans notre projet**, nous utilisons **MiniLM (sentence-transformers)** :

```python
# ai_engine/train_minilm.py
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

# 1. Charger le modèle pré-entraîné
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# 2. Préparer les données d'entraînement (CV + descriptions de poste)
train_examples = [
    InputExample(texts=[cv_text, job_desc], label=similarity_score),
    # ... plus d'exemples
]

# 3. Créer le DataLoader
train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)

# 4. Définir la fonction de perte
train_loss = losses.CosineSimilarityLoss(model)

# 5. Entraîner le modèle
model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=4,
    warmup_steps=100
)

# 6. Sauvegarder le modèle
model.save('ai_engine/models/hr_matching_minilm/')
```

### 4. Comment intégrer ce modèle dans une application Django ?

Pour intégrer le modèle, nous devons :

1. **Enregistrer le modèle** (format pickle ou joblib)
2. **Le charger dans la mémoire** de l'application
3. **Créer une API View** qui reçoit le CV, le pré-traite et le transmet au modèle

**Dans notre projet** :

```python
# ai_engine/services/resume_analyzer.py
from sentence_transformers import SentenceTransformer, util

# Charger le modèle une seule fois au démarrage
_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('ai_engine/models/hr_matching_minilm/')
    return _model

def compute_similarity_score(cv_text: str, job_description: str) -> float:
    model = get_model()
    embeddings = model.encode([cv_text, job_description], convert_to_tensor=True)
    similarity = util.cos_sim(embeddings[0], embeddings[1]).item()
    return float(similarity)
```

```python
# ai_engine/pipeline.py
def analyze_application(application_id: int):
    app = Application.objects.get(id=application_id)
    
    # 1. Extraire le texte du CV
    cv_text = extract_text_from_pdf(app.cv_file.path)
    
    # 2. Calculer le score avec le modèle IA
    similarity = compute_similarity_score(cv_text, app.job.description)
    
    # 3. Sauvegarder le score
    ApplicationScore.objects.create(
        application=app,
        similarity_score=similarity,
        final_score=similarity
    )
```

### 5. Quelles sont les pratiques recommandées pour optimiser les performances d'une application Django ?

Pour optimiser les performances, il faut se concentrer sur :
- **Réduction des requêtes de base de données**
- **Accélération du rendu côté serveur**

**Pratiques recommandées** :

#### a) Optimisation des requêtes ORM

```python
# ❌ Mauvais : N+1 queries
applications = Application.objects.all()
for app in applications:
    print(app.candidate.username)  # Une requête par itération !
    print(app.job.title)

# ✅ Bon : select_related pour les ForeignKey
applications = Application.objects.select_related('candidate', 'job').all()
for app in applications:
    print(app.candidate.username)  # Pas de requête supplémentaire
    print(app.job.title)

# ✅ prefetch_related pour les relations Many-to-Many
jobs = JobPosting.objects.prefetch_related('applications__candidate').all()
```

#### b) Mise en cache

```python
from django.core.cache import cache

def get_global_stats():
    stats = cache.get('global_stats')
    if stats is None:
        stats = compute_expensive_stats()
        cache.set('global_stats', stats, timeout=300)  # 5 minutes
    return stats
```

#### c) Pagination

```python
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
```

#### d) Index de base de données

```python
class Application(models.Model):
    status = models.CharField(max_length=20, db_index=True)
    final_score = models.FloatField(db_index=True)
```

### 6. Comment sécuriser une application Django contre les attaques courantes (CSRF, XSS) ?

#### Protection CSRF (Cross-Site Request Forgery)

Django fournit une **protection intégrée CSRF** via le middleware `CsrfViewMiddleware`. Pour les API REST, on utilise JWT qui évite les attaques CSRF.

**Dans notre projet** :
```python
# settings.py
MIDDLEWARE = [
    'django.middleware.csrf.CsrfViewMiddleware',  # Protection CSRF
]

# Authentification JWT (immune au CSRF)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

#### Protection XSS (Cross-Site Scripting)

Django **échappe automatiquement** le contenu dans les templates. React fait de même par défaut.

**Bonnes pratiques** :
- Ne jamais utiliser `|safe` sur du contenu utilisateur
- Valider et nettoyer les entrées côté serveur
- React : éviter `dangerouslySetInnerHTML`

```python
import bleach

def clean_user_input(text):
    return bleach.clean(text, tags=['p', 'strong', 'em'], strip=True)
```

---

## 🐛 Dépannage

### Erreur "No module named 'sentence_transformers'"
```bash
pip install sentence-transformers
```

### Erreur "ModuleNotFoundError: No module named 'ai_engine.models'"
Assurez-vous d'avoir installé le modèle IA (voir Section 5 ci-dessus)

### Erreur PostgreSQL "FATAL: database does not exist"
Créez la base de données avec les commandes SQL de la Section 2

### Port 8000 ou 5173 déjà utilisé
```bash
# Backend
python manage.py runserver 8001

# Frontend
npm run dev -- --port 5174
```

---

## 📊 API Endpoints

### Authentification
- `POST /api/accounts/register/` - Inscription
- `POST /api/accounts/login/` - Connexion
- `POST /api/accounts/token/refresh/` - Rafraîchir le token
- `GET /api/accounts/me/` - Profil utilisateur
- `POST /api/accounts/forgot-password/` - Demande de réinitialisation
- `POST /api/accounts/reset-password/` - Réinitialiser le mot de passe

### Offres d'Emploi
- `GET /api/jobs/` - Liste des offres
- `POST /api/jobs/` - Créer une offre (recruteur)
- `GET /api/jobs/{id}/` - Détails d'une offre
- `PUT /api/jobs/{id}/` - Modifier une offre
- `DELETE /api/jobs/{id}/` - Supprimer une offre

### Candidatures
- `GET /api/applications/` - Liste des candidatures
- `POST /api/applications/` - Créer une candidature
- `GET /api/applications/{id}/` - Détails d'une candidature
- `PATCH /api/applications/{id}/` - Modifier le statut
- `POST /api/applications/{id}/analyze/` - Analyser avec l'IA

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Projet académique - Libre d'utilisation pour l'éducation et le portfolio

---

## 👤 Auteur

**Abdel ESSID**  
📧 Email : [essidabdel@github](https://github.com/essidabdel)  
🔗 GitHub : [essidabdel/smart_recruiter](https://github.com/essidabdel/smart_recruiter)

---

## 🙏 Remerciements

- **Sentence Transformers** pour les modèles NLP pré-entraînés
- **Django** et **React** pour les frameworks
- **PostgreSQL** pour la base de données robuste

---

**- Novembre 2025**
