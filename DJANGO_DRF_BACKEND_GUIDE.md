# Django REST Framework (DRF) Backend Specification & Quickstart Guide

This guide provides the complete blueprint to build and connect the Django REST Framework (DRF) backend to the **ILA Global** frontend application.

The frontend is fully configured to interface with DRF at `http://127.0.0.1:8000/api/v1` using standard JWT Bearer authentication.

---

## 1. Quickstart & Installation

```bash
# 1. Create a virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 2. Install required packages
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers

# 3. Create Django project and core app
django-admin startproject backend_project .
python manage.py startapp api
```

---

## 2. Django Settings Configuration (`settings.py`)

Add the installed apps and CORS middleware:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party packages
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    
    # Local apps
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Put CorsMiddleware at the top
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS Settings for Frontend (Vite)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",  # Course Creator Studio dev server
]
CORS_ALLOW_CREDENTIALS = True

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': None, # Or 'rest_framework.pagination.PageNumberPagination'
}

# SimpleJWT Configuration
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

---

## 3. Data Models (`api/models.py`)

```python
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('employee', 'Employee'),
        ('team', 'Team / Staff'),
        ('employer', 'Employer'),
        ('Super Admin', 'Super Admin'),
        ('General Manager', 'General Manager'),
        ('Finance Officer', 'Finance Officer'),
        ('HR Manager', 'HR Manager'),
        ('Marketing Exec', 'Marketing Exec'),
        ('Academic Counselor', 'Academic Counselor'),
        ('Education', 'Education'),
        ('Visa', 'Visa'),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='student')
    department = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    hr_issued_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    hr_approval_status = models.CharField(
        max_length=50,
        choices=[('Pending HR Approval', 'Pending HR Approval'), ('Verified', 'Verified'), ('Rejected', 'Rejected')],
        default='Verified'
    )
    status = models.CharField(
        max_length=50,
        choices=[('Active', 'Active'), ('On Leave', 'On Leave'), ('Terminated', 'Terminated'), ('Suspended', 'Suspended')],
        default='Active'
    )

class Inquiry(models.Model):
    CATEGORY_CHOICES = [
        ('Education', 'Education'),
        ('Study Abroad', 'Study Abroad'),
        ('Visa', 'Visa'),
        ('Jobs', 'Jobs'),
        ('Work While You Study', 'Work While You Study'),
        ('General Front Office', 'General Front Office'),
    ]
    STATUS_CHOICES = [
        ('New Lead', 'New Lead'),
        ('In Progress', 'In Progress'),
        ('Closed Won', 'Closed Won'),
        ('Closed Lost', 'Closed Lost'),
    ]
    PAYMENT_CHOICES = [
        ('Pending', 'Pending'),
        ('Contacted', 'Contacted'),
        ('Partially Paid', 'Partially Paid'),
        ('Paid', 'Paid'),
        ('Link Sent', 'Link Sent'),
        ('Refunded', 'Refunded'),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    type = models.CharField(max_length=50, default='Online')
    token_number = models.CharField(max_length=50, blank=True, null=True)
    course = models.CharField(max_length=255, blank=True, null=True)
    path = models.CharField(max_length=255, blank=True, null=True)
    batch = models.CharField(max_length=255, blank=True, null=True)
    slot = models.CharField(max_length=255, blank=True, null=True)
    price = models.CharField(max_length=50, default='0')
    payment_status = models.CharField(max_length=50, choices=PAYMENT_CHOICES, default='Pending')
    amount_paid = models.CharField(max_length=50, blank=True, null=True)
    total_amount = models.CharField(max_length=50, blank=True, null=True)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default='General Front Office')
    crm_status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='New Lead')
    pipeline_stage = models.CharField(max_length=50, default='Intake')
    assigned_staff_id = models.CharField(max_length=50, blank=True, null=True)
    assigned_staff_name = models.CharField(max_length=255, blank=True, null=True)
    follow_up_date = models.CharField(max_length=50, blank=True, null=True)
    follow_up_status = models.CharField(max_length=50, blank=True, null=True)
    visa_processing_stage = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class FollowUpRecord(models.Model):
    inquiry = models.ForeignKey(Inquiry, related_name='follow_ups', on_delete=models.CASCADE)
    date = models.CharField(max_length=50)
    staff_name = models.CharField(max_length=255)
    channel = models.CharField(max_length=50)
    notes = models.TextField()
    outcome = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

class EnterpriseTask(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_to_dept = models.CharField(max_length=100)
    status = models.CharField(max_length=50, choices=[('Pending', 'Pending'), ('In Progress', 'In Progress'), ('Success', 'Success'), ('Negative', 'Negative')], default='Pending')
    priority = models.CharField(max_length=50, choices=[('High', 'High'), ('Medium', 'Medium'), ('Low', 'Low')], default='Medium')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class AttendanceLog(models.Model):
    staff_id = models.CharField(max_length=50)
    staff_name = models.CharField(max_length=255)
    check_in_time = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='Present')
    date = models.CharField(max_length=50)

class ApprovalRequest(models.Model):
    type = models.CharField(max_length=100)
    description = models.TextField()
    requested_by = models.CharField(max_length=255)
    department = models.CharField(max_length=100)
    status = models.CharField(max_length=50, choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')], default='Pending')
    date = models.CharField(max_length=50)
```

---

## 4. Serializers (`api/serializers.py`)

```python
from rest_framework import serializers
from .models import User, Inquiry, FollowUpRecord, EnterpriseTask, AttendanceLog, ApprovalRequest
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'name': self.user.get_full_name() or self.user.username,
            'role': getattr(self.user, 'role', 'Super Admin'),
            'department': getattr(self.user, 'department', ''),
        }
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'department', 'phone', 'hr_issued_id', 'status']

class FollowUpRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUpRecord
        fields = '__all__'

class InquirySerializer(serializers.ModelSerializer):
    follow_ups = FollowUpRecordSerializer(many=True, read_only=True)
    class Meta:
        model = Inquiry
        fields = '__all__'

class EnterpriseTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnterpriseTask
        fields = '__all__'

class AttendanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceLog
        fields = '__all__'

class ApprovalRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalRequest
        fields = '__all__'
```

---

## 5. Views & Endpoints (`api/views.py`)

```python
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Inquiry, FollowUpRecord, EnterpriseTask, AttendanceLog, ApprovalRequest
from .serializers import (
    CustomTokenObtainPairSerializer, UserSerializer, InquirySerializer,
    FollowUpRecordSerializer, EnterpriseTaskSerializer, AttendanceLogSerializer, ApprovalRequestSerializer
)

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name', '')
        role = request.data.get('role', 'student')
        department = request.data.get('department', '')

        if not email or not password:
            return Response({'detail': 'Email and password required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'detail': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=full_name,
            role=role,
            department=department
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.get_full_name() or user.username,
                'role': user.role,
                'department': user.department
            }
        }, status=status.HTTP_201_CREATED)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'detail': 'New password is required.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password changed successfully.'})

class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

class StaffViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class InquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.all().order_by('-created_at')
    serializer_class = InquirySerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = EnterpriseTask.objects.all()
    serializer_class = EnterpriseTaskSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = AttendanceLog.objects.all()
    serializer_class = AttendanceLogSerializer

class ApprovalViewSet(viewsets.ModelViewSet):
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer
```

---

## 6. URL Routing (`urls.py`)

In `backend_project/urls.py`:

```python
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from api.views import (
    CustomLoginView, RegisterView, ChangePasswordView, CurrentUserView,
    StaffViewSet, InquiryViewSet, TaskViewSet, AttendanceViewSet, ApprovalViewSet
)

router = DefaultRouter()
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'inquiries', InquiryViewSet, basename='inquiries')
router.register(r'tasks', TaskViewSet, basename='tasks')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'approvals', ApprovalViewSet, basename='approvals')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication routes
    path('api/v1/auth/login/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/v1/auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/v1/auth/me/', CurrentUserView.as_view(), name='current_user'),

    # REST API Resources
    path('api/v1/', include(router.urls)),
]
```

---

## 7. Connecting Frontend to DRF

1. Make sure your Django dev server is running:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
2. Verify frontend `.env`:
   ```ini
   VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
   ```
3. Run the frontend:
   ```bash
   npm run dev
   ```
4. All login, registration, password updates, staff provisioning, and CRM leads will automatically route to your Django REST Framework API!
