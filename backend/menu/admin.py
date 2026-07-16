from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Categoria, Platillo
from django.contrib import admin
from .models import Pedido, DetallePedido
from django.utils.html import format_html
from .models import Adicional


admin.site.register(Categoria)

class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    fields = ('platillo', 'cantidad', 'precio_formateado', 'adicionales')
    readonly_fields = ('precio_formateado',)
    extra = 0
    autocomplete_fields = ['platillo']
    filter_horizontal = ()
    can_delete = True
    show_change_link = False

    @admin.display(description='Precio Unitario')
    def precio_formateado(self, obj):
        if obj is None or not hasattr(obj, 'precio_unitario') or obj.precio_unitario is None:
            return "$0,00"
        return f"${obj.precio_unitario:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    
@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'habitacion', 'total_formateado', 'estado_color', 'fecha', 'boton_editar')
    list_filter = ('estado', 'fecha')
    inlines = [DetallePedidoInline]

    def save_formset(self, request, form, formset, change):
        """ Este método se ejecuta al guardar el pedido con sus platos """
        instances = formset.save(commit=False)
        for obj in formset.deleted_objects:
            obj.delete()
        for instance in instances:
            if not instance.precio_unitario:
                instance.precio_unitario = instance.platillo.precio
            instance.save()
        formset.save_m2m()

        pedido = form.instance
        total_pedido = sum(detalle.cantidad * detalle.precio_unitario for detalle in pedido.detalles.all())
        pedido.total = total_pedido
        pedido.save()

    # --- ACCIONES RÁPIDAS ---
    actions = ['marcar_como_pendiente', 'marcar_como_entregado', 'marcar_como_cancelado']

    @admin.display(description='Total')
    def total_formateado(self, obj):
        return f"${obj.total:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    @admin.display(description='Acciones')
    def boton_editar(self, obj):
        url_editar = f"/admin/menu/pedido/{obj.id}/change/"
        
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


    @admin.display(description='Estado')
    def estado_color(self, obj):
        colores = {
            'P': '#f59e0b',
            'E': '#10b981',
            'C': '#ef4444',
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colores.get(obj.estado, '#000'),
            obj.get_estado_display()
        )
    
    class Media:
        css = {
            'all': ('admin/css/pedidos.css',)
        }
        js = ('admin/js/calculo_pedido.js',
              'admin/js/fix_guardado.js',)

@admin.register(Platillo)
class PlatilloAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio', 'categoria')
    search_fields = ('nombre',)

@admin.register(Adicional)
class AdicionalAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'precio')
    search_fields = ('nombre',)
    ordering = ('nombre',)