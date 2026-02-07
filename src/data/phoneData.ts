// Datos de países, estados y códigos telefónicos
// Usando country-state-city para todos los estados del mundo

import { Country, State } from 'country-state-city';
import type { ICountry, IState } from 'country-state-city';

export interface StateData {
  name: string;
  code: string;
  lada: string; // Código de área (solo para países principales)
}

export interface CountryData {
  name: string;
  code: string; // Código ISO
  phoneCode: string; // Código internacional (+52, +1, etc)
  states: StateData[];
  hasDetailedLada?: boolean; // Si tiene LADA detallada por estado
}

// LADAs de México por estado
const MEXICO_LADAS: Record<string, string> = {
  'AGU': '449', // Aguascalientes
  'BCN': '664', // Baja California
  'BCS': '612', // Baja California Sur
  'CAM': '981', // Campeche
  'CHP': '961', // Chiapas
  'CHH': '614', // Chihuahua
  'CMX': '55',  // Ciudad de México
  'COA': '844', // Coahuila
  'COL': '312', // Colima
  'DUR': '618', // Durango
  'MEX': '722', // Estado de México
  'GUA': '477', // Guanajuato
  'GRO': '747', // Guerrero
  'HID': '771', // Hidalgo
  'JAL': '33',  // Jalisco
  'MIC': '443', // Michoacán
  'MOR': '777', // Morelos
  'NAY': '311', // Nayarit
  'NLE': '81',  // Nuevo León
  'OAX': '951', // Oaxaca
  'PUE': '222', // Puebla
  'QUE': '442', // Querétaro
  'ROO': '998', // Quintana Roo
  'SLP': '444', // San Luis Potosí
  'SIN': '667', // Sinaloa
  'SON': '662', // Sonora
  'TAB': '993', // Tabasco
  'TAM': '834', // Tamaulipas
  'TLA': '246', // Tlaxcala
  'VER': '229', // Veracruz
  'YUC': '999', // Yucatán
  'ZAC': '492', // Zacatecas
};

// LADAs de USA por estado (código de área principal)
const USA_LADAS: Record<string, string> = {
  'AL': '205', 'AK': '907', 'AZ': '602', 'AR': '501', 'CA': '213',
  'CO': '303', 'CT': '203', 'DE': '302', 'FL': '305', 'GA': '404',
  'HI': '808', 'ID': '208', 'IL': '312', 'IN': '317', 'IA': '515',
  'KS': '316', 'KY': '502', 'LA': '504', 'ME': '207', 'MD': '301',
  'MA': '617', 'MI': '313', 'MN': '612', 'MS': '601', 'MO': '314',
  'MT': '406', 'NE': '402', 'NV': '702', 'NH': '603', 'NJ': '201',
  'NM': '505', 'NY': '212', 'NC': '704', 'ND': '701', 'OH': '216',
  'OK': '405', 'OR': '503', 'PA': '215', 'RI': '401', 'SC': '803',
  'SD': '605', 'TN': '615', 'TX': '214', 'UT': '801', 'VT': '802',
  'VA': '804', 'WA': '206', 'WV': '304', 'WI': '414', 'WY': '307',
  'DC': '202',
};

// LADAs de España por comunidad autónoma
const SPAIN_LADAS: Record<string, string> = {
  'AN': '95',  // Andalucía
  'AR': '976', // Aragón
  'AS': '98',  // Asturias
  'IB': '971', // Islas Baleares
  'CN': '928', // Canarias
  'CB': '942', // Cantabria
  'CM': '925', // Castilla-La Mancha
  'CL': '983', // Castilla y León
  'CT': '93',  // Cataluña
  'VC': '96',  // Comunidad Valenciana
  'EX': '924', // Extremadura
  'GA': '981', // Galicia
  'RI': '941', // La Rioja
  'MD': '91',  // Madrid
  'MC': '968', // Murcia
  'NC': '948', // Navarra
  'PV': '94',  // País Vasco
  'CE': '956', // Ceuta
  'ML': '952', // Melilla
};

// LADAs de Colombia por departamento
const COLOMBIA_LADAS: Record<string, string> = {
  'AMA': '608', 'ANT': '604', 'ATL': '605', 'DC': '601', 'BOL': '605',
  'BOY': '608', 'CAL': '606', 'CAQ': '608', 'CAS': '608', 'CAU': '602',
  'CES': '605', 'COR': '604', 'CUN': '601', 'CHO': '604', 'HUI': '608',
  'LAG': '605', 'MAG': '605', 'MET': '608', 'NAR': '602', 'NSA': '607',
  'PUT': '608', 'QUI': '606', 'RIS': '606', 'SAN': '607', 'SAP': '605',
  'SUC': '605', 'TOL': '608', 'VAC': '602', 'VAU': '608', 'VID': '608',
};

// LADAs de Argentina por provincia
const ARGENTINA_LADAS: Record<string, string> = {
  'C': '11',   // Buenos Aires (Ciudad)
  'B': '11',   // Buenos Aires (Provincia)
  'K': '383',  // Catamarca
  'H': '362',  // Chaco
  'U': '280',  // Chubut
  'X': '351',  // Córdoba
  'W': '379',  // Corrientes
  'E': '343',  // Entre Ríos
  'P': '370',  // Formosa
  'Y': '388',  // Jujuy
  'L': '2954', // La Pampa
  'F': '380',  // La Rioja
  'M': '261',  // Mendoza
  'N': '376',  // Misiones
  'Q': '299',  // Neuquén
  'R': '298',  // Río Negro
  'A': '387',  // Salta
  'J': '264',  // San Juan
  'D': '266',  // San Luis
  'Z': '2966', // Santa Cruz
  'S': '342',  // Santa Fe
  'G': '385',  // Santiago del Estero
  'V': '2901', // Tierra del Fuego
  'T': '381',  // Tucumán
};

// Países con LADA detallada
const COUNTRIES_WITH_DETAILED_LADA = ['MX', 'US', 'ES', 'CO', 'AR'];

// Obtener LADA para un estado específico
const getLadaForState = (countryCode: string, stateCode: string): string => {
  switch (countryCode) {
    case 'MX': return MEXICO_LADAS[stateCode] || '';
    case 'US': return USA_LADAS[stateCode] || '';
    case 'ES': return SPAIN_LADAS[stateCode] || '';
    case 'CO': return COLOMBIA_LADAS[stateCode] || '';
    case 'AR': return ARGENTINA_LADAS[stateCode] || '';
    default: return '';
  }
};

// Obtener todos los países con sus estados
const getAllCountries = (): CountryData[] => {
  const allCountries = Country.getAllCountries();
  
  return allCountries.map((country: ICountry) => {
    const states = State.getStatesOfCountry(country.isoCode);
    const hasDetailedLada = COUNTRIES_WITH_DETAILED_LADA.includes(country.isoCode);
    
    return {
      name: country.name,
      code: country.isoCode,
      phoneCode: country.phonecode ? `+${country.phonecode}` : '',
      hasDetailedLada,
      states: states.length > 0 
        ? states.map((state: IState) => ({
            name: state.name,
            code: state.isoCode,
            lada: getLadaForState(country.isoCode, state.isoCode),
          }))
        : [{ name: 'Nacional', code: '', lada: '' }],
    };
  }).sort((a, b) => {
    // México siempre primero
    if (a.code === 'MX') return -1;
    if (b.code === 'MX') return 1;
    // Países hispanohablantes después
    const hispanicCountries = ['ES', 'CO', 'AR', 'CL', 'PE', 'US', 'CA'];
    const aIsHispanic = hispanicCountries.includes(a.code);
    const bIsHispanic = hispanicCountries.includes(b.code);
    if (aIsHispanic && !bIsHispanic) return -1;
    if (!aIsHispanic && bIsHispanic) return 1;
    // Orden alfabético por nombre
    return a.name.localeCompare(b.name, 'es');
  });
};

// Exportar todos los países
export const COUNTRIES: CountryData[] = getAllCountries();

// Helper para obtener país por código
export const getCountryByCode = (code: string): CountryData | undefined => {
  return COUNTRIES.find(c => c.code === code);
};

// Helper para obtener LADA de un estado
export const getLadaByState = (countryCode: string, stateName: string): string => {
  const country = getCountryByCode(countryCode);
  if (!country) return '';
  const state = country.states.find(s => s.name === stateName);
  return state?.lada || '';
};

// Helper para formatear número completo
export const formatPhoneNumber = (countryCode: string, lada: string, number: string): string => {
  const country = getCountryByCode(countryCode);
  if (!country) return number;
  if (lada) {
    return `${country.phoneCode} (${lada}) ${number}`;
  }
  return `${country.phoneCode} ${number}`;
};
