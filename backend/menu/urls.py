# backend/menu/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views 

router = DefaultRouter()
router.register(r'platillos', views.PlatilloViewSet)
router.register(r'pedidos', views.PedidoViewSet)

urlpatterns = [
    path('', include(router.urls)), 
    
    path('pedidos/<int:pedido_id>/ticket/', views.imprimir_ticket_view, name='imprimir_ticket'),
]