from rest_framework import viewsets
from .models import Categoria, Platillo
from .serializers import CategoriaSerializer, PlatilloSerializer
from django.shortcuts import render, get_object_or_404
from django.contrib.admin.views.decorators import staff_member_required
from .models import Pedido
from .serializers import PedidoSerializer

# Esto crea automáticamente la lógica para Leer, Crear, Editar y Borrar desde React
class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class PlatilloViewSet(viewsets.ModelViewSet):
    queryset = Platillo.objects.all()
    serializer_class = PlatilloSerializer

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all().order_by('-fecha')
    serializer_class = PedidoSerializer
    

@staff_member_required
def imprimir_ticket_view(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    detalles = pedido.detalles.all() # Trae los platos asociados a ese pedido
    
    # Reutilizamos el truco del formato de moneda regional para el total del ticket
    total_formateado = f"{pedido.total:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    context = {
        'pedido': pedido,
        'detalles': detalles,
        'total_formateado': total_formateado,
    }
    return render(request, 'admin/ticket_pedido.html', context)