from flask import Flask, render_template, request, redirect, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import func
import pandas as pd
import hashlib

app = Flask(__name__)

app.secret_key = "admin123"


app.config["SQLALCHEMY_DATABASE_URI"] = (
    "postgresql://neondb_owner:npg_z0oDLwZ1bAMJ@ep-dawn-bird-ahh8mj79-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)


app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
with app.app_context():
    db.create_all()

# =========================
# WOMPI
# =========================

import hashlib

# Usa tus llaves de prueba o producción de Wompi (disponibles en wompi.co)
WOMPI_PUBLIC_KEY = "pub_prod_Z1AH4I75wJz17Nd97gJNQj1Hv1aWT3td"  # Reemplaza por tu llave pública
WOMPI_INTEGRITY_SECRET = "prod_integrity_w7PrY7hj8wsP4LTKRQd1LUOhF4e1b8fl"  # Reemplaza por tu secreto de integridad

@app.route("/generar-firma-wompi", methods=["POST"])
def generar_firma_wompi():
    try:
        data = request.get_json()
        
        # 1. Limpiar cualquier espacio invisible copiado por error
        secret = WOMPI_INTEGRITY_SECRET.strip()
        pub_key = WOMPI_PUBLIC_KEY.strip()
        
        # 2. Forzar que todo sea el tipo de dato exacto
        reference = str(data.get("reference")).strip()
        amount_in_cents = str(int(data.get("amount_in_cents"))) # Fuerza a entero y luego a texto
        currency = "COP"

        # 3. Concatenar y encriptar
        cadena = f"{reference}{amount_in_cents}{currency}{secret}"
        signature = hashlib.sha256(cadena.encode("utf-8")).hexdigest()

        # 4. Imprimir en tu terminal negra para auditoría visual
        print("====== DEBUG WOMPI ======")
        print(f"Cadena base: {cadena}")
        print(f"Firma: {signature}")
        print("=========================")

        return jsonify({
            "success": True,
            "signature": signature,
            "public_key": pub_key
        })
    except Exception as e:
        print("Error en firma Wompi:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


# =========================
# MODELOS
# =========================

class Producto(db.Model):
    __tablename__ = "productos"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    precio = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    imagen = db.Column(db.String(500))      # Imagen Principal
    imagen_2 = db.Column(db.String(500))    # Imagen Secundaria 1
    imagen_3 = db.Column(db.String(500))    # Imagen Secundaria 2
    categoria = db.Column(db.String(100))


class Pedido(db.Model):

    __tablename__ = "pedidos"

    id = db.Column(db.Integer, primary_key=True)

    cliente = db.Column(db.String(200))

    telefono = db.Column(db.String(50))

    direccion = db.Column(db.String(300))

    ciudad = db.Column(db.String(150))

    metodo_pago = db.Column(db.String(50))

    total = db.Column(db.Float)

    estado = db.Column(
        db.String(50),
        default="Pendiente"
    )

    fecha = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


class DetallePedido(db.Model):

    __tablename__ = "detalle_pedidos"

    id = db.Column(db.Integer, primary_key=True)

    pedido_id = db.Column(
        db.Integer,
        db.ForeignKey("pedidos.id")
    )

    producto_id = db.Column(
        db.Integer,
        db.ForeignKey("productos.id")
    )

    cantidad = db.Column(db.Integer)

    precio = db.Column(db.Float)


# =========================
# TIENDA
# =========================


@app.route("/")
def index():

    productos = Producto.query.limit(8).all()

    return render_template(
        "index.html",
        productos=productos
    )



# =========================
# LOGIN
# =========================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        usuario = request.form["usuario"]
        password = request.form["password"]

        if usuario == "admin" and password == "12345":

            session["admin"] = True

            return redirect("/admin")

    return render_template("login.html")


@app.route("/logout")
def logout():

    session.clear()

    return redirect("/login")


# =========================
# ADMIN PRODUCTOS
# =========================

@app.route("/admin", methods=["GET", "POST"])
def admin():
    if not session.get("admin"):
        return redirect("/login")

    if request.method == "POST":
        producto = Producto(
            nombre=request.form["nombre"],
            categoria=request.form["categoria"],
            precio=float(request.form["precio"]),
            stock=int(request.form["stock"]),
            imagen=request.form["imagen"],
            imagen_2=request.form.get("imagen_2", ""),
            imagen_3=request.form.get("imagen_3", "")
        )

        db.session.add(producto)
        db.session.commit()
        return redirect("/admin")

    productos = Producto.query.all()
    return render_template("admin.html", productos=productos)


# =========================
# EDITAR PRODUCTO
# =========================

@app.route("/editar/<int:id>", methods=["GET", "POST"])
def editar(id):
    if not session.get("admin"):
        return redirect("/login")

    producto = Producto.query.get_or_404(id)

    if request.method == "POST":
        producto.nombre = request.form["nombre"]
        producto.descripcion = request.form["descripcion"]
        producto.categoria = request.form["categoria"]
        producto.precio = float(request.form["precio"])
        producto.stock = int(request.form["stock"])
        producto.imagen = request.form["imagen"]
        producto.imagen_2 = request.form.get("imagen_2", "")
        producto.imagen_3 = request.form.get("imagen_3", "")

        db.session.commit()
        return redirect("/admin")

    return render_template("editar.html", producto=producto)


# =========================
# ELIMINAR PRODUCTO
# =========================

@app.route("/eliminar/<int:id>")
def eliminar(id):

    if not session.get("admin"):
        return redirect("/login")

    producto = Producto.query.get_or_404(id)

    db.session.delete(producto)

    db.session.commit()

    return redirect("/admin")


# =========================
# PEDIDOS
# =========================

@app.route("/pedidos")
def pedidos():

    if not session.get("admin"):
        return redirect("/login")

    pedidos = Pedido.query.order_by(
        Pedido.fecha.desc()
    ).all()

    return render_template(
        "pedidos.html",
        pedidos=pedidos
    )

# =========================
# CAMBIAR ESTADO DE PEDIDO
# =========================

@app.route("/cambiar-estado-pedido/<int:id>", methods=["POST"])
def cambiar_estado_pedido(id):
    if not session.get("admin"):
        return redirect("/login")

    pedido = Pedido.query.get_or_404(id)
    nuevo_estado = request.form.get("estado")
    
    if nuevo_estado:
        pedido.estado = nuevo_estado
        db.session.commit()

    return redirect("/pedidos")

# =========================
# DASHBOARD
# =========================

@app.route("/dashboard")
def dashboard():

    if not session.get("admin"):
        return redirect("/login")

    total_productos = Producto.query.count()

    total_pedidos = Pedido.query.count()

    pedidos_pendientes = Pedido.query.filter_by(
        estado="Pendiente"
    ).count()

    ventas_totales = sum(
        pedido.total for pedido in Pedido.query.all()
    )

    ultimos_pedidos = Pedido.query.order_by(
        Pedido.fecha.desc()
    ).limit(10).all()

    return render_template(
        "dashboard.html",
        total_productos=total_productos,
        total_pedidos=total_pedidos,
        pedidos_pendientes=pedidos_pendientes,
        ventas_totales=ventas_totales,
        ultimos_pedidos=ultimos_pedidos
    )

# =========================
# CREAR PEDIDO
# =========================

@app.route('/crear-pedido', methods=['POST'])
def crear_pedido():
    data = request.get_json()

    pedido = Pedido(
        cliente=data['cliente'],
        telefono=data['telefono'],
        direccion=data['direccion'],
        ciudad=data['ciudad'],
        metodo_pago=data.get('metodo_pago', 'Contra Entrega'),
        total=float(data['total'])
    )

    db.session.add(pedido)
    db.session.commit()

    return jsonify({
        "success": True,
        "pedido_id": pedido.id
    })

@app.route("/test-pedido")
def test_pedido():

    pedido = Pedido(

        cliente="Cristian",
        telefono="3001234567",
        direccion="Prueba",

        ciudad="Bogotá",

        metodo_pago="Contra Entrega",

        total=23000
    )

    db.session.add(pedido)

    db.session.commit()

    return "Pedido creado"


# =========================
# DEBUG PRODUCTOS
# =========================

@app.route("/debug")
def debug():

    productos = Producto.query.all()

    texto = ""

    for p in productos:

        texto += f"{p.id} - {p.nombre}<br>"

    return texto

# =========================
# CATEGORIAS
# =========================

@app.route("/maquillaje")
def maquillaje():

    productos = Producto.query.filter(
        func.lower(Producto.categoria) == "maquillaje"
    ).all()

    return render_template(
        "maquillaje.html",
        productos=productos
    )



@app.route("/skincare")
def skincare():

    productos = Producto.query.filter_by(
        categoria="Skincare"
    ).all()

    return render_template(
        "skincare.html",
        productos=productos
    )

@app.route("/perfumes")
def perfumes():

    productos = Producto.query.filter_by(
        categoria="Perfumes"
    ).all()

    return render_template(
        "perfumes.html",
        productos=productos
    )

@app.route("/belleza")
def belleza():

    productos = Producto.query.filter_by(
        categoria="Belleza"
    ).all()

    return render_template(
        "belleza.html",
        productos=productos
    )

# =========================
# CREAR TABLAS
# =========================

with app.app_context():

    db.create_all()

# =========================
# CARGAR MASIVOS PRODUCTOS
# =========================


@app.route("/cargar-productos", methods=["POST"])
def cargar_productos():

    if not session.get("admin"):
        return redirect("/login")

    archivo = request.files["archivo"]

    if archivo.filename.endswith(".xlsx"):
        df = pd.read_excel(archivo)
    else:
        df = pd.read_csv(archivo)

    for _, fila in df.iterrows():
        # Validar si las imágenes secundarias vienen vacías o nulas en el archivo
        img2 = str(fila["imagen_2"]) if "imagen_2" in fila and not pd.isna(fila["imagen_2"]) else ""
        img3 = str(fila["imagen_3"]) if "imagen_3" in fila and not pd.isna(fila["imagen_3"]) else ""

        producto = Producto(
            nombre=fila["nombre"],
            descripcion=fila["descripcion"] if not pd.isna(fila["descripcion"]) else "",
            categoria=fila["categoria"],
            precio=float(fila["precio"]),
            stock=int(fila["stock"]),
            imagen=str(fila["imagen"]),
            imagen_2=img2,
            imagen_3=img3
        )

        db.session.add(producto)

    db.session.commit()

    return redirect("/admin")



# =========================
# RUN
# =========================

if __name__ == "__main__":

    app.run(debug=True)