from django.contrib import admin
from .models import User, VerificationRequest, EmailVerificationChallenge

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'is_verified', 'created_at')
    list_filter = ('role', 'is_verified', 'created_at')
    search_fields = ('email', 'phone', 'location')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'document_type', 'document_number', 'status', 'created_at')
    list_filter = ('status', 'document_type', 'created_at')
    search_fields = ('user__email', 'document_number')
    actions = ['approve_requests', 'reject_requests']

    def approve_requests(self, request, queryset):
        for req in queryset:
            req.status = 'APPROVED'
            req.save()
            user = req.user
            user.is_verified = True
            user.save(update_fields=['is_verified'])
        self.message_user(request, f"Approved {queryset.count()} verification requests (users verified).")
    approve_requests.short_description = "Approve selected verification requests"

    def reject_requests(self, request, queryset):
        for req in queryset:
            req.status = 'REJECTED'
            req.save()
            user = req.user
            user.is_verified = False
            user.save(update_fields=['is_verified'])
        self.message_user(request, f"Rejected {queryset.count()} verification requests.")
    reject_requests.short_description = "Reject selected verification requests"


@admin.register(EmailVerificationChallenge)
class EmailVerificationChallengeAdmin(admin.ModelAdmin):
    list_display = ('user', 'purpose', 'used', 'expires_at', 'created_at')
    list_filter = ('purpose', 'used', 'created_at')
    search_fields = ('user__email', 'code')
    readonly_fields = ('id', 'created_at')
