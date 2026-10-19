// Configuración central para conectar el frontend con el backend (Spring Boot).
// Se carga primero que cualquier otro script para que todos puedan usar estas
// constantes.
//
// Al desplegar, cambiá API_BASE_URL por la URL pública de tu backend (https) y
// asegurate de que el backend tenga esta misma web como FRONTEND_URL (sirve
// para el CORS y para volver acá después de iniciar sesión o de pagar).
// Hoy apunta al túnel de ngrok que expone el backend local. Se usa https (el mismo dominio
// también responde por http): con http el token y los datos de las personas viajarían sin
// cifrar por internet, y Mercado Pago exige https para avisar los pagos.
// Si el túnel cambia de dirección (ngrok gratis la cambia al reiniciar si no tenés dominio fijo),
// es lo único que hay que actualizar. Para desarrollo sin túnel: 'http://localhost:8080/api/v1'.
const API_BASE_URL = 'https://bagging-exuberant-cascade.ngrok-free.dev/api/v1'

// Promo de lanzamiento: 1 crédito gratis para cuentas nuevas. Pensada para el
// primer mes (o hasta que la plataforma ya tenga un tiempo andando) — cuando
// se termine, alcanza con poner esto en false para que desaparezcan todos los
// carteles relacionados (landing, login) sin tocar el HTML.
const PROMO_FREE_CREDIT_ACTIVE = true

// Pantalla de carga (círculo girando) que tapa el panel y la página de la rifa mientras se piden
// los datos, para que no se vea cómo se va armando todo. Dura entre PAGE_LOADER_MIN_MS y
// PAGE_LOADER_MAX_MS: si los datos llegan antes del mínimo, espera; si tardan más del máximo,
// se muestra lo que haya. Es una prueba: poniendo PAGE_LOADER_ENABLED en false desaparece.
const PAGE_LOADER_ENABLED = true
const PAGE_LOADER_MIN_MS = 2000
const PAGE_LOADER_MAX_MS = 3000
