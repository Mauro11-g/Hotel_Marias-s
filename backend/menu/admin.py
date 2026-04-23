from django.contrib import admin
from .models import Categoria, Platillo

# Esto hace que aparezcan en el panel de control
admin.site.register(Categoria)
admin.site.register(Platillo)