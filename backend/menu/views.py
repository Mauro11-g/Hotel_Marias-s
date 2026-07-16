from rest_framework import viewsets
from django.http import JsonResponse
from .models import Categoria, Platillo
from .serializers import CategoriaSerializer, PlatilloSerializer
from django.shortcuts import render, get_object_or_404
from django.contrib.admin.views.decorators import staff_member_required
from .models import Pedido
from .serializers import PedidoSerializer
from .models import Adicional
from .serializers import AdicionalSerializer
from django.shortcuts import render
import os
from django.http import HttpResponse
from django.conf import settings

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class PlatilloViewSet(viewsets.ModelViewSet):
    queryset = Platillo.objects.all()
    serializer_class = PlatilloSerializer

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all().order_by('-fecha')
    serializer_class = PedidoSerializer
    
class AdicionalViewSet(viewsets.ModelViewSet):
    queryset = Adicional.objects.all()
    serializer_class = AdicionalSerializer

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

def obtener_precio_platillo(request, platillo_id):
    #""" Devuelve el precio de un plato en formato JSON para el admin """
    try:
        platillo = Platillo.objects.get(pk=platillo_id)
        return JsonResponse({'precio': float(platillo.precio)})
    except Platillo.DoesNotExist:
        return JsonResponse({'precio': 0.0}, status=404)
    
def carta_view(request):
    # Esto busca el archivo directamente en la carpeta dist
    path_to_index = os.path.join(settings.BASE_DIR, '..', 'frontend', 'dist', 'index.html')
    with open(path_to_index, 'r', encoding='utf-8') as f:
        return HttpResponse(f.read())