import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { isSimulandoActivo, MENSAJE_BLOQUEO_SIMULACION } from '@/lib/roleSimulator';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
const base44Raw = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// ── Bloqueo centralizado de escrituras durante "Simular Rol" ────────────────
// Solo Base del Sistema (super_admin) puede activar la simulación (ver
// src/lib/roleSimulator.js, que valida esto antes de guardar el estado).
// Mientras está activa, cualquier create/update/delete/bulk* de entidades, y
// cualquier invoke de función, queda bloqueado — sin tocar cada pantalla.
const METODOS_ESCRITURA = new Set([
  'create', 'update', 'delete', 'bulkCreate', 'bulkUpdate', 'bulkDelete',
]);

// Entidades con "soft delete" (campo `activo`): en vez de tocar cada pantalla
// que hace .list()/.filter(), se filtra una sola vez aquí — los registros con
// activo === false (eliminados lógicamente) nunca llegan a la UI por defecto.
const ENTIDADES_CON_SOFT_DELETE = new Set(['Equipo', 'Repuesto']);
const METODOS_LECTURA_LISTA = new Set(['list', 'filter']);

function ocultarInactivos(resultado) {
  return Array.isArray(resultado) ? resultado.filter((item) => item?.activo !== false) : resultado;
}

function bloquearSiSimulando(fn, contexto) {
  return (...args) => {
    if (isSimulandoActivo()) {
      return Promise.reject(new Error(`${MENSAJE_BLOQUEO_SIMULACION} (${contexto})`));
    }
    return fn(...args);
  };
}

function envolverEntidad(entidad, nombre) {
  return new Proxy(entidad, {
    get(target, prop, receiver) {
      const valor = Reflect.get(target, prop, receiver);
      if (typeof valor === 'function' && METODOS_ESCRITURA.has(prop)) {
        return bloquearSiSimulando(valor.bind(target), `${String(nombre)}.${String(prop)}`);
      }
      if (
        typeof valor === 'function' &&
        METODOS_LECTURA_LISTA.has(prop) &&
        ENTIDADES_CON_SOFT_DELETE.has(String(nombre))
      ) {
        const original = valor.bind(target);
        return (...args) => Promise.resolve(original(...args)).then(ocultarInactivos);
      }
      return typeof valor === 'function' ? valor.bind(target) : valor;
    },
  });
}

const entitiesProxy = new Proxy(base44Raw.entities || {}, {
  get(target, prop, receiver) {
    const entidad = Reflect.get(target, prop, receiver);
    if (entidad && typeof entidad === 'object') return envolverEntidad(entidad, prop);
    return entidad;
  },
});

const functionsProxy = base44Raw.functions
  ? new Proxy(base44Raw.functions, {
      get(target, prop, receiver) {
        const valor = Reflect.get(target, prop, receiver);
        if (prop === 'invoke' && typeof valor === 'function') {
          return bloquearSiSimulando(valor.bind(target), 'functions.invoke');
        }
        return typeof valor === 'function' ? valor.bind(target) : valor;
      },
    })
  : base44Raw.functions;

export const base44 = new Proxy(base44Raw, {
  get(target, prop, receiver) {
    if (prop === 'entities') return entitiesProxy;
    if (prop === 'functions') return functionsProxy;
    const valor = Reflect.get(target, prop, receiver);
    return typeof valor === 'function' ? valor.bind(target) : valor;
  },
});
