from rest_framework import serializers
from .models import Categoria, Platillo
from .models import Pedido, DetallePedido, Platillo
from .models import Adicional

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__' # Traduce todos los campos

class PlatilloSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')

    class Meta:
        model = Platillo
        fields = '__all__'

class AdicionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Adicional
        fields = '__all__'

class DetallePedidoSerializer(serializers.ModelSerializer):
    platillo_id = serializers.IntegerField(write_only=True)
    adicionales = serializers.PrimaryKeyRelatedField(many=True, queryset=Adicional.objects.all(), required=False)

    class Meta:
        model = DetallePedido
        fields = ['platillo_id', 'cantidad', 'precio_unitario', 'adicionales']


class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True)

    class Meta:
        model = Pedido
        fields = ['id', 'cliente', 'habitacion', 'total', 'notas', 'estado', 'fecha', 'detalles']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        pedido = Pedido.objects.create(**validated_data)
        
        for detalle in detalles_data:
            adicionales_ids = detalle.pop('adicionales', [])
            platillo = Platillo.objects.get(id=detalle['platillo_id'])
            
            detalle_obj = DetallePedido.objects.create(
                pedido=pedido,
                platillo=platillo,
                cantidad=detalle['cantidad'],
                precio_unitario=detalle['precio_unitario']
            )
            
            if adicionales_ids:
                detalle_obj.adicionales.set(adicionales_ids)

        return pedido

