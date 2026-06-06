from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'role', 'is_verified', 'created_at')
    list_filter = ('role', 'is_verified', 'created_at')
    search_fields = ('email', 'username', 'phone', 'location')
    readonly_fields = ('id', 'created_at', 'updated_at')
