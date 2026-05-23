from rest_framework import serializers
from .models import Categoria, Platillo
from .models import Pedido, DetallePedido, Platillo

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


class DetallePedidoSerializer(serializers.ModelSerializer):
    # Usamos el ID del platillo para vincularlo al recibir los datos
    platillo_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = DetallePedido
        fields = ['platillo_id', 'cantidad', 'precio_unitario']


class PedidoSerializer(serializers.ModelSerializer):
    # Declaramos la relación anidada para los platos del pedido
    detalles = DetallePedidoSerializer(many=True)

    class Meta:
        model = Pedido
        fields = ['id', 'cliente', 'habitacion', 'total', 'estado', 'fecha', 'detalles']

    def create(self, validated_data):
        # Extraemos la lista de platos del diccionario principal de datos
        detalles_data = validated_data.pop('detalles')
        
        # Creamos la cabecera del Pedido principal
        pedido = Pedido.objects.create(**validated_data)
        
        # Recorremos cada plato y lo guardamos vinculándolo al pedido recién creado
        for detalle in detalles_data:
            platillo = Platillo.objects.get(id=detalle['platillo_id'])
            DetallePedido.objects.create(
                pedido=pedido,
                platillo=platillo,
                cantidad=detalle['cantidad'],
                precio_unitario=detalle['precio_unitario']
            )
        return pedido

