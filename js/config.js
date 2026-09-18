// Configuración central para conectar el frontend con el backend real
// (Spring Boot, según la especificación). Se carga primero que cualquier
// otro script para que todos puedan usar estas constantes.
//
// Mientras el backend no esté levantado, dejá DEMO_MODE en true: el login
// se simula y la compra de créditos cae sola al modo "demo" si el fetch
// falla. El día que conectes el backend de verdad, poné DEMO_MODE en false
// y todo empieza a pegarle a API_BASE_URL de verdad.
const DEMO_MODE = true
const API_BASE_URL = 'http://localhost:8080/api/v1'

// Promo de lanzamiento: 1 crédito gratis para cuentas nuevas. Pensada para el
// primer mes (o hasta que la plataforma ya tenga un tiempo andando) — cuando
// se termine, alcanza con poner esto en false para que desaparezcan todos los
// carteles relacionados (landing, login) sin tocar el HTML.
const PROMO_FREE_CREDIT_ACTIVE = true
