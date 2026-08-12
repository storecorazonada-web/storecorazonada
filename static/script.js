let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let producto = {};
let metodoPagoSeleccionado = "Contra Entrega";
let valorRamoExtra = 0;
let nombreRamoSeleccionado = "";

function guardarCarrito() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

// ==============================
// MODAL PRODUCTO
// ==============================

function abrirModal(nombre, precio, img1, img2, img3, descripcion) {
    producto = {
        nombre: nombre,
        precio: Number(precio),
        imagen: img1,
        descripcion: descripcion
    };

    document.getElementById("modal").style.display = "block";
    document.getElementById("modalNombre").innerText = nombre;
    document.getElementById("modalPrecio").innerText =
        "$ " + Number(precio).toLocaleString("es-CO");
    
    // Asigna la foto principal
    const modalImg = document.getElementById("modalImg");
    modalImg.src = img1;

    // Configura las miniaturas
    const thumb1 = document.getElementById("thumb1");
    const thumb2 = document.getElementById("thumb2");
    const thumb3 = document.getElementById("thumb3");

    // Foto 1
    if (img1) {
        thumb1.src = img1;
        thumb1.style.display = "inline-block";
    } else {
        thumb1.style.display = "none";
    }

    // Foto 2
    if (img2 && img2.trim() !== "" && img2 !== "None") {
        thumb2.src = img2;
        thumb2.style.display = "inline-block";
    } else {
        thumb2.style.display = "none";
    }

    // Foto 3
    if (img3 && img3.trim() !== "" && img3 !== "None") {
        thumb3.src = img3;
        thumb3.style.display = "inline-block";
    } else {
        thumb3.style.display = "none";
    }

    // Descripción
    const descElem = document.getElementById("modalDescripcion");
    if (descElem) {
        descElem.innerText = descripcion && descripcion !== 'None' ? descripcion : "Sin descripción disponible.";
    }
}

// Función para alternar la foto activa en el modal
function cambiarFotoPrincipal(srcNueva) {
    document.getElementById("modalImg").src = srcNueva;
}

function cerrarModal() {
    document.getElementById("modal").style.display = "none";
}

// ==============================
// AGREGAR AL CARRITO
// ==============================

const addCart = document.getElementById("addCart");

if (addCart) {
    addCart.onclick = function () {
        const existente = carrito.find(
            p => p.nombre === producto.nombre
        );

        if (existente) {
            existente.cantidad += 1;
        } else {
            carrito.push({
                ...producto,
                cantidad: 1
            });
        }
        guardarCarrito();
        renderCarrito();
        cerrarModal();

        side.classList.add("active");
    };
}

// ==============================
// RENDER CARRITO MEJORADO
// ==============================

function renderCarrito() {
    let html = "";
    let total = 0;

    carrito.forEach((p, i) => {
        const subtotal = p.precio * p.cantidad;
        total += subtotal;

        html += `
        <div class="item-carrito">
            <img src="${p.imagen}" class="carrito-img" alt="${p.nombre}">

            <div class="carrito-info">
                <div class="carrito-top">
                    <h4>${p.nombre}</h4>
                    <button class="btn-eliminar-icon" onclick="eliminar(${i})" title="Eliminar producto">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>

                <p class="carrito-precio">$ ${p.precio.toLocaleString("es-CO")}</p>

                <div class="carrito-bottom">
                    <div class="cantidad-box">
                        <button onclick="cambiarCantidad(${i}, -1)">-</button>
                        <span>${p.cantidad}</span>
                        <button onclick="cambiarCantidad(${i}, 1)">+</button>
                    </div>

                    <span class="subtotal-monto">
                        $ ${subtotal.toLocaleString("es-CO")}
                    </span>
                </div>
            </div>
        </div>
        `;
    });

    // ===============================================
    // AQUÍ SE AGREGA LA SUMA DEL RAMO AL TOTAL
    // ===============================================
    total += valorRamoExtra;

    const cartItems = document.getElementById("cartItems");
    if (cartItems) cartItems.innerHTML = html;
    
    const contador = document.getElementById("contador");
    if (contador) contador.innerText = carrito.reduce((s, p) => s + p.cantidad, 0);

    const totalElem = document.getElementById("total");
    if (totalElem) totalElem.innerText = total.toLocaleString("es-CO");
}

// ==============================
// ELIMINAR PRODUCTO
// ==============================

function eliminar(i) {
    carrito.splice(i, 1);
    guardarCarrito();
    renderCarrito();
}

function cambiarCantidad(i, cambio) {
    carrito[i].cantidad += cambio;

    if (carrito[i].cantidad <= 0) {
        carrito.splice(i, 1);
    }
    guardarCarrito();
    renderCarrito();
}

// ==============================
// SIDEBAR CARRITO
// ==============================

const btn = document.getElementById("cartButton");
const side = document.getElementById("sidebarCart");
const close = document.getElementById("closeCart");

if (btn) {
    btn.onclick = () => {
        side.classList.add("active");
    };
}

if (close) {
    close.onclick = () => {
        side.classList.remove("active");
    };
}

// ==============================
// CARRUSEL
// ==============================

const slides = document.querySelectorAll(".slide");

if (slides.length > 0) {
    let currentSlide = 0;

    setInterval(() => {
        slides[currentSlide].classList.remove("active");
        currentSlide++;

        if (currentSlide >= slides.length) {
            currentSlide = 0;
        }

        slides[currentSlide].classList.add("active");
    }, 4000);
}

// ==============================
// MODAL PEDIDO / APERTURA
// ==============================

function abrirPedidoModal() {
    document.getElementById("pedidoModal").style.display = "flex";
}

function cerrarPedido() {
    document.getElementById("pedidoModal").style.display = "none";
}

function cerrarExitoso() {
    const exito = document.getElementById("pedidoExitoso");
    if (exito) exito.style.display = "none";
}

// ==============================
// GUARDAR Y PROCESAR PEDIDO (CONTRA ENTREGA Y WOMPI/PSE)
// ==============================

window.addEventListener("load", () => {
    renderCarrito();

    // Eventos para los botones del carrito
    const btnContra = document.querySelector(".btn-contra") || document.querySelector(".btn-contraentrega");
    if (btnContra) {
        btnContra.onclick = function () {
            if (carrito.length === 0) {
                alert("Debes agregar productos al carrito primero.");
                return;
            }
            metodoPagoSeleccionado = "Contra Entrega";
            abrirPedidoModal();
        };
    }

    const btnWompi = document.querySelector(".btn-wompi");
    if (btnWompi) {
        btnWompi.onclick = function () {
            if (carrito.length === 0) {
                alert("Debes agregar productos al carrito primero.");
                return;
            }
            metodoPagoSeleccionado = "PSE / En Línea";
            abrirPedidoModal();
        };
    }

    // Escuchador del envío del formulario de entrega
    const pedidoForm = document.getElementById("pedidoForm");
    if (pedidoForm) {
        pedidoForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const totalTexto = document.getElementById("total").innerText;
            const total = Number(totalTexto.replace(/\./g, ""));

            const datos = {
                cliente: document.getElementById("cliente").value,
                telefono: document.getElementById("telefono").value,
                direccion: document.getElementById("direccion").value,
                ciudad: document.getElementById("ciudad").value,
                metodo_pago: metodoPagoSeleccionado,
                total: total,
                items: carrito
            };

            try {
                // 1. Guardar el pedido en la base de datos
                const response = await fetch("/crear-pedido", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(datos)
                });

                const data = await response.json();

                if (data.success) {
                    cerrarPedido();

                    if (metodoPagoSeleccionado === "Contra Entrega") {
                        // Flujo Contra Entrega
                        const modalExito = document.getElementById("pedidoExitoso");
                        if (modalExito) {
                            modalExito.style.display = "flex";
                        } else {
                            alert("¡Pedido registrado con éxito! Nos pondremos en contacto para la entrega.");
                        }

                        carrito = [];
                        guardarCarrito();
                        renderCarrito();
                        pedidoForm.reset();
                        if (side) side.classList.remove("active");
                    } else {
                        // Flujo PSE / Wompi
                        iniciarPagoWompi(total, data.pedido_id);
                    }
                } else {
                    alert("Error al registrar el pedido.");
                }

            } catch (error) {
                console.error("Error de conexión:", error);
                alert("Error de conexión con el servidor.");
            }
        });
    }
});

// ==============================
// INICIAR PAGO WOMPI (ANTI-BLOQUEOS)
// ==============================
async function iniciarPagoWompi(totalMonto, pedidoId) {
    // 1. Garantizar que el monto sea un número entero (en centavos)
    const amountInCents = Math.round(Number(totalMonto)) * 100;
    
    // 2. EL SECRETO: Agregar Date.now() para que la referencia sea SIEMPRE única
    const reference = "CORA" + pedidoId + Date.now();

    // Ocultar el carrito lateral si está abierto
    const side = document.getElementById("sidebarCart");
    if (side) side.classList.remove("active");

    try {
        // Pedir la firma a Flask
        const response = await fetch("/generar-firma-wompi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                reference: reference,
                amount_in_cents: amountInCents
            })
        });

        const data = await response.json();

        if (!data.signature || !data.public_key) {
            alert("Error al validar la seguridad del pago. Revisa las llaves.");
            return;
        }

        // Configurar la pasarela
        const checkout = new WidgetCheckout({
            currency: 'COP',
            amountInCents: amountInCents,
            reference: reference,
            publicKey: data.public_key,
            signature: { integrity: data.signature },
            // redirectUrl: window.location.origin + '/pedidos'
        });

        
        
        // Abrir pasarela
        // Abrir pasarela de Wompi
        checkout.open(function (result) {
            const transaction = result.transaction;
            
            // Si el pago fue aprobado exitosamente
            if (transaction && transaction.status === 'APPROVED') {
                
                // 1. Limpiar el carrito de compras
                carrito = [];
                guardarCarrito();
                renderCarrito();
                
                // 2. Limpiar el formulario de datos
                const pedidoForm = document.getElementById("pedidoForm");
                if (pedidoForm) pedidoForm.reset();

                // 3. Abrir el modal de ¡Pedido Confirmado!
                const modalExito = document.getElementById("pedidoExitoso");
                if (modalExito) {
                    modalExito.style.display = "flex";
                } else {
                    alert("¡Pago aprobado y pedido confirmado con éxito!");
                }

            } else {
                alert('El pago no fue completado o fue rechazado.');
            }
        });
        } catch (error) {
        console.error("Error al abrir la pasarela:", error);
        alert("Error de conexión al iniciar el pago seguro.");
    }
}

// ==============================
// FILTRAR CATEGORÍAS
// ==============================

function filtrarCategoria(categoria) {
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        const cat = card.dataset.categoria;

        if (cat === categoria) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}
// Detecta el clic en el checkbox
function manejarCheckboxRamo(checkbox) {
    if (checkbox.checked) {
        // Si lo activa, mostramos la ventana de fotos
        document.getElementById('modalRamo').style.display = 'flex';
    } else {
        // Si lo desactiva, borramos el valor y el texto
        valorRamoExtra = 0;
        nombreRamoSeleccionado = "";
        document.getElementById('ramoElegidoTexto').style.display = 'none';
        renderCarrito(); // Recalcula el total bajando los $15.000
    }
}

// Se ejecuta al tocar una foto dentro del modal
function seleccionarRamo(nombre) {
    valorRamoExtra = 15000;
    nombreRamoSeleccionado = nombre;
    
    // 1. Ocultar el modal
    document.getElementById('modalRamo').style.display = 'none';
    
    // 2. Mostrarle debajo del check qué ramo eligió
    const texto = document.getElementById('ramoElegidoTexto');
    texto.innerText = `🎁 Elegiste: ${nombre} (+ $15.000)`;
    texto.style.display = 'block';

    // 3. Sumar al carrito
    renderCarrito();
}

// Se ejecuta si le da a la "X" del modal sin elegir nada
function cerrarModalRamo() {
    document.getElementById('modalRamo').style.display = 'none';
    
    // Si cerró y no había ramo guardado, desmarcamos el check para no cobrarle
    if (valorRamoExtra === 0) {
        document.getElementById('checkRamo').checked = false;
    }
}
function enviarWhatsApp(event) {
    // Esto evita que la página se recargue cuando le dan clic al botón
    event.preventDefault();

    // 1. Capturamos lo que el cliente escribió en cada cuadro
    let nombre = document.getElementById("contacto-nombre").value;
    let correo = document.getElementById("contacto-correo").value;
    let telefono = document.getElementById("contacto-telefono").value;
    let comentario = document.getElementById("contacto-comentario").value;

    // 2. Construimos el texto del mensaje con saltos de línea y negritas para WhatsApp
    let mensaje = `Hola, me estoy contactando desde la página web.%0A%0A`;
    mensaje += `*Nombre:* ${nombre}%0A`;
    mensaje += `*Correo:* ${correo}%0A`;
    
    // Solo agregamos el teléfono si el cliente lo llenó
    if (telefono !== "") {
        mensaje += `*Teléfono:* ${telefono}%0A`;
    }
    
    mensaje += `*Comentario:* ${comentario}`;

    // 3. Este es el número a donde llegará el mensaje (con el indicativo +57)
    let numeroWhatsApp = "573118677095";

    // 4. Armamos el enlace final y lo abrimos en una nueva pestaña
    let url = `https://wa.me/${numeroWhatsApp}?text=${mensaje}`;
    window.open(url, "_blank");

    /* ==========================================
       ENVIAR PEDIDO A WHATSAPP
       ========================================== */
    document.getElementById('pedidoForm').addEventListener('submit', function(event) {
        // 1. Evitamos que la página se recargue al darle al botón
        event.preventDefault(); 

        // 2. Capturamos lo que el cliente escribió en los campos
        let cliente = document.getElementById('cliente').value;
        let telefono = document.getElementById('telefono').value;
        let direccion = document.getElementById('direccion').value;
        let ciudad = document.getElementById('ciudad').value;
        
        // Capturamos el total del carrito
        let total = document.getElementById('total').innerText;

        // 3. Construimos el mensaje con formato (negritas y saltos de línea)
        let mensaje = `📦 *NUEVO PEDIDO CONTRA ENTREGA* 📦%0A%0A`;
        mensaje += `*Cliente:* ${cliente}%0A`;
        mensaje += `*Teléfono:* ${telefono}%0A`;
        mensaje += `*Dirección:* ${direccion}%0A`;
        mensaje += `*Ciudad:* ${ciudad}%0A`;
        mensaje += `*Total a cobrar:* $${total}%0A%0A`;
        mensaje += `¡Hola! Confirmo los datos para el envío de mi pedido.`;

        // 4. Tu número de teléfono
        let numeroDestino = "573118677095";

        // 5. Creamos el enlace oficial de WhatsApp y lo abrimos en una pestaña nueva
        let url = `https://wa.me/${numeroDestino}?text=${mensaje}`;
        window.open(url, '_blank');

        // 6. (Opcional) Cerramos el modal de datos y mostramos tu ventana de "Pedido Exitoso"
        document.getElementById('pedidoModal').style.display = 'none';
        document.getElementById('pedidoExitoso').style.display = 'flex';
    });
}