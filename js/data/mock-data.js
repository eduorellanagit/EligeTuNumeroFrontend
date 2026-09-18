// Datos de ejemplo. En producción esto viene de /api/v1/*.
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

const creatorProfile = {
  name: 'Juan Pérez',
  email: 'juan.perez@gmail.com',
  authProvider: 'Google',
  dni: '34.567.890',
  whatsapp: '+54 9 381 555-1234',
  cbu: '0720123488000012345678',
  alias: 'juan.rifas.moto',
  accountHolder: 'Juan Pérez',
  credits: 3,
}

const paymentRequests = {
  pendientes: [
    {
      id: 'p1',
      raffleTitle: 'Gran Sorteo Moto 110cc 0km',
      number: 42,
      buyer: 'María Gómez',
      dni: '29.884.112',
      address: 'San Martín 845, San Miguel de Tucumán',
      whatsapp: '+54 9 381 444-2211',
      amount: 3500,
      receiptNote: 'comprobante_mp_842.jpg',
    },
    {
      id: 'p2',
      raffleTitle: 'Notebook Gamer + Combo Gaming',
      number: 17,
      buyer: 'Carlos Díaz',
      dni: '31.220.774',
      address: 'Belgrano 120, Yerba Buena',
      whatsapp: '+54 9 381 555-9087',
      amount: 3500,
      receiptNote: 'comprobante_bbva_017.jpg',
    },
    {
      id: 'p3',
      raffleTitle: 'Gran Sorteo Moto 110cc 0km',
      number: 88,
      buyer: 'Lucía Fernández',
      dni: '38.902.451',
      address: 'Av. Aconquija 2100, Yerba Buena',
      whatsapp: '+54 9 381 333-7765',
      amount: 3500,
      receiptNote: 'comprobante_galicia_088.jpg',
    },
  ],
  aceptados: [
    {
      id: 'a1',
      raffleTitle: 'Gran Sorteo Moto 110cc 0km',
      number: 5,
      buyer: 'Roberto Suárez',
      dni: '27.114.998',
      address: 'Mendoza 456, Tucumán',
      whatsapp: '+54 9 381 222-4410',
      amount: 3500,
      receiptNote: 'comprobante_005.jpg',
    },
  ],
  rechazados: [
    {
      id: 'r1',
      raffleTitle: 'Notebook Gamer + Combo Gaming',
      number: 63,
      buyer: 'Nadia Torres',
      dni: '40.556.123',
      address: 'Sarmiento 780, Tafí Viejo',
      whatsapp: '+54 9 381 666-3321',
      amount: 3500,
      receiptNote: 'comprobante_063.jpg',
    },
  ],
}

const myRafflesData = [
  {
    id: 'moto-110',
    title: 'Gran Sorteo Moto 110cc 0km',
    status: 'ACTIVA',
    totalNumbers: 100,
    sold: 62,
    daysLeft: 18,
  },
  {
    id: 'notebook-gamer',
    title: 'Notebook Gamer + Combo Gaming',
    status: 'ACTIVA',
    totalNumbers: 200,
    sold: 41,
    daysLeft: 33,
  },
  {
    id: 'freezer-family',
    title: 'Freezer Family 300L',
    status: 'CERRADA',
    totalNumbers: 50,
    sold: 50,
    daysLeft: 0,
  },
  {
    id: 'bici-rodado29',
    title: 'Bicicleta Rodado 29',
    status: 'EXPIRADA',
    totalNumbers: 100,
    sold: 34,
    daysLeft: 0,
  },
]

// Rifas creadas desde "Crear rifa" en el panel del creador. Se guardan acá
// (en memoria, se pierden al recargar) para que la página pública muestre los
// datos reales que cargó el creador en vez de siempre el ejemplo de la moto.
const createdRaffleDetails = {}

// Rifa pública de ejemplo, usada en rifa.html (?creador=...&rifa=...)
function getPublicRaffle(creatorId, raffleId) {
  if (raffleId && createdRaffleDetails[raffleId]) {
    return createdRaffleDetails[raffleId]
  }

  const total = 100
  const numbers = []
  for (let i = 1; i <= total; i++) {
    let status = 'disponible'
    if ([5, 17, 42, 63, 88].includes(i)) status = 'reservado'
    if ([3, 9, 21, 34, 55, 61, 70, 74, 90, 97].includes(i)) status = 'pagado'
    numbers.push({ number: i, status })
  }

  return {
    creatorId: creatorId || 'juanperez',
    raffleId: raffleId || 'moto-110',
    title: 'Gran Sorteo Moto 110cc 0km',
    organizer: {
      name: 'Juan Pérez',
      dni: '34.567.890',
      whatsapp: '5493815551234',
    },
    daysLeft: 18,
    holdMinutes: 30,
    pricePerNumber: 3500,
    totalNumbers: total,
    numbers,
    prizes: [
      {
        place: '1.er puesto',
        title: 'Moto 110cc 0km',
        description: 'Modelo actual, 0km, patentamiento incluido.',
        image: 'assets/sample-prizes/moto.svg',
      },
      {
        place: '2.do puesto',
        title: 'Smart TV 55"',
        description: '4K, con soporte de pared incluido.',
        image: 'assets/sample-prizes/tv.svg',
      },
      {
        place: '3.er puesto',
        title: 'Set de electrodomésticos',
        description: 'Licuadora, pava eléctrica y cafetera.',
        image: 'assets/sample-prizes/electrodomesticos.svg',
      },
    ],
    bankDetails: {
      cbu: '0720123488000012345678',
      alias: 'juan.rifas.moto',
      bank: 'Banco Galicia',
      holder: 'Juan Pérez',
    },
  }
}
