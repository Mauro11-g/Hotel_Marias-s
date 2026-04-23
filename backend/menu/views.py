from rest_framework import viewsets
from .models import Categoria, Platillo
from .serializers import CategoriaSerializer, PlatilloSerializer

# Esto crea automáticamente la lógica para Leer, Crear, Editar y Borrar desde React
class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class PlatilloViewSet(viewsets.ModelViewSet):
    queryset = Platillo.objects.all()
    serializer_class = PlatilloSerializer