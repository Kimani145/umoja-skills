from django.contrib import admin
from .models import ServiceCategory, ServiceListing

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(ServiceListing)
class ServiceListingAdmin(admin.ModelAdmin):
    list_display = ('title', 'provider', 'category', 'price_kes', 'service_area', 'is_active', 'created_at')
    list_filter = ('is_active', 'category', 'created_at')
    search_fields = ('title', 'description', 'provider__email')
    readonly_fields = ('id', 'created_at', 'updated_at', 'average_rating', 'total_reviews')
