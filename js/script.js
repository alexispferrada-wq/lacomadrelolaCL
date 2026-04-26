// ================================================================
// La Comadre Lola - script.js
// Funcionalidades interactivas del sitio web
// ================================================================

// ================================================================
// 0. GENERADOR DINÁMICO DE ROSAS Y PÉTALOS
// Crea elementos animados que caen por los bordes de la pantalla
// ================================================================
function initRoseGarden() {
    const container = document.getElementById('rose-garden-container');
    const totalRoses = 80; // Total por lado
    const totalPetals = 10; // Total por lado
    
    // Crea un elemento (rosa o pétalo) que cae por uno de los bordes
    function createFallingElement(className, symbol, isLeft, index, isPetal = false) {
        const el = document.createElement('div');
        el.className = `${className}`;
        el.innerHTML = symbol;
        
        // Posición aleatoria cerca del borde (0% a 2.5% del ancho)
        const edgePosition = (Math.random() * 2.5).toFixed(1);
        el.style[isLeft ? 'left' : 'right'] = `${edgePosition}%`;
        
        // Tiempos de animación aleatorios
        const duration = (isPetal ? 13 : 17) + Math.random() * 12; // Entre 17 y 29s para rosas
        const delay = -(Math.random() * 80); // Desfase inicial negativo para distribución
        const size = isPetal ? '' : (22 + Math.random() * 9).toFixed(0) + 'px'; // Tamaños variados
        
        el.style.animationDuration = `${duration}s`;
        el.style.animationDelay = `${delay}s`;
        if (!isPetal) el.style.fontSize = size;
        
        container.appendChild(el);
    }

    // Generar elementos en el lado izquierdo y derecho
    for (let i = 0; i < totalRoses; i++) {
        createFallingElement('rose', '🌹', true, i);
        createFallingElement('rose', '🌹', false, i);
    }
    for (let i = 0; i < totalPetals; i++) {
        createFallingElement('petal', '', true, i, true);
        createFallingElement('petal', '', false, i, true);
    }
}

// Inicializar el jardín al cargar el DOM
document.addEventListener('DOMContentLoaded', initRoseGarden);


// ================================================================
// 1. CHATBOT DE RESERVAS
// Guía al usuario paso a paso hasta generar un mensaje de WhatsApp
// ================================================================
let reservationData = { tipo: '', personas: '', fecha: '' };
let currentStep = 1;

/**
 * Escapa caracteres HTML para prevenir inyección de código (XSS)
 * @param {string} str - Texto a escapar
 * @returns {string} Texto con caracteres HTML escapados
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Maneja la selección de una opción en el chat
 * @param {number} step - Paso actual del chat
 * @param {string} value - Valor de la opción elegida
 * @param {string} label - Etiqueta visible de la opción
 */
function selectOption(step, value, label) {
    reservationData.tipo = value;
    addUserMessage(label);
    document.getElementById(`step${step}`).style.display = 'none';
    setTimeout(() => { currentStep++; showNextStep(currentStep); }, 600);
}

/**
 * Agrega un mensaje del usuario al chat
 * @param {string} text - Texto del mensaje (se escapa para prevenir XSS)
 */
function addUserMessage(text) {
    const container = document.getElementById('chatMessages');
    container.innerHTML += `<div class="chat-message user"><div class="chat-avatar user" aria-hidden="true">😊</div><div class="chat-bubble">${escapeHtml(text)}</div></div>`;
    container.scrollTop = container.scrollHeight;
}

/**
 * Muestra el siguiente paso del flujo de reserva
 * @param {number} step - Número del paso a mostrar
 */
function showNextStep(step) {
    const container = document.getElementById('chatMessages');
    let msg = step === 2
        ? '¿Para cuántas personas y en qué fecha? (Ej: 4 personas el viernes)'
        : '¡Perfecto! Déjanos tu Nombre y Teléfono.';
    container.innerHTML += `<div class="chat-message"><div class="chat-avatar" aria-hidden="true">🌮</div><div class="chat-bubble">${msg}</div></div>`;
    container.scrollTop = container.scrollHeight;
}

/**
 * Envía el mensaje escrito en el input del chat
 */
function sendMessage() {
    const input = document.getElementById('chatInput');
    const value = input.value.trim();
    if (!value) return;
    addUserMessage(value);
    input.value = '';
    
    setTimeout(() => {
        if (currentStep === 2) {
            reservationData.personas = value;
            currentStep++;
            showNextStep(currentStep);
        } else if (currentStep === 3) {
            const container = document.getElementById('chatMessages');
            // Redirige a WhatsApp con los datos de la reserva pre-cargados
            const textEncoded = encodeURIComponent(
                `Hola! Quiero reservar: ${reservationData.tipo}. Detalle: ${reservationData.personas}. Datos: ${value}`
            );
            container.innerHTML += `<div class="chat-message"><div class="chat-avatar" aria-hidden="true">🌮</div><div class="chat-bubble"><strong>¡Todo listo! 🎉</strong><br><br><a href="https://wa.me/569XXXXXXXX?text=${textEncoded}" target="_blank" rel="noopener noreferrer" style="color: #00FF7F; text-decoration: none; font-weight: bold;">📱 Click aquí para confirmar por WhatsApp</a></div></div>`;
            container.scrollTop = container.scrollHeight;
        }
    }, 600);
}


// ================================================================
// 2. CARRUSEL TIPO CINE - EVENTOS DESTACADOS
// Cicla automáticamente entre diapositivas de imágenes
// ================================================================
let cineCurrentSlide = 0;
const cineSlides = document.querySelectorAll('.cine-slide');
const cineDots = document.querySelectorAll('.cine-dot');

/**
 * Navega a una diapositiva específica del carrusel
 * @param {number} index - Índice de la diapositiva destino
 */
function goToSlide(index) {
    cineSlides[cineCurrentSlide].classList.remove('active');
    cineDots[cineCurrentSlide].classList.remove('active');
    cineCurrentSlide = index;
    cineSlides[cineCurrentSlide].classList.add('active');
    cineDots[cineCurrentSlide].classList.add('active');
}

/** Avanza al siguiente slide del carrusel de forma cíclica */
function nextCineSlide() {
    goToSlide((cineCurrentSlide + 1) % cineSlides.length);
}

// Avance automático cada 5 segundos
setInterval(nextCineSlide, 5000);


// ================================================================
// 3. TARJETA CÓMO LLEGAR - SELECTOR DE TRANSPORTE
// Muestra instrucciones según el medio de transporte elegido
// ================================================================

/**
 * Cambia el panel de transporte activo
 * @param {string} tipo - Tipo de transporte ('metro', 'micro', 'auto', 'apps')
 * @param {HTMLElement} boton - Botón tab que fue clickeado
 */
function cambiarTransporte(tipo, boton) {
    // Desactivar todos los tabs
    document.querySelectorAll('.transporte-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    // Activar el tab seleccionado
    boton.classList.add('active');
    
    // Ocultar todos los paneles
    document.querySelectorAll('.transporte-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    // Mostrar el panel correspondiente
    document.getElementById('panel-' + tipo).classList.add('active');
}


// ================================================================
// 4. TARJETA DE HORARIOS INTERACTIVA
// Muestra si el local está abierto/cerrado y cuenta regresiva
// ================================================================
(function initHorariosCard() {
    // Frases chilenas que se muestran cuando el local está abierto
    const frasesAbiertas = [
        { texto: "¡Estamos <span>carreteando</span>! Pasa nomás caleta 🔥", emoji: "🍻" },
        { texto: "¡<span>Ven po</span> que te guardamos mesa! 🪑", emoji: "🌮" },
        { texto: "¡La <span>chela</span> está helá! 🍺", emoji: "❄️" },
        { texto: "¡Hoy día estamos <span>terribles de choros</span>! 💯", emoji: "🔥" },
        { texto: "¡Pasa que estamos <span>bacanes</span>! ✨", emoji: "😎" },
        { texto: "¡La <span>weá</span> está buena, ven po! 🎉", emoji: "💃" },
        { texto: "¡Estamos con <span>ganas de atenderte</span>! 🌮", emoji: "🍽️" },
        { texto: "¡Estamos <span>filete</span>! Entra nomás 👌", emoji: "✨" },
        { texto: "¡Ven a <span>tomarte unas</span> con nosotros! 🍺", emoji: "🤝" }
    ];
    
    // Frases chilenas que se muestran cuando el local está cerrado
    const frasesCerradas = [
        { texto: "Ya <span>cerramos la piocha</span>... 😴", emoji: "🌙" },
        { texto: "Estamos <span>recargando baterías</span> pa la otra 🔋", emoji: "⚡" },
        { texto: "La <span>comadre</span> está roncando... 💤", emoji: "😪" },
        { texto: "Volvemos <span>al tiro</span>, no te desesperíiis! ⏰", emoji: "🕒" },
        { texto: "Estamos <span>sobrios</span> todavía... 🍷", emoji: "😅" },
        { texto: "¡<span>Aguanta</span> las papas que volvemos! 🥔", emoji: "💪" },
        { texto: "Cerrao. <span>Volve</span> cuando abramos nomás 🚪", emoji: "👋" },
        { texto: "Estamos <span>apurando</span> la pega, ya abrimos 💼", emoji: "🔨" }
    ];
    
    /**
     * Calcula si el local está abierto según los horarios y
     * actualiza la interfaz de usuario con el estado actual.
     * @returns {{ abierto: boolean, targetTime: Date|null }}
     */
    function actualizarEstado() {
        const ahora = new Date();
        const dia = ahora.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
        const hora = ahora.getHours();
        const minutos = ahora.getMinutes();
        const minutosTotales = hora * 60 + minutos;
        
        let abierto = false;
        let targetTime = null;
        let mensajeCountdown = "";
        
        // Lunes (1) y Martes (2): Cerrado
        if (dia === 1 || dia === 2) {
            abierto = false;
            // Próxima apertura: Miércoles 17:00
            let diasHastaMiercoles = 3 - dia;
            targetTime = new Date(ahora);
            targetTime.setDate(targetTime.getDate() + diasHastaMiercoles);
            targetTime.setHours(17, 0, 0, 0);
            mensajeCountdown = "¡Estamos filete, abrimos el miércoles!";
        }
        // Miércoles (3): 17:00 - 00:00
        else if (dia === 3) {
            const apertura = 17 * 60; // 17:00
            const cierre = 24 * 60;   // 00:00
            
            if (minutosTotales >= apertura && minutosTotales < cierre) {
                abierto = true;
                targetTime = new Date(ahora);
                targetTime.setHours(24, 0, 0, 0); // Medianoche
                mensajeCountdown = "Nos queda poco tiempo de carrete:";
            } else {
                abierto = false;
                targetTime = new Date(ahora);
                targetTime.setHours(17, 0, 0, 0);
                mensajeCountdown = "¡Ya po, falta poco pa que abramos!";
            }
        }
        // Jueves (4): 17:00 - 01:00
        else if (dia === 4) {
            const apertura = 17 * 60; // 17:00
            
            if (minutosTotales >= apertura && minutosTotales < 24 * 60) {
                // Entre las 17:00 y medianoche
                abierto = true;
                targetTime = new Date(ahora);
                targetTime.setDate(targetTime.getDate() + 1);
                targetTime.setHours(1, 0, 0, 0);
                mensajeCountdown = "Seguimos con el carrete:";
            } else if (minutosTotales < apertura) {
                // Antes de las 17:00
                abierto = false;
                targetTime = new Date(ahora);
                targetTime.setHours(17, 0, 0, 0);
                mensajeCountdown = "¡Aguanta, hoy abrimos!";
            } else {
                // Entre medianoche y 01:00
                abierto = true;
                targetTime = new Date(ahora);
                targetTime.setHours(1, 0, 0, 0);
                mensajeCountdown = "Últimos minutos de carrete:";
            }
        }
        // Viernes (5): 13:00 - 02:00 (del sábado)
        else if (dia === 5) {
            const apertura = 13 * 60; // 13:00
            
            if (minutosTotales >= apertura) {
                // Después de las 13:00
                abierto = true;
                targetTime = new Date(ahora);
                targetTime.setDate(targetTime.getDate() + 1);
                targetTime.setHours(2, 0, 0, 0);
                mensajeCountdown = "¡Viernes de carrete sin límite!";
            } else {
                // Antes de las 13:00
                abierto = false;
                targetTime = new Date(ahora);
                targetTime.setHours(13, 0, 0, 0);
                mensajeCountdown = "¡Ya po, falta noma pa empezar!";
            }
        }
        // Sábado (6): 13:00 - 02:00 (del domingo)
        else if (dia === 6) {
            const apertura = 13 * 60; // 13:00
            
            if (minutosTotales >= apertura) {
                // Después de las 13:00
                abierto = true;
                targetTime = new Date(ahora);
                targetTime.setDate(targetTime.getDate() + 1);
                targetTime.setHours(2, 0, 0, 0);
                mensajeCountdown = "¡Sábado de puro carrete!";
            } else {
                // Entre 00:00 y 13:00 (después de cerrar el viernes)
                abierto = false;
                targetTime = new Date(ahora);
                targetTime.setHours(13, 0, 0, 0);
                mensajeCountdown = "¡Ya despertamos, abrimos al tiro!";
            }
        }
        // Domingo (0): 13:00 - 19:00
        else if (dia === 0) {
            const apertura = 13 * 60; // 13:00
            const cierre = 19 * 60;   // 19:00
            
            if (minutosTotales >= apertura && minutosTotales < cierre) {
                abierto = true;
                targetTime = new Date(ahora);
                targetTime.setHours(19, 0, 0, 0);
                mensajeCountdown = "Todavía estamos filete:";
            } else if (minutosTotales < apertura) {
                abierto = false;
                targetTime = new Date(ahora);
                targetTime.setHours(13, 0, 0, 0);
                mensajeCountdown = "¡Ya despertamos, abrimos almuerzo!";
            } else {
                // Después de las 19:00
                abierto = false;
                // Próxima apertura: Miércoles 17:00
                targetTime = new Date(ahora);
                targetTime.setDate(targetTime.getDate() + 3); // Miércoles
                targetTime.setHours(17, 0, 0, 0);
                mensajeCountdown = "¡Nos vemos el miércoles, que estés bacán!";
            }
        }
        
        // Actualizar elementos de la UI
        const estadoIndicator = document.getElementById('estadoIndicator');
        const estadoTexto = document.getElementById('estadoTexto');
        const fraseChilena = document.getElementById('fraseChilena');
        const countdownHorarios = document.getElementById('countdownHorarios');
        const countdownTexto = document.getElementById('countdownTexto');
        
        if (abierto) {
            estadoIndicator.className = 'estado-indicator abierto';
            estadoTexto.className = 'estado-texto abierto';
            estadoTexto.textContent = '¡ABIERTO!';
            const frase = frasesAbiertas[Math.floor(Math.random() * frasesAbiertas.length)];
            fraseChilena.innerHTML = frase.texto + ' ' + frase.emoji;
            countdownHorarios.style.display = 'flex';
            countdownTexto.textContent = mensajeCountdown;
        } else {
            estadoIndicator.className = 'estado-indicator cerrado';
            estadoTexto.className = 'estado-texto cerrado';
            estadoTexto.textContent = 'CERRAO';
            const frase = frasesCerradas[Math.floor(Math.random() * frasesCerradas.length)];
            fraseChilena.innerHTML = frase.texto + ' ' + frase.emoji;
            countdownHorarios.style.display = 'flex';
            countdownTexto.textContent = mensajeCountdown;
        }
        
        // Actualizar countdown
        if (targetTime) {
            actualizarCountdown(targetTime);
        }
        
        // Resaltar el día actual en la tabla de horarios
        document.querySelectorAll('.horario-item').forEach(item => {
            const dias = item.getAttribute('data-dia');
            const textoDia = item.querySelector('.texto');
            if (dias && dias.split(',').includes(String(dia))) {
                textoDia.classList.add('hoy');
                item.style.background = 'rgba(232, 145, 58, 0.15)';
                item.style.borderRadius = '8px';
            }
        });
        
        return { abierto, targetTime };
    }
    
    /**
     * Actualiza el contador regresivo hasta la próxima apertura o cierre
     * @param {Date} targetTime - Tiempo objetivo al que debe contar
     */
    function actualizarCountdown(targetTime) {
        const ahora = new Date();
        let diff = targetTime - ahora;
        
        if (diff < 0) {
            // Si el tiempo ya pasó, recalcular el estado
            actualizarEstado();
            return;
        }
        
        const horas = Math.floor(diff / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('cdHoras').textContent = String(horas).padStart(2, '0');
        document.getElementById('cdMinutos').textContent = String(minutos).padStart(2, '0');
        document.getElementById('cdSegundos').textContent = String(segundos).padStart(2, '0');
    }
    
    // Inicializar estado al cargar
    const estado = actualizarEstado();
    
    // Actualizar countdown cada segundo
    setInterval(() => {
        if (estado.targetTime) {
            actualizarCountdown(estado.targetTime);
        }
    }, 1000);
    
    // Recalcular estado cada minuto
    setInterval(actualizarEstado, 60000);
})();
