from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'service', 'scheduled_at', 'status', 'created_at')
    list_filter = ('status', 'created_at', 'scheduled_at')
    search_fields = ('client__email', 'service__title')
    readonly_fields = ('id', 'created_at', 'updated_at')
    fieldsets = (
        ('Booking Info', {'fields': ('id', 'client', 'service')}),
        ('Schedule', {'fields': ('scheduled_at', 'notes')}),
        ('Status', {'fields': ('status',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
