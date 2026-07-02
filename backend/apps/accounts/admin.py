from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	model = User
	list_display = ("username", "email", "first_name", "last_name", "is_admin", "is_active")
	list_filter = ("is_admin", "is_active", "is_staff", "is_superuser")
	search_fields = ("username", "email", "first_name", "last_name")
	ordering = ("username",)

	fieldsets = DjangoUserAdmin.fieldsets + (("Role", {"fields": ("is_admin",)}),)
