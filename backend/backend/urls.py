from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from menu.views import CategoriaViewSet, PlatilloViewSet

# Creamos el enrutador de nuestra API
router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'platillos', PlatilloViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('i18n/', include('django.conf.urls.i18n')), # <-- ¡ESTA ES LA LÍNEA MÁGICA QUE FALTA!
]

admin.site.site_header = "Administración del Bar"
admin.site.site_title = "Portal del Gerente"
admin.site.index_title = "Bienvenido al Gestor del Bar"