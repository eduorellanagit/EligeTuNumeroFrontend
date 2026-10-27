// Configuración central para conectar el frontend con el backend (Spring Boot).
// Se carga primero que cualquier otro script para que todos puedan usar estas
// constantes.
//
// Dirección del backend. Se elige sola según desde dónde se abre el sitio:
//  - desde tu PC (localhost / 127.0.0.1): backend local, http://localhost:8080
//  - publicado (eligetunumero.com): backend del servidor, https://api.eligetunumero.com
// El backend tiene que tener esta misma web como FRONTEND_URL (sirve para el CORS y para volver
// acá después de iniciar sesión o de pagar). Siempre https en producción: con http el token y los
// datos de las personas viajarían sin cifrar, y Mercado Pago/Google exigen https.
const IS_LOCAL_HOST = ['localhost', '127.0.0.1'].includes(window.location.hostname)
const API_BASE_URL = IS_LOCAL_HOST ? 'http://localhost:8080/api/v1' : 'https://api.eligetunumero.com/api/v1'

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
