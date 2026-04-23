from rest_framework import serializers
from .models import Categoria, Platillo

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__' # Traduce todos los campos

class PlatilloSerializer(serializers.ModelSerializer):
    # Esto es un truco para que nos mande el nombre de la categoría y no solo un número
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')

    class Meta:
        model = Platillo
        fields = '__all__'