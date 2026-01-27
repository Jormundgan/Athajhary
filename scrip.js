// Estas constantes son ahora declaradas dentro de cargarEventListeners para asegurar que el DOM esté listo.
const lista = document.querySelector('#lista-carrito tbody');

// Nuevas constantes para la Modal (se mantienen fuera para ser accesibles globalmente, pero serán redefinidas si es necesario)
const modal = document.getElementById('product-modal');
const closeBtn = document.querySelector('.close-btn');
const tipoCamisaSelect = document.getElementById('tipo-camisa');
const modalPriceSpan = document.getElementById('modal-product-price');
const modalProductImg = document.getElementById('modal-product-img');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductIdInput = document.getElementById('modal-product-id');
const modalQuantityInput = document.getElementById('product-quantity');
const addToCartModalBtn = document.getElementById('add-to-cart-modal');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

let currentProductIndex = 0; // Para la navegación

// --- Nueva forma de cargar los Listeners ---
document.addEventListener('DOMContentLoaded', cargarEventListeners);


function cargarEventListeners() {
    // Definimos las constantes cruciales *dentro* de la función para garantizar que existen.
    const carrito = document.getElementById('carrito');
    const elementos1 = document.getElementById('lista-1');
    const vaciarCarritoBtn = document.getElementById('vaciar-carrito');
    const completarPedidoBtn = document.getElementById('completar-pedido');

    if (elementos1) {
        elementos1.addEventListener('click', abrirModal);
    }
    
    // Verificamos que los elementos existan antes de asignar listeners
    if (carrito) {
        carrito.addEventListener('click', eliminarElemento);
    }
    if (vaciarCarritoBtn) {
        vaciarCarritoBtn.addEventListener('click', vaciarCarrito);
    }

    // ************* CORRECCIÓN PARA EL BOTÓN DE WHATSAPP *************
    if (completarPedidoBtn) {
        completarPedidoBtn.addEventListener('click', enviarPedidoWhatsApp);
    }
    // ***************************************************************

    leerLocalStorage(); // Ya no necesita DOMContentLoaded, porque la estamos llamando aquí.

    // Eventos de la Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModal);
    }
    window.addEventListener('click', (e) => { // Cierra si se hace click fuera
        if (e.target == modal) {
            cerrarModal();
        }
    });
    if (tipoCamisaSelect) {
        tipoCamisaSelect.addEventListener('change', actualizarPrecioModal);
    }
    
    // Evento de Añadir al Carrito desde la Modal
    if (addToCartModalBtn) {
        addToCartModalBtn.addEventListener('click', agregarProductoDesdeModal);
    }

    // Eventos de navegación
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => navegarProducto(-1));
        nextBtn.addEventListener('click', () => navegarProducto(1));
    }
}

// --- Lógica de la Modal (el resto del código sigue igual) ---

function getProductElements() {
    // Retorna todos los contenedores de producto de la página actual
    return Array.from(document.querySelectorAll('.product'));
}

function abrirModal(e) {
    e.preventDefault();
    if (e.target.classList.contains('btn-2')) {
        const productElements = getProductElements();
        const productElement = e.target.closest('.product');
        
        // 1. Mostrar la modal
        modal.classList.add('open');
        
        // 2. Encontrar el índice del producto clickeado para la navegación
        currentProductIndex = productElements.findIndex(p => p === productElement);
        
        // 3. Cargar los datos del producto
        cargarDatosModal(productElement);
    }
}

function cerrarModal() {
    modal.classList.remove('open');
    // Reiniciar valores al cerrar
    if (tipoCamisaSelect) {
        tipoCamisaSelect.value = 'Micro-durazno';
    }
    if (modalQuantityInput) {
        modalQuantityInput.value = 1;
    }
}

function cargarDatosModal(elemento) {
    const imagenSrc = elemento.querySelector('img').src;
    const titulo = elemento.querySelector('h3').textContent;
    const id = elemento.querySelector('a').getAttribute('data-id');
    const precioBase = elemento.querySelector('.precio').textContent; 

    // 1. Llenar los campos de la modal
    if (modalProductImg) {
        modalProductImg.src = imagenSrc;
    }
    if (modalProductTitle) {
        modalProductTitle.textContent = titulo;
    }
    if (modalProductIdInput) {
        modalProductIdInput.value = id;
    }
    
    // 2. Reiniciar selección y precio (asumimos que el precio base es el Standard)
    if (tipoCamisaSelect) {
        tipoCamisaSelect.value = 'Micro-durazno';
    }
    if (modalQuantityInput) {
        modalQuantityInput.value = 1;
    }
    if (modalPriceSpan) {
        modalPriceSpan.textContent = precioBase;
    }
}

function actualizarPrecioModal() {
    const selectedOption = tipoCamisaSelect.options[tipoCamisaSelect.selectedIndex];
    const modifier = parseFloat(selectedOption.getAttribute('data-price-modifier'));
    
    // Asumiendo que el precio base (Standard) siempre es $10.00 (el valor inicial en el HTML)
    const basePrice = 20; 

    const newPrice = 20;
    
    if (modalPriceSpan) {
        modalPriceSpan.textContent = `$${newPrice}`;
    }
}

function navegarProducto(direction) {
    const productElements = getProductElements();
    const totalProducts = productElements.length;

    currentProductIndex += direction;

    if (currentProductIndex < 0) {
        currentProductIndex = totalProducts - 1;
    } else if (currentProductIndex >= totalProducts) {
        currentProductIndex = 0;
    }

    // Cargar los datos del nuevo producto
    cargarDatosModal(productElements[currentProductIndex]);
}


// --- Lógica de Carrito desde la Modal ---

function agregarProductoDesdeModal() {
    const selectedOption = tipoCamisaSelect.options[tipoCamisaSelect.selectedIndex];
    const tipoCamisa = selectedOption.value;
    
    // Crear el objeto de información para el carrito
    const infoElemento = {
        imagen: modalProductImg.src,
        titulo: modalProductTitle.textContent,
        precio: modalPriceSpan.textContent, // Precio ya actualizado
        id: modalProductIdInput.value + '-' + tipoCamisa.toLowerCase(), // ID único para cada tipo
        cantidad: parseInt(modalQuantityInput.value),
        tipo: tipoCamisa
    }
    
    procesarPedido(infoElemento);
    cerrarModal();
}

// --- Lógica de Carrito Existente (Corregida) ---

function procesarPedido(elementoNuevo) {
    let elementosLS = obtenerElementosLocalStorage();
    let isUpdated = false;

    // Verificar si el producto (incluyendo tipo de camisa) ya existe
    elementosLS = elementosLS.map(elemento => {
        if (elemento.id === elementoNuevo.id) {
            elemento.cantidad += elementoNuevo.cantidad;
            isUpdated = true;
        }
        return elemento;
    });

    if (!isUpdated) {
        elementosLS.push(elementoNuevo);
    }

    localStorage.setItem('elementos', JSON.stringify(elementosLS));
    
    // Redibujar el carrito completo para mostrar los cambios
    limpiarCarritoHTML();
    leerLocalStorage(); 
}

// scrip.js - Función corregida para insertar elementos en el carrito de forma segura.

function insertarCarrito(elemento) {
    // 1. Crear la fila (<tr>)
    const row = document.createElement('tr');

    // --- Columna de Producto (Imagen y Tipo) ---
    const tdImg = document.createElement('td');
    
    // a. Imagen
    const img = document.createElement('img');
    img.src = elemento.imagen;
    img.width = 50;
    tdImg.appendChild(img);
    
    // b. Tipo de Camisa (Usamos textContent para la seguridad clave)
    const pTipo = document.createElement('p');
    pTipo.textContent = elemento.tipo; // <-- ¡SEGURIDAD APLICADA AQUÍ!
    tdImg.appendChild(pTipo);

    // --- Columna de Precio ---
    const tdPrecio = document.createElement('td');
    tdPrecio.textContent = elemento.precio; // <-- ¡SEGURIDAD APLICADA AQUÍ!

    // --- Columna de Cantidad ---
    const tdCantidad = document.createElement('td');
    tdCantidad.textContent = elemento.cantidad; // <-- ¡SEGURIDAD APLICADA AQUÍ!

    // --- Columna de Botón Eliminar ---
    const tdBorrar = document.createElement('td');
    
    // Creamos el enlace "X"
    const aBorrar = document.createElement('a');
    aBorrar.href = "#";
    aBorrar.className = "borrar";
    aBorrar.setAttribute('data-id', elemento.id);
    aBorrar.textContent = "X "; // El texto literal "X "
    tdBorrar.appendChild(aBorrar);

    // 2. Añadir las columnas a la fila
    row.appendChild(tdImg);
    row.appendChild(tdPrecio);
    row.appendChild(tdCantidad);
    row.appendChild(tdBorrar);

    // 3. Insertar la fila en el cuerpo de la tabla
    if (lista) {
        lista.appendChild(row);
    }
}

function eliminarElemento(e) {
    e.preventDefault();
    if (e.target.classList.contains("borrar")) {
        const elementoId = e.target.getAttribute('data-id');
        
        e.target.parentElement.parentElement.remove();
        eliminarElementoLocalStorage(elementoId);
    }
}

function vaciarCarrito(e) {
    e.preventDefault();
    limpiarCarritoHTML();
    vaciarLocalStorage();
}

function obtenerElementosLocalStorage() {
    let elementosLS;
    if (localStorage.getItem('elementos') === null) {
        elementosLS = [];
    } else {
        elementosLS = JSON.parse(localStorage.getItem('elementos'));
    }
    return elementosLS;
}

function leerLocalStorage() {
    let elementosLS = obtenerElementosLocalStorage();
    elementosLS.forEach(function(elemento) {
        insertarCarrito(elemento);
    });
}

function eliminarElementoLocalStorage(elementoId) {
    let elementosLS = obtenerElementosLocalStorage();
    
    elementosLS.forEach(function(elementoLS, index) {
        if(elementoLS.id === elementoId) {
            elementosLS.splice(index, 1);
        }
    });

    localStorage.setItem('elementos', JSON.stringify(elementosLS));
}

function vaciarLocalStorage() {
    localStorage.clear();
}

function enviarPedidoWhatsApp(e) {
    e.preventDefault();
    const elementosLS = obtenerElementosLocalStorage();
    // Número de WhatsApp encontrado en el archivo index.html para consistencia.
    const numeroWhatsApp = '584241780517'; 
    let mensaje = '¡Hola! Me gustaría hacer el siguiente pedido:\n\n';
    let precioTotal = 0;

    if (elementosLS.length === 0) {
        // El alert functiona correctamente, ahora se ejecutará al hacer clic.
        alert('El carrito está vacío. Agrega productos antes de completar el pedido.');
        return;
    }

    elementosLS.forEach(elemento => {
        // Limpiamos el precio de '$' y lo convertimos a número
        const precioUnitario = parseFloat(elemento.precio.replace('$', ''));
        const subtotal = precioUnitario * elemento.cantidad;
        precioTotal += subtotal;

        // Formato de cada línea del producto
        mensaje += `* Diseño: ${elemento.titulo}\n`;
        mensaje += `  Tipo de Camisa: ${elemento.tipo}\n`;
        mensaje += `  ID de Variante: ${elemento.id}\n`;
        mensaje += `  Cantidad: ${elemento.cantidad}\n`;
        mensaje += `  Subtotal: $${subtotal.toFixed(2)}\n\n`;
    });

    // Añadir el total al final del mensaje
    mensaje += `* Total del Pedido: $${precioTotal.toFixed(2)}\n\n`;
    mensaje += 'Por favor, confírmame la disponibilidad y el método de pago.';

    // Codificar el mensaje para la URL
    const mensajeCodificado = encodeURIComponent(mensaje);

    // Generar el enlace de WhatsApp
    const whatsappURL = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;

    // Abrir el enlace en una nueva pestaña/ventana
    window.open(whatsappURL, '_blank');
}
