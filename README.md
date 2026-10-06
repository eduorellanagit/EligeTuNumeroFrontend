# EligeTuNumero — Frontend (HTML + CSS + JavaScript puro)

Misma plataforma de rifas y sorteos digitales, pero sin ningún framework ni paso de
build: abrís los archivos `.html` directamente en el navegador y funciona. Cada pieza
visual tiene su propio archivo CSS, y cada pantalla tiene su propio archivo JS.

## Cómo usar la página

### Si organizás una rifa

1. **Ingresá** con tu cuenta de Google — no hay contraseñas que crear ni
   recordar. Si es tu primera vez, la cuenta se crea sola al continuar.
2. **Completá tu perfil**, en "Perfil y cobro": tu DNI/CUIL, un WhatsApp de contacto
   y los datos bancarios donde vas a recibir las transferencias.
3. **Comprá créditos** en "Mis rifas y créditos" — elegís un paquete de 1, 5 o 10
   rifas. No vencen, así que podés comprarlos con tiempo y usarlos cuando quieras.
4. **Publicá la rifa** desde "Crear rifa": cargás el título, la descripción, entre
   3 y 9 premios (con foto si querés), cuántos números va a tener, el precio de
   cada uno, cuántos números puede comprar cada persona como máximo (1, 3 o 5) y
   cuánto tiempo va a estar abierta.
5. **Compartí el link** que te da la plataforma. A partir de ahí, la gente entra,
   elige sus números, transfiere directo a tu cuenta y sube el comprobante.
6. **Validá los pagos** en "Validar pagos": por cada transferencia, revisás los
   datos de quien compró y el comprobante, y aceptás o rechazás. Vos decidís,
   nadie acepta nada por vos.

### Si comprás un número

1. Entrás al link de la rifa — no necesitás crear cuenta ni instalar nada.
2. Elegís uno o varios números libres en la grilla.
3. Completás tus datos (nombre, DNI, dirección, WhatsApp).
4. Transferís el monto exacto a la cuenta que te muestra la pantalla y subís
   una foto o PDF del comprobante.
5. Esperás a que el organizador confirme tu pago — tus números quedan reservados
   mientras tanto, hasta que el organizador valide o rechace tu comprobante.

## Beneficios

- **Sin comisión por venta.** Se paga una sola vez, por publicar la rifa —
  después, el 100% de lo que se recauda es para el organizador.
- **La plata nunca pasa por la plataforma.** Va directo del comprador al
  organizador por transferencia bancaria; nadie más la toca en el medio.
- **Quien compra no necesita cuenta.** Completa un formulario corto y listo —
  nada de contraseñas, emails a confirmar ni apps que instalar.
- **Todo en un solo link.** Premios, números disponibles, precio y datos para
  transferir quedan en una sola página, lista para compartir por WhatsApp o
  redes.
- **El organizador tiene el control.** Cada pago se acepta o rechaza a mano,
  revisando el comprobante — no hay confirmaciones automáticas que puedan
  fallar.
- **Créditos que no vencen.** Se compran una vez y se usan cuando se necesitan,
  sin fecha límite.

## Comparación con otras plataformas de rifas

Sin nombrar a nadie en particular, así suelen funcionar la mayoría de las
alternativas que existen hoy — y en qué se diferencia EligeTuNumero:

| | Otras plataformas | EligeTuNumero |
|---|---|---|
| Comisión | Suelen cobrar un % de cada boleto vendido | Cobra una vez, por publicar — 0% sobre lo vendido |
| El dinero | Muchas lo retienen y lo liberan después | Va directo del comprador al organizador |
| Cuenta del comprador | Casi siempre hay que registrarse | No hace falta crear ninguna cuenta |
| Validación de pagos | Suele ser automática (y a veces falla) | La revisa el organizador, comprobante por comprobante |
| Costo | Por lo general, mientras más vendés, más pagás | Precio fijo por rifa, sin sorpresas |

## Configuración técnica

No hace falta instalar nada. Alcanza con abrir `index.html` con doble clic, o —mejor
todavía, para que los links entre páginas funcionen perfecto— servir la carpeta con
cualquier servidor estático:

```bash
# con Python
python3 -m http.server 5500

# con Node (si tenés npx)
npx serve -l 5500 .
```

y entrar a `http://localhost:5500`. El puerto importa: el backend solo acepta
llamadas desde el origen que tenga configurado como `FRONTEND_URL` (por defecto
`http://localhost:5500`). **Abrir el HTML con doble clic (`file://`) ya no sirve**,
porque el navegador no deja que una página local le hable a la API.

## Páginas

- `index.html` — Landing pública (hero, cómo funciona, precios, preguntas frecuentes).
- `login.html` — Ingresar / registrarse. Como describe la especificación, es solo
  OAuth2 con Google (GitHub todavía no está disponible en el backend): no hay
  contraseña, y si es tu primera vez tu cuenta se crea sola al continuar. El botón
  lleva al backend, que hace el ida y vuelta con Google y te devuelve a `me.html`.
- `me.html` — Panel privado del creador: perfil y cobro, **crear rifa**, validador
  de pagos, mis rifas y créditos. Las cuatro secciones se muestran/ocultan con JS,
  no son páginas distintas.
- `rifa.html?creador=juanperez&rifa=moto-110` — Página pública de una rifa (grilla de
  números, premios, modal de reserva + comprobante). Como es todo estático, usamos
  parámetros de URL (`?creador=...&rifa=...`) en vez de rutas tipo `/juanperez/moto-110`.
  Los dos valores son los *slugs* que genera el backend (el del creador y el de la
  rifa); el link completo te lo da el panel al publicar. Los datos se piden a
  `GET /rifas/{creador}/{rifa}`.
- `terminos.html` — Términos y condiciones + un resumen de privacidad.

Desde el panel del creador (`me.html` → "Mis rifas y créditos"), cada rifa activa
tiene un link "Ver página pública ↗" que abre `rifa.html` con esos datos, **en la
misma pestaña** — ver la sección de navegación más abajo.

### Navegación: todo en una sola pestaña, con botón de volver

Ningún link interno (ni los de WhatsApp) abre pestaña nueva. `me.html`, `rifa.html`
y `login.html` tienen un botón **"← Volver"** en el encabezado (usa `history.back()`)
además de que el botón "atrás" del navegador funciona normal en todo momento. La
única excepción es el comprobante de transferencia dentro del detalle de un pago:
se abre en otra pestaña para que el organizador no pierda la ventana desde la que
acepta o rechaza.

### Flujo de compra de créditos (3 pasos)

Desde "Mis rifas y créditos", comprar créditos ahora es un flujo de 3 pasos dentro
del modal, no una acción instantánea:

1. **Elegís la cantidad** — radio buttons con los 3 paquetes (3, 10 o 20 rifas).
2. **Continuar** — pantalla de confirmación con el resumen y el total.
3. **Confirmar compra** — se llama a `POST /creditos/comprar` (ver
   `js/creator/raffles.js`), que crea la compra y devuelve un `checkoutUrl`; el
   navegador va a esa página de **Mercado Pago** para pagar. Al terminar, Mercado
   Pago devuelve al usuario a `me.html?pago=ok | error | pendiente`. Los créditos
   los acredita el backend cuando Mercado Pago le avisa por webhook, así que con
   `pago=ok` el panel consulta el saldo cada 3 segundos (hasta 30) hasta que
   aparecen, y muestra el resultado.

Si venís de la landing habiendo elegido un plan ("Elegir Estándar", etc.), pasás por
`login.html?plan=estandar` → Google → `me.html`, y el modal de compra se abre solo
con ese plan ya seleccionado (el plan se guarda en `sessionStorage` durante el viaje a
Google, porque ahí se pierde la URL).

### Crear rifa

Nueva sección en el panel (`me.html` → "Crear rifa") con el formulario completo de
la especificación: título, descripción y reglas, entre 1 y 10 premios (se agregan
de a uno, cada uno con título, descripción e imagen opcional), cantidad de números
(50/100/200), precio por número, máximo de números por compra (1/3/5) y plazo de
vigencia (20/25/30 días). Al publicar:

- Se valida que tengas al menos 1 crédito (si no, se avisa y no se puede publicar).
- Se descuenta 1 crédito en el momento de confirmar.
- La rifa aparece en "Mis rifas y créditos" y su página pública en `rifa.html`
  muestra los datos reales que cargaste (no la rifa de ejemplo).
- Se muestra el link único para compartir, tal como describe la especificación.

### Validador de pagos: rechazar no pide motivo

Rechazar un pago (fila o modal de detalle) no pide ni muestra ningún motivo — se
puede rechazar directamente, sin justificar por qué.

### Términos y condiciones

Nueva página `terminos.html` con los términos de servicio y una explicación breve
de privacidad de datos, escrita para este modelo de negocio puntual (quién es
responsable de qué, cómo se usan el DNI/CBU/WhatsApp que se piden, etc.). Está
linkeada desde el footer de la landing, desde la nota de `login.html` y desde el
footer de todas las páginas.

### Fotos de premios + ver detalle tocando el premio

En "Crear rifa", cada premio admite 1 imagen opcional (JPG/PNG). Sea cual sea la
foto que subas, se recorta automáticamente al centro en formato cuadrado (1:1,
480×480) con `<canvas>` antes de guardarla — así todas las fotos de premios quedan
consistentes sin pedirle al creador que edite nada por su cuenta
(`js/common/image-utils.js`, función `cropImageToSquare`). Hay vista previa y botón
para quitar la imagen.

En la página pública de la rifa, tocar una tarjeta de premio abre un modal con la
imagen (si tiene) y la descripción completa — el mismo patrón de modal que ya se
usaba para ver el detalle de quién compró un número.

La rifa de ejemplo (la de la moto) también tiene fotos ahora: son 3 ilustraciones
simples en SVG que armé para esta demo, guardadas en `assets/sample-prizes/`
(`moto.svg`, `tv.svg`, `electrodomesticos.svg`) — carpeta pensada como algo
temporal, para reemplazar el día que tengas fotos reales de los premios.

### Footer en login y en la página de boletos

`login.html` y `rifa.html` (donde se marcan los números) ahora tienen un footer
simple al final, con link a Inicio y a Términos y condiciones.

### Logos reales de Google y GitHub

En `login.html`, los botones de "Continuar con Google" y "GitHub (próximamente)"
ya no muestran una letra suelta: tienen el logo real de cada uno (el "G" de cuatro
colores de Google y la marca de GitHub) en SVG.


## Estructura

```
index.html
login.html
me.html
rifa.html
terminos.html
icons.svg

assets/sample-prizes/    → imágenes de ejemplo para la rifa de la moto (temporal)

css/
  tokens.css              → paleta, tipografía, espaciados, radios (variables CSS)
  base.css                → reset + estilos base compartidos + tamaño de íconos
  animations.css          → keyframes compartidos (fade, pop, slide) — ver "Animaciones"
  buttons.css             → .btn, .btn-primary, .btn-secondary, .back-button
  badges.css              → .badge y sus variantes de color
  modal.css                → el modal genérico (overlay + panel), con su animación de entrada
  forms.css                 → .field, compartido por el perfil, crear rifa y la reserva
  confirmation.css          → pantalla de "listo ✓" compartida por varios flujos
  legal.css                  → términos y condiciones (prosa larga)
  simple-footer.css          → footer chico de login, rifa y términos
  navbar.css / footer.css  → header y footer grande de la landing
  hero.css / demo-preview.css / how-it-works.css / pricing.css / faq.css
                            → cada bloque de la landing
  login.css                 → la pantalla de ingresar / registrarse
  creator-panel.css / sidebar.css / credit-balance.css / profile-section.css /
  payments-validator.css / my-raffles.css / credit-purchase.css / create-raffle.css
                            → cada bloque del panel del creador
  public-raffle.css / number-grid.css / purchase-modal.css
                            → cada bloque de la página pública de la rifa

js/
  config.js                 → API_BASE_URL (un solo lugar para apuntar al backend) y la promo
  api.js                    → cliente del backend: todas las llamadas, el manejo de errores en español
                              y las utilidades para pintar datos de forma segura (escapeHtml, safeUrl)
  data/plans.js             → los 3 paquetes de créditos que se muestran en el panel
  common/modal.js           → abrir/cerrar el modal genérico
  common/icons.js           → íconos de línea (svg embebido en JS) usados en todo el sitio
  common/render-icons.js    → pinta los <span data-icon="..."> del HTML estático
  common/image-utils.js     → recorta cualquier imagen subida a un cuadrado 1:1
  common/scroll-reveal.js   → animación de aparición al hacer scroll (clase .reveal)
  landing/faq.js            → acordeón de preguntas frecuentes
  auth/login.js             → botón de Google: lleva al backend, que hace el login
  auth/session.js           → captura el token (#token=...) que devuelve el backend, lo guarda y arma authHeaders()
  creator/tabs.js           → cambiar entre las 4 secciones del panel
  creator/state.js          → datos del creador (GET /usuarios/me) compartidos entre las secciones del panel
  creator/profile.js        → cargar y guardar el formulario de perfil
  creator/create-raffle.js  → formulario de publicación (premios con imagen): sube las imágenes y crea la rifa
  creator/payments.js       → las 3 bandejas de reservas + modal de detalle con el comprobante (aceptar / rechazar)
  creator/raffles.js        → saldo de créditos, compra con Mercado Pago (3 pasos + vuelta del pago), tarjetas de "mis rifas"
  raffle/number-grid.js     → trae la rifa del backend según la URL, pinta la grilla y los premios, maneja la selección
  raffle/purchase-modal.js  → los 3 pasos de la reserva (datos → pago → confirmación) y su envío al backend
```

## Por qué `<script>` clásico y no `type="module"`

Los archivos JS se cargan con `<script src="...">` normal (sin `type="module"`) a
propósito: los módulos de ES6 no funcionan si abrís el HTML directo desde el disco
(`file://`) en la mayoría de los navegadores, por una restricción de CORS. Con
scripts clásicos, todo funciona apenas hacés doble clic en `index.html` — sin
depender de tener un servidor corriendo.

Como comparten el mismo scope global, `js/config.js`, `js/auth/session.js` y
`js/api.js` declaran lo que usan los demás (`API_BASE_URL`, `getAuthToken()`, `Api`,
`escapeHtml()`...), siempre que estén incluidos *antes* en el HTML. En el panel
(`me.html`) el orden es: config, plans, ..., session, api, state, y recién después
los scripts de cada sección.

## Estilo

Mismos tokens de diseño que la versión en React, ahora todos en `css/tokens.css`:

- Azul principal `#234DE0` con un azul tinta más oscuro `#0F1F73` para títulos y
  superficies de contraste (footer, contador de días).
- Fondo general gris-azulado muy claro `#F5F7FB`, tarjetas blancas con bordes suaves.
- Verde / ámbar / rojo para los estados de los números (disponible / reservado /
  pagado) y de los pagos (aceptado / pendiente / rechazado).
- Tipografía: **Sora** para títulos, **Manrope** para texto, cargadas desde Google
  Fonts en el `<head>` de cada página.

## Cómo se conecta con el backend

Todo lo que habla con el servidor está en `js/api.js` (una función por endpoint) y la
URL base se cambia en un solo lugar: `js/config.js`.

```js
const API_BASE_URL = 'https://bagging-exuberant-cascade.ngrok-free.dev/api/v1'   // túnel de ngrok al backend local
```

Con ngrok gratuito, el navegador recibe una página de aviso la primera vez que entra al
dominio; `js/api.js` manda el header `ngrok-skip-browser-warning` en las llamadas `fetch` para
saltearla (solo si la URL es de ngrok). El login es una navegación de página, así que ahí la
página de aviso aparece una vez y alcanza con tocar "Visit Site". Para trabajar sin túnel,
poné `http://localhost:8080/api/v1`.

### Qué endpoint usa cada pantalla

| Pantalla | Qué hace | Endpoint |
|---|---|---|
| Login | Inicia sesión con Google | `GET /usuarios/login` (navegación, no `fetch`) |
| Panel | Datos y créditos del creador | `GET /usuarios/me` |
| Mi perfil | Guardar datos de cobro | `PUT /usuarios/me/perfil` |
| Mis rifas | Listar / cerrar | `GET /rifas/me` · `POST /rifas/{slug}/cerrar` |
| Crear rifa | Subir imagen de un premio / publicar | `POST /rifas/imagen` · `POST /rifas` |
| Validar pagos | Ver / aceptar / rechazar reservas | `GET /reservas?estado=` · `POST /reservas/{id}/aceptar` · `/rechazar` |
| Comprar créditos | Crear la compra y pagar en Mercado Pago | `POST /creditos/comprar` |
| Página pública | Ver la rifa / reservar números | `GET /rifas/{creador}/{rifa}` · `POST /rifas/{id}/reservar` |

### Sesión

El login lo hace el backend. Al terminar, redirige a `me.html#token=...` (el token va en
el *fragmento* de la URL, que el navegador no manda a ningún servidor).
`js/auth/session.js` lo guarda en `localStorage` y limpia la URL con
`history.replaceState`. Desde ahí, `Api` manda `Authorization: Bearer <token>` en cada
llamada que lo necesita. Si el servidor responde 401 (token vencido), se borra la sesión
y se vuelve a `login.html`. Las páginas que exigen sesión (`me.html`) llevan
`data-requires-auth` en el `<body>`.

### Errores

El resultado del pago de créditos (realizado / pendiente / rechazado) se muestra en `js/creator/raffles.js`.

`apiRequest` traduce los códigos HTTP a mensajes en español (por ejemplo, 402 → "No
tenés créditos suficientes", 409 → "Algo cambió mientras tanto..."). Si el backend manda un
detalle propio en los errores 400 y 409, se muestra ese.

### Seguridad al pintar datos

Todo lo que escribe una persona (títulos de rifas, nombres y direcciones de compradores,
descripciones...) pasa por `escapeHtml()` antes de meterse en el HTML, y las URLs de
imágenes y comprobantes por `safeUrl()` (solo `http`/`https`).

### CORS y cómo servir el frontend

El navegador solo deja que esta web le hable a la API si el backend la autoriza. El backend
permite `http://localhost:5500` y, además, el origen que tenga en `FRONTEND_URL`. En
producción, poné ahí la URL pública de este frontend (sin barra final) y cambiá
`API_BASE_URL` por la del backend. Esa misma variable es la que usa el backend para volver
acá después de iniciar sesión (`/me.html#token=...`) y después de pagar en Mercado Pago
(`/me.html?pago=...`).

### Qué quedó fuera

- **Login con GitHub:** el botón está visible pero deshabilitado ("próximamente"), porque el
  backend solo implementa Google.
- **Cerrar sesión:** el panel no tiene botón para eso (la sesión se cierra sola al vencer
  el token).

## Animaciones

Son deliberadamente simples: transiciones de color/sombra/posición en botones,
tarjetas y tabs; el modal aparece con un fundido + escala corta; la barra
flotante de "Reservar" entra deslizándose; las preguntas frecuentes se abren con
una transición de alto en vez de aparecer de golpe. Los keyframes compartidos
viven en `css/animations.css`; cada componente agrega su propio `transition` en su
propio archivo. Si el sistema tiene `prefers-reduced-motion` activado, la regla
global en `base.css` desactiva todas las animaciones y transiciones del sitio.
