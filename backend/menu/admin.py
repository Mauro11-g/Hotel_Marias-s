from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Categoria, Platillo
from django.contrib import admin
from .models import Pedido, DetallePedido
from django.utils.html import format_html
from .models import Adicional


# Esto hace que aparezcan en el panel de control
admin.site.register(Categoria)

class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    # Cambiamos para mostrar una versión formateada del precio unitario
    fields = ('platillo', 'cantidad', 'precio_formateado', 'adicionales')
    readonly_fields = ('precio_formateado',)
    extra = 0
    autocomplete_fields = ['platillo']
    filter_horizontal = ('adicionales',)

    can_delete = True  # Fuerza a Django a habilitar la opción de borrado de filas
    show_change_link = False

    @admin.display(description='Precio Unitario')
    def precio_formateado(self, obj):
        if obj is None or not hasattr(obj, 'precio_unitario') or obj.precio_unitario is None:
            return "$0,00"
        # Formato con punto para miles y coma para decimales
        return f"${obj.precio_unitario:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'habitacion', 'total_formateado', 'estado_color', 'fecha', 'link_ticket', 'boton_editar')
    list_filter = ('estado', 'fecha')
    inlines = [DetallePedidoInline]
    class Media:
        js = ('admin/js/calculo_pedido.js',)

    def save_formset(self, request, form, formset, change):
        """ Este método se ejecuta al guardar el pedido con sus platos """
        # 1. Guardara los renglones (los detalles de platos agregados o quitados)
        instances = formset.save(commit=False)
        for obj in formset.deleted_objects:
            obj.delete()
        for instance in instances:
            # Traemos el precio real del plato seleccionado
            if not instance.precio_unitario:
                instance.precio_unitario = instance.platillo.precio
            instance.save()
        formset.save_m2m()

        # 2. Recalculamos el total general del pedido sumando lo que quedó vigente
        pedido = form.instance
        total_pedido = sum(detalle.cantidad * detalle.precio_unitario for detalle in pedido.detalles.all())
        pedido.total = total_pedido
        pedido.save()

    # --- AQUÍ DEFINIMOS LAS ACCIONES RÁPIDAS ---
    actions = ['marcar_como_pendiente', 'marcar_como_entregado', 'marcar_como_cancelado']

    @admin.display(description='Total')
    def total_formateado(self, obj):
        return f"${obj.total:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    @admin.display(description='Acciones')
    def boton_editar(self, obj):
        # Generamos la URL nativa de Django para editar este pedido específico
        url_editar = f"/admin/menu/pedido/{obj.id}/change/"
        
        # Retornamos el botón con estilos limpios instalados a fuego
        return format_html(
            '''
            <a href="{}" class="button-editar-rapido" 
               style="display: inline-block;
                      padding: 4px 10px;
                      background-color: #ffc107;
                      color: #212529;
                      font-size: 11px;
                      font-weight: bold;
                      text-decoration: none;
                      border-radius: 4px;
                      transition: all 0.2s ease;
                      text-align: center;">
                Editar
            </a>
            ''',
            url_editar
        )

    @admin.action(description='Revertir pedidos seleccionados a PENDIENTES')
    def marcar_como_pendiente(self, request, queryset):
        # 'P' es el código para Pendiente según los modelos
        filas_actualizadas = queryset.update(estado='P')
        self.message_user(request, f'{filas_actualizadas} pedidos se cambiaron nuevamente a Pendientes.')

    @admin.action(description='Marcar pedidos seleccionados como ENTREGADOS')
    def marcar_como_entregado(self, request, queryset):
        filas_actualizadas = queryset.update(estado='E')
        self.message_user(request, f'{filas_actualizadas} pedidos fueron marcados como Entregados con éxito.')

    @admin.action(description='Marcar pedidos seleccionados como CANCELADOS')
    def marcar_como_cancelado(self, request, queryset):
        filas_actualizadas = queryset.update(estado='C')
        self.message_user(request, f'{filas_actualizadas} pedidos fueron marcados como Cancelados.')

    @admin.display(description='Acciones')
    def link_ticket(self, obj):
        # Genera la URL dinámica apuntando a la vista que creamos en el Paso 2
        url = reverse('imprimir_ticket', args=[obj.id])
        return format_html(
            '<a class="button" href="{}" target="_blank" style="background-color: #2563eb; color: white; padding: 3px 10px; border-radius: 4px; font-weight: bold; text-decoration: none;">Ticket</a>',
            url
        )

    # --- EXTRA PRO: Colorcito para el estado en la lista ---
    @admin.display(description='Estado')
    def estado_color(self, obj):
        colores = {
            'P': '#f59e0b', # Ámbar para Pendiente
            'E': '#10b981', # Esmeralda para Entregado
            'C': '#ef4444', # Rojo para Cancelado
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colores.get(obj.estado, '#000'),
            obj.get_estado_display()
        )
    
@admin.register(Platillo)
class PlatilloAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio', 'categoria')
    search_fields = ('nombre',)

@admin.register(Adicional)
class AdicionalAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'precio')
    search_fields = ('nombre',)
    ordering = ('nombre',)