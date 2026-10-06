// Paquetes de créditos que se muestran en el panel. El backend no tiene un
// endpoint para listarlos: sus ids (basico / estandar / pro) tienen que
// coincidir con el enum CreditPlan del backend (BASICO / ESTANDAR / PRO), y
// el precio real que se cobra lo define siempre el backend, no esta lista.
// Se cargan como <script> clásico (sin type="module") para que las páginas
// funcionen abriendo el archivo HTML directamente, sin necesitar un servidor.

const pricingPlans = [
  {
    id: 'basico',
    name: 'Básico',
    raffles: 3,
    price: 4.99,
    perRaffle: 4.99 / 3,
    highlight: false,
    tagline: 'Para arrancar.',
  },
  {
    id: 'estandar',
    name: 'Estándar',
    raffles: 10,
    price: 9.99,
    perRaffle: 9.99 / 10,
    highlight: true,
    tagline: '~40% menos por rifa.',
  },
  {
    id: 'pro',
    name: 'Pro',
    raffles: 20,
    price: 14.99,
    perRaffle: 14.99 / 20,
    highlight: false,
    tagline: '~55% menos por rifa.',
  },
]
