from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from menu.views import CategoriaViewSet, PlatilloViewSet
from menu.views import PedidoViewSet, AdicionalViewSet
from django.views.generic import TemplateView

# Enrutador de nuestra API
router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'platillos', PlatilloViewSet)
router.register(r'pedidos', PedidoViewSet)
router.register(r'adicionales', AdicionalViewSet, basename='adicional')

urlpatterns = [
    path('control-gestionador-marias/', admin.site.urls),
    path('api/', include(router.urls)),
    path('i18n/', include('django.conf.urls.i18n')),
    path('api/', include(router.urls)),
    path('api/', include('menu.urls')),
    path('api/', include(router.urls)),
    path('carta/', TemplateView.as_view(template_name='index.html')),
]

admin.site.site_header = "Administración del Bar"
admin.site.site_title = "Portal del Gerente"
admin.site.index_title = "Bienvenido al Gestor del Bar"