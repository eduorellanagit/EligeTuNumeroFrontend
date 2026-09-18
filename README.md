# EligeTuNumero — Frontend (HTML + CSS + JavaScript puro)

Misma plataforma de rifas y sorteos digitales, pero sin ningún framework ni paso de
build: abrís los archivos `.html` directamente en el navegador y funciona. Cada pieza
visual tiene su propio archivo CSS, y cada pantalla tiene su propio archivo JS.

## Cómo usar la página

### Si organizás una rifa

1. **Ingresá** con tu cuenta de Google o GitHub — no hay contraseñas que crear ni
   recordar. Si es tu primera vez, la cuenta se crea sola al continuar.
2. **Completá tu perfil**, en "Perfil y cobro": tu DNI/CUIL, un WhatsApp de contacto
   y los datos bancarios donde vas a recibir las transferencias.
3. **Comprá créditos** en "Mis rifas y créditos" — elegís un paquete de 1, 5 o 10
   rifas. No vencen, así que podés comprarlos con tiempo y usarlos cuando quieras.
4. **Publicá la rifa** desde "Crear rifa": cargás el título, la descripción, entre
   3 y 9 premios (con foto si querés), cuántos números va a tener, el precio de
   cada uno, cuánto tiempo va a estar abierta y cuánto tiempo le das a alguien
   para pagar antes de liberarle el número.
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
5. Esperás a que el organizador confirme tu pago — tu número queda reservado
   mientras tanto, por el tiempo que haya definido esa rifa.

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
python3 -m http.server 8000

# con Node (si tenés npx)
npx serve .
```

y entrar a `http://localhost:8000`.

## Páginas

- `index.html` — Landing pública (hero, cómo funciona, precios, preguntas frecuentes).
- `login.html` — Ingresar / registrarse. Como describe la especificación, es solo
  OAuth2 (Google o GitHub): no hay contraseña, y si es tu primera vez tu cuenta se
  crea sola al continuar. Simula el ida y vuelta OAuth con un estado de carga breve
  y te redirige a `me.html`.
- `me.html` — Panel privado del creador: perfil y cobro, **crear rifa**, validador
  de pagos, mis rifas y créditos. Las cuatro secciones se muestran/ocultan con JS,
  no son páginas distintas.
- `rifa.html?creador=juanperez&rifa=moto-110` — Página pública de una rifa (grilla de
  números, premios, modal de reserva + comprobante). Como es todo estático, usamos
  parámetros de URL (`?creador=...&rifa=...`) en vez de rutas tipo `/juanperez/moto-110`.
  Si el id corresponde a una rifa que creaste desde el panel, se muestran sus datos
  reales; si no, se muestra la rifa de ejemplo de la moto.
- `terminos.html` — Términos y condiciones + un resumen de privacidad.

Desde el panel del creador (`me.html` → "Mis rifas y créditos"), cada rifa activa
tiene un link "Ver página pública ↗" que abre `rifa.html` con esos datos, **en la
misma pestaña** — ver la sección de navegación más abajo.

### Navegación: todo en una sola pestaña, con botón de volver

Ningún link interno (ni los de WhatsApp) abre pestaña nueva. `me.html`, `rifa.html`
y `login.html` tienen un botón **"← Volver"** en el encabezado (usa `history.back()`)
además de que el botón "atrás" del navegador funciona normal en todo momento.

### Flujo de compra de créditos (3 pasos)

Desde "Mis rifas y créditos", comprar créditos ahora es un flujo de 3 pasos dentro
del modal, no una acción instantánea:

1. **Elegís la cantidad** — radio buttons con los 3 paquetes (3, 10 o 20 rifas).
2. **Continuar** — pantalla de confirmación con el resumen y el total.
3. **Confirmar compra** — ahí se manda la solicitud HTTP (`fetch` a
   `/api/v1/creditos/comprar`, ver `js/creator/raffles.js`). Como esta demo no tiene
   backend corriendo, si la request falla se simula que Mercado Pago aprobó el pago
   para que puedas ver el flujo completo — el comentario en el código marca
   exactamente dónde se conecta el backend real.

Si venís de la landing habiendo elegido un plan ("Elegir Estándar", etc.), pasás por
`login.html?plan=estandar` → `me.html?plan=estandar`, y el modal de compra se abre
solo con ese plan ya seleccionado.

### Crear rifa

Nueva sección en el panel (`me.html` → "Crear rifa") con el formulario completo de
la especificación: título, descripción y reglas, entre 1 y 10 premios (se agregan
de a uno, cada uno con título, descripción e imagen opcional), cantidad de números
(50/100/200), precio por número, plazo de vigencia (20/25/30 días) y tiempo de
espera para pagar antes de liberar un número (30/60 minutos o 2 horas). Al publicar:

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

En `login.html`, los botones de "Continuar con Google" y "Continuar con GitHub"
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
  config.js                 → DEMO_MODE y API_BASE_URL, un solo lugar para apuntar al backend
  data/mock-data.js         → datos de ejemplo (reemplazar por llamadas a /api/v1/*)
  common/modal.js           → abrir/cerrar el modal genérico
  common/icons.js           → íconos de línea (svg embebido en JS) usados en todo el sitio
  common/render-icons.js    → pinta los <span data-icon="..."> del HTML estático
  common/image-utils.js     → recorta cualquier imagen subida a un cuadrado 1:1
  common/scroll-reveal.js   → animación de aparición al hacer scroll (clase .reveal)
  landing/faq.js            → acordeón de preguntas frecuentes
  auth/login.js             → login OAuth2 (simulado en DEMO_MODE, real si no)
  auth/session.js           → captura el token que devuelve el backend y arma authHeaders()
  creator/tabs.js           → cambiar entre las 4 secciones del panel
  creator/profile.js        → cargar y "guardar" el formulario de perfil
  creator/create-raffle.js  → formulario de publicación (premios 1-10 con imagen) + descuento de crédito
  creator/payments.js       → las 3 bandejas de pagos + modal de detalle (sin motivo de rechazo)
  creator/raffles.js        → saldo de créditos, flujo de compra de 3 pasos (con fetch real), tarjetas de "mis rifas"
  raffle/number-grid.js     → arma la rifa desde la URL, pinta la grilla y los premios (clicables), maneja selección
  raffle/purchase-modal.js  → los 3 pasos de la reserva (datos → pago → confirmación)
```

## Por qué `<script>` clásico y no `type="module"`

Los archivos JS se cargan con `<script src="...">` normal (sin `type="module"`) a
propósito: los módulos de ES6 no funcionan si abrís el HTML directo desde el disco
(`file://`) en la mayoría de los navegadores, por una restricción de CORS. Con
scripts clásicos, todo funciona apenas hacés doble clic en `index.html` — sin
depender de tener un servidor corriendo.

Como comparten el mismo scope global, `js/data/mock-data.js` declara los datos de
ejemplo (`pricingPlans`, `creatorProfile`, etc.) y el resto de los scripts los usan
directamente, siempre que `mock-data.js` esté incluido *antes* en el HTML.

## Estilo

Mismos tokens de diseño que la versión en React, ahora todos en `css/tokens.css`:

- Azul principal `#234DE0` con un azul tinta más oscuro `#0F1F73` para títulos y
  superficies de contraste (footer, contador de días).
- Fondo general gris-azulado muy claro `#F5F7FB`, tarjetas blancas con bordes suaves.
- Verde / ámbar / rojo para los estados de los números (disponible / reservado /
  pagado) y de los pagos (aceptado / pendiente / rechazado).
- Tipografía: **Sora** para títulos, **Manrope** para texto, cargadas desde Google
  Fonts en el `<head>` de cada página.

## Qué es simulado (no hay backend todavía)

Todo lo de abajo se controla desde un solo lugar: `js/config.js`.

```js
const DEMO_MODE = true                          // false cuando el backend ya esté levantado
const API_BASE_URL = 'http://localhost:8080/api/v1'
```

Con `DEMO_MODE en true` (el valor por defecto):

- El login con Google/GitHub no hace ningún OAuth real: solo un estado de carga y
  una redirección a `me.html`.
- Elegir números, abrir el modal de reserva, "subir" un comprobante y ver la
  confirmación: todo pasa en el navegador, en memoria.
- Aceptar/rechazar pagos y cerrar una rifa en el panel del creador: actualiza el
  objeto de datos en JS y vuelve a pintar la pantalla, pero no persiste si recargás
  la página.
- **Comprar créditos sí manda una solicitud HTTP real** (`fetch` a
  `API_BASE_URL + '/creditos/comprar'` desde `js/creator/raffles.js`) — como no hay
  servidor detrás en esta demo, la request falla y el código lo captura para
  simular que Mercado Pago aprobó el pago, pero el llamado a `fetch` con su body,
  headers y `credentials` ya está armado tal como lo necesitaría el backend real.
- **Crear una rifa** también queda solo en memoria: se pierde al recargar la página,
  igual que el resto de los datos.

## Conectar con el backend real (OAuth2 + CORS)

### 1. Apagar el modo demo

En `js/config.js`, poné `DEMO_MODE = false` y ajustá `API_BASE_URL` si tu backend
no corre en `http://localhost:8080/api/v1`.

### 2. Login con OAuth2

Con `DEMO_MODE` en `false`, los botones de `login.html` (`js/auth/login.js`) dejan
de simular y navegan directo a:

```
GET {API_BASE_URL}/auth/google?redirect_uri=...
GET {API_BASE_URL}/auth/github?redirect_uri=...
```

Eso es una navegación de página completa, no un `fetch` — por eso el login en sí
**no tiene problemas de CORS**: Spring Security hace todo el intercambio OAuth2 con
Google/GitHub del lado del servidor y, cuando termina, redirige al navegador de
vuelta al `redirect_uri` agregando `?token=...`.

`js/auth/session.js` (cargado en `me.html`) espera exactamente eso: agarra el
`token` de la URL, lo guarda en `localStorage` y limpia la URL con
`history.replaceState` para que no quede a la vista ni en el historial. De ahí en
adelante, `authHeaders()` (del mismo archivo) devuelve
`{ Authorization: 'Bearer <token>' }` para mandarlo en cualquier `fetch` al backend
— ya se usa así en la compra de créditos.

Si tu backend en cambio maneja la sesión con una cookie (típico de Spring Security
con OAuth2 Login "clásico"), no necesitás nada de esto: alcanza con que la cookie
sea `httpOnly` y que los `fetch` sigan mandando `credentials: 'include'` (ya lo
hacen).

### 3. CORS para las llamadas a la API

El login en sí no necesita CORS (es una navegación, no un `fetch`), pero **la
compra de créditos y cualquier otra llamada a la API sí lo necesitan**, porque el
frontend y el backend corren en orígenes distintos (por ejemplo, el frontend
servido en `http://localhost:5500` o `http://127.0.0.1:8000`, y el backend en
`http://localhost:8080`).

En el backend (Spring Boot), algo así:

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/v1/**")
                    // el/los orígenes desde donde serví este frontend — nunca "*" si usás cookies
                    .allowedOrigins("http://localhost:5500", "http://127.0.0.1:5500")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

Puntos importantes:

- `allowedOrigins` tiene que coincidir *exacto* con el origen desde donde abrís
  este frontend (protocolo + host + puerto). Si usás VS Code Live Server suele ser
  `http://127.0.0.1:5500`; con `python3 -m http.server` es `http://localhost:8000`
  (o el puerto que le pases).
- Abrir el HTML con doble clic (`file://...`) **no funciona** para llamar a un
  backend real: el navegador manda `Origin: null` y ningún backend debería
  aceptar eso. Para conectar con el backend, serví esta carpeta con un servidor
  HTTP simple (ver "Cómo usarlo" más arriba).
- Si `allowCredentials` es `true`, `allowedOrigins` no puede ser `"*"` — es una
  regla del estándar CORS, no una limitación de Spring.

## Animaciones

Son deliberadamente simples: transiciones de color/sombra/posición en botones,
tarjetas y tabs; el modal aparece con un fundido + escala corta; la barra
flotante de "Reservar" entra deslizándose; las preguntas frecuentes se abren con
una transición de alto en vez de aparecer de golpe. Los keyframes compartidos
viven en `css/animations.css`; cada componente agrega su propio `transition` en su
propio archivo. Si el sistema tiene `prefers-reduced-motion` activado, la regla
global en `base.css` desactiva todas las animaciones y transiciones del sitio.

Cuando conectes esto a la API real (Spring Boot, según la especificación), lo que
más cambia es `js/data/mock-data.js` (pasa a pedir los datos con `fetch`, usando
`API_BASE_URL` y `authHeaders()`) y los puntos donde hoy se actualiza el estado en
memoria (crear rifa, aceptar/rechazar pagos), que pasan a hacer su propio `fetch`
al backend con el mismo patrón que ya tiene la compra de créditos.
