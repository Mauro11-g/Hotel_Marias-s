from django.db import models
from deep_translator import GoogleTranslator

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    nombre_en = models.CharField("Nombre (Inglés)", max_length=100, blank=True, null=True)
    nombre_pt = models.CharField("Nombre (Portugués)", max_length=100, blank=True, null=True)

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if not self.nombre_en and self.nombre:
            self.nombre_en = GoogleTranslator(source='es', target='en').translate(self.nombre)
        if not self.nombre_pt and self.nombre:
            self.nombre_pt = GoogleTranslator(source='es', target='pt').translate(self.nombre)
        super().save(*args, **kwargs)


class Platillo(models.Model):
    categoria = models.ForeignKey(Categoria, related_name='platillos', on_delete=models.CASCADE)
    nombre = models.CharField(max_length=200)
    nombre_en = models.CharField("Nombre (Inglés)", max_length=200, blank=True, null=True)
    nombre_pt = models.CharField("Nombre (Portugués)", max_length=200, blank=True, null=True)
    
    descripcion = models.TextField()
    descripcion_en = models.TextField("Descripción (Inglés)", blank=True, null=True)
    descripcion_pt = models.TextField("Descripción (Portugués)", blank=True, null=True)
    
    precio = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if not self.nombre_en and self.nombre:
            self.nombre_en = GoogleTranslator(source='es', target='en').translate(self.nombre)
        if not self.descripcion_en and self.descripcion:
            self.descripcion_en = GoogleTranslator(source='es', target='en').translate(self.descripcion)
            
        if not self.nombre_pt and self.nombre:
            self.nombre_pt = GoogleTranslator(source='es', target='pt').translate(self.nombre)
        if not self.descripcion_pt and self.descripcion:
            self.descripcion_pt = GoogleTranslator(source='es', target='pt').translate(self.descripcion)

        super().save(*args, **kwargs)


class Adicional(models.Model):
    nombre = models.CharField(max_length=100)
    nombre_en = models.CharField("Nombre (Inglés)", max_length=100, blank=True, null=True)
    nombre_pt = models.CharField("Nombre (Portugués)", max_length=100, blank=True, null=True)
    precio = models.DecimalField(max_digits=8, decimal_places=2)
    platillos_permitidos = models.ManyToManyField(Platillo, related_name='adicionales_disponibles', blank=True)

    class Meta:
        verbose_name_plural = "Adicionales"

    def __str__(self):
        return f"{self.nombre} (+${self.precio})"

    def save(self, *args, **kwargs):
        if not self.nombre_en and self.nombre:
            self.nombre_en = GoogleTranslator(source='es', target='en').translate(self.nombre)
        if not self.nombre_pt and self.nombre:
            self.nombre_pt = GoogleTranslator(source='es', target='pt').translate(self.nombre)
        super().save(*args, **kwargs)


class Pedido(models.Model):
    ESTADOS = [
        ('P', 'Pendiente'),
        ('E', 'Entregado'),
        ('C', 'Cancelado'),
    ]
    cliente = models.CharField(max_length=100)
    habitacion = models.IntegerField(null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado = models.CharField(max_length=1, choices=ESTADOS, default='P')
    notas = models.TextField("Notas / Aclaraciones", blank=True, null=True)

    def __str__(self):
        return f"Pedido {self.id} - {self.cliente}"


class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='detalles', on_delete=models.CASCADE)
    platillo = models.ForeignKey(Platillo, on_delete=models.CASCADE)
    cantidad = models.IntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=8, decimal_places=2)
    adicionales = models.ManyToManyField(Adicional, blank=True, related_name='detalles_pedidos')

    def __str__(self):
        return f"{self.cantidad} x {self.platillo.nombre}"

    @property
    def total_adicionales(self):
        """Calcula la suma de los precios de los adicionales seleccionados"""
        if self.id:
            return sum(adicional.precio for adicional in self.adicionales.all())
        return 0

    @property
    def total_renglon(self):
        """Calcula el costo total de este renglón: (Precio Platillo + Adicionales) * Cantidad"""
        return (self.precio_unitario + self.total_adicionales) * self.cantidad