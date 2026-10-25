// Simulador de Eleva2: reproduce la lógica dual del Arduino
// Pisos: 0 = Planta Baja, 1 = Piso 1, 2 = Piso 2

const cabin = document.getElementById('cabin');
const lcd1 = document.getElementById('lcd1');
const lcd2 = document.getElementById('lcd2');
const botones = document.querySelectorAll('#botonera button');
const botonesPerfil = document.querySelectorAll('.btn-sim');

const NOMBRE_PISO = ['PB', 'Piso 1', 'Piso 2'];
const TIMEOUT_BOTONERA_MS = 10000;

let pisoActual = 0;
let ocupado = false;
let resolverPiso = null;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function mostrar(l1, l2 = '') {
    lcd1.textContent = l1;
    lcd2.textContent = l2;
}

function reposo() {
    mostrar('ELEVA2', 'Apoye su tarjeta');
}

function bloquearBotonera(bloqueada) {
    botones.forEach((b) => (b.disabled = bloqueada));
}

function bloquearPerfiles(bloqueados) {
    botonesPerfil.forEach((b) => (b.disabled = bloqueados));
}

function irA(piso) {
    pisoActual = piso;
    // fila 0 = P2 (arriba) ... fila 2 = PB (abajo)
    cabin.style.setProperty('--row', 2 - piso);
}

async function ciclosPuerta() {
    mostrar('Abriendo puerta', NOMBRE_PISO[pisoActual]);
    cabin.classList.add('open');
    await esperar(900);
    mostrar('Puerta abierta', 'Pase por favor');
    await esperar(2000);
    mostrar('Cerrando puerta', 'Atencion');
    cabin.classList.remove('open');
    await esperar(900);
}

async function viajarA(destino) {
    if (destino !== pisoActual) {
        const verbo = destino > pisoActual ? 'Subiendo a ' : 'Bajando a ';
        mostrar('En movimiento', verbo + NOMBRE_PISO[destino]);
        irA(destino);
        await esperar(1400);
    }
    await ciclosPuerta();
}

// Espera que el usuario toque un botón de piso (o se agote el tiempo)
function esperarPiso() {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            resolverPiso = null;
            resolve(null);
        }, TIMEOUT_BOTONERA_MS);

        resolverPiso = (piso) => {
            clearTimeout(timer);
            resolverPiso = null;
            resolve(piso);
        };
    });
}

botones.forEach((boton) => {
    boton.addEventListener('click', () => {
        if (resolverPiso) resolverPiso(Number(boton.dataset.piso));
    });
});

async function simular(perfil) {
    if (ocupado) return;
    ocupado = true;
    bloquearPerfiles(true);

    if (perfil === 'normal') {
        mostrar('Bienvenido!', 'Seleccione piso');
        bloquearBotonera(false);
        const destino = await esperarPiso();
        bloquearBotonera(true);

        if (destino === null) {
            mostrar('Tiempo agotado', 'Apoye tarjeta');
            await esperar(1500);
        } else {
            await viajarA(destino);
        }
    } else if (perfil === 'nino' || perfil === 'mascota') {
        // Inquilino restringido: la botonera queda bloqueada todo el tiempo
        const esMascota = perfil === 'mascota';
        const nombre = esMascota ? 'Toto' : 'Maria';
        const piso = esMascota ? 1 : 2;
        mostrar('Hola ' + nombre + '!', 'Yendo a ' + NOMBRE_PISO[piso]);
        await esperar(1500);
        await viajarA(piso);
    } else {
        mostrar('Acceso no', 'autorizado');
        await esperar(2500);
    }

    reposo();
    bloquearPerfiles(false);
    ocupado = false;
}

botonesPerfil.forEach((boton) => {
    boton.addEventListener('click', () => simular(boton.dataset.perfil));
});

reposo();

// Menú hamburguesa (móvil)
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

function cerrarMenu() {
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
}

menuToggle.addEventListener('click', () => {
    const abierto = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(abierto));
    menuToggle.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
});

navLinks.querySelectorAll('a').forEach((enlace) => enlace.addEventListener('click', cerrarMenu));
