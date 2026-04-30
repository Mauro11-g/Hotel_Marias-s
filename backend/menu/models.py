from django.db import models
from deep_translator import GoogleTranslator

class Categoria(models.Model):
# --- AQUÍ ESTÁN LAS COLUMNAS QUE FALTABAN ---
    nombre = models.CharField(max_length=100)
    nombre_en = models.CharField("Nombre (Inglés)", max_length=100, blank=True, null=True)
    nombre_pt = models.CharField("Nombre (Portugués)", max_length=100, blank=True, null=True)

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        # Traducción al INGLÉS
        if not self.nombre_en and self.nombre:
            self.nombre_en = GoogleTranslator(source='es', target='en').translate(self.nombre)
            
        # Traducción al PORTUGUÉS
        if not self.nombre_pt and self.nombre:
            self.nombre_pt = GoogleTranslator(source='es', target='pt').translate(self.nombre)

        # Guarda la categoría en la base de datos
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
        # 1. Traducciones al INGLÉS (Solo traduce si el campo está vacío)
        if not self.nombre_en and self.nombre:
            self.nombre_en = GoogleTranslator(source='es', target='en').translate(self.nombre)
        if not self.descripcion_en and self.descripcion:
            self.descripcion_en = GoogleTranslator(source='es', target='en').translate(self.descripcion)
            
        # 2. Traducciones al PORTUGUÉS
        if not self.nombre_pt and self.nombre:
            self.nombre_pt = GoogleTranslator(source='es', target='pt').translate(self.nombre)
        if not self.descripcion_pt and self.descripcion:
            self.descripcion_pt = GoogleTranslator(source='es', target='pt').translate(self.descripcion)

        # 3. Guardar todo en la base de datos
        super().save(*args, **kwargs)