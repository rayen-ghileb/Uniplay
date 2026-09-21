from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	model = User
	list_display = ("username", "email", "first_name", "last_name", "sex", "date_of_birth", "is_admin", "is_superadmin", "is_employee", "is_active")
	list_filter = ("is_admin", "is_superadmin", "is_employee", "is_active", "is_staff", "is_superuser")
	search_fields = ("username", "email", "first_name", "last_name")
	ordering = ("username",)

	fieldsets = DjangoUserAdmin.fieldsets + (
		("Profil", {"fields": ("phone_number", "classe", "specialite", "sex", "date_of_birth", "photo")}),
		("Role", {"fields": ("is_admin", "is_superadmin", "is_employee")}),
	)
