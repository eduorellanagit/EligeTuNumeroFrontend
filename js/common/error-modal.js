// Ventana con el error de una petición al servidor. Se abre sola desde js/api.js cada vez
// que el backend responde con una excepción (o no se puede conectar).
//
// Muestra solo dos cosas, lo que necesita saber quien usa el sitio: un título corto y el
// mensaje que manda el backend, tal cual llega (ErrorMessage.message).
//
// Es una capa propia, separada de Modal: si el error ocurre mientras hay otro modal abierto
// (la reserva, una confirmación...), ese modal queda intacto debajo y la persona puede cerrar
// el error y volver a intentar.
const ErrorModal = (function () {
  let overlay = null

  // Título según el código HTTP (se usa cuando la excepción no está en la tabla de abajo).
  const TITLES = {
    0: 'Sin conexión',
    400: 'Datos inválidos',
    401: 'Sesión no válida',
    402: 'Créditos insuficientes',
    403: 'Acción no permitida',
    404: 'No encontrado',
    409: 'No se puede completar la acción',
    413: 'Archivo demasiado pesado',
    415: 'Formato no permitido',
  }

  // Título según la excepción del backend (ErrorMessage.exception = nombre de la clase).
  // Si llega una excepción que no está acá (por ejemplo una nueva), se usa el título del código HTTP.
  const EXCEPTION_TITLES = {
    MethodArgumentNotValidException: 'Datos inválidos',
    EmptyFile: 'Archivo vacío',
    FileTooLarge: 'Archivo demasiado pesado',
    MaxUploadSizeExceededException: 'Archivo demasiado pesado',
    UnsupportedFileFormat: 'Formato no permitido',
    EntityNotFound: 'No encontrado',
    RaffleNumbersNotFound: 'Números inexistentes',
    NoRefundablePayments: 'No hay pagos para devolver',
    InvalidCreditPlan: 'Plan de créditos no válido',
    InvalidPrizeImage: 'Imagen de premio no válida',
    DuplicatedNumbers: 'Números repetidos',
    MaxNumbersPerPurchaseExceeded: 'Demasiados números en la compra',
    ReceiptRequired: 'Falta el comprobante',
    InvalidRequestType: 'Tipo de solicitud no válido',
    InvalidToken: 'Sesión no válida',
    InvalidPaymentSignature: 'Firma de pago no válida',
    InsufficientCredits: 'Créditos insuficientes',
    UserNotActive: 'Cuenta bloqueada',
    SupportAccessDenied: 'Acceso solo para soporte',
    RaffleNotOwnedByUser: 'Esta rifa no es tuya',
    RaffleNotActive: 'La rifa no está activa',
    RaffleNumberNotAvailable: 'Número no disponible',
    ReservationNotPending: 'La reserva ya fue revisada',
    RequestAlreadyResolved: 'La solicitud ya está resuelta',
    CreditPurchaseAlreadyProcessed: 'Compra ya procesada',
    UserProfileIncomplete: 'Perfil incompleto',
    UserAlreadyDeactivated: 'La cuenta ya está desactivada',
    PendingReservationsExist: 'Tenés reservas pendientes',
  }

  function titleFor(err) {
    if (EXCEPTION_TITLES[err.exception]) return EXCEPTION_TITLES[err.exception]
    if (TITLES[err.status]) return TITLES[err.status]
    return err.status >= 500 ? 'Error del servidor' : 'No se pudo completar la acción'
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close()
  }

  function close() {
    if (!overlay) return
    overlay.remove()
    overlay = null
    document.removeEventListener('keydown', onKeydown)
  }

  // err: un ApiError (status, message y, si el backend la mandó, exception)
  function open(err) {
    // Si ya hay un error en pantalla no se abre otro (por ejemplo cuando fallan varias
    // peticiones juntas): con uno alcanza.
    if (overlay) return

    overlay = document.createElement('div')
    overlay.className = 'error-modal-overlay'
    overlay.innerHTML = `
      <div class="error-modal" role="alertdialog" aria-modal="true" aria-labelledby="error-modal-title">
        <h3 id="error-modal-title">${escapeHtml(titleFor(err))}</h3>
        <p class="error-modal__message">${escapeHtml(err.message)}</p>
        <button class="btn btn-primary btn-block" id="error-modal-ok">Entendido</button>
      </div>
    `
    document.body.appendChild(overlay)

    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close()
    })
    document.getElementById('error-modal-ok').addEventListener('click', close)
    document.addEventListener('keydown', onKeydown)
  }

  return { open, close }
})()
