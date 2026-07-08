export interface ComunaOpportunity {
  name: string;
  level: 'very_high' | 'high' | 'medium' | 'low';
  score: number;
  label: string;
  obsolescenceRate: number;
  badgeStyle: string;
  description: string;
}

export const CHILE_COMUNAS: ComunaOpportunity[] = [
  {
    name: "Santiago Centro",
    level: "very_high",
    score: 92,
    label: "Excelente (Muy Alta)",
    obsolescenceRate: 78,
    badgeStyle: "bg-red-50 text-red-700 border-red-100",
    description: "Gran volumen de microempresas y comercio tradicional presencial sin canales digitales robustos ni automatización."
  },
  {
    name: "Puente Alto",
    level: "very_high",
    score: 95,
    label: "Excelente (Muy Alta)",
    obsolescenceRate: 88,
    badgeStyle: "bg-red-50 text-red-700 border-red-100",
    description: "Comuna con gran volumen de pequeños talleres, locales gastronómicos familiares y comercio local tradicional que opera de forma manual."
  },
  {
    name: "Estación Central",
    level: "very_high",
    score: 89,
    label: "Crítica (Muy Alta)",
    obsolescenceRate: 85,
    badgeStyle: "bg-red-50 text-red-700 border-red-100",
    description: "Altísima densidad de importadores, bodegas y locales de retail independiente. Muy baja presencia web o automatizaciones."
  },
  {
    name: "Maipú",
    level: "high",
    score: 84,
    label: "Alta Oportunidad",
    obsolescenceRate: 81,
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-100",
    description: "Servicios locales, talleres mecánicos, ferreterías y colegios de barrio que requieren optimizar turnos, citas y CRM."
  },
  {
    name: "La Florida",
    level: "high",
    score: 82,
    label: "Alta Oportunidad",
    obsolescenceRate: 80,
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-100",
    description: "Negocios familiares, consultas médicas pequeñas y locales gastronómicos que operan principalmente vía WhatsApp manual."
  },
  {
    name: "Recoleta",
    level: "high",
    score: 81,
    label: "Alta Oportunidad",
    obsolescenceRate: 79,
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-100",
    description: "Industria textil, manufactura local e importadoras con sistemas transaccionales legacy que no usan inteligencia artificial."
  },
  {
    name: "Providencia",
    level: "medium",
    score: 65,
    label: "Intermedio",
    obsolescenceRate: 52,
    badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-100",
    description: "Muchos negocios tienen web, pero existe alta receptividad para integrar chatbots, agendamientos y automatización avanzada de leads."
  },
  {
    name: "Ñuñoa",
    level: "medium",
    score: 58,
    label: "Intermedio",
    obsolescenceRate: 48,
    badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-100",
    description: "Emprendimientos jóvenes y locales de gastronomía gourmet listos para conectar APIs de reservas e inteligencia conversacional."
  },
  {
    name: "Las Condes",
    level: "low",
    score: 38,
    label: "Consolidado",
    obsolescenceRate: 35,
    badgeStyle: "bg-slate-50 text-slate-500 border-slate-100",
    description: "Mercado maduro con alta competencia de agencias digitales. Buscar oportunidades en optimizaciones de IA B2B a medida."
  },
  {
    name: "Vitacura",
    level: "low",
    score: 32,
    label: "Consolidado",
    obsolescenceRate: 30,
    badgeStyle: "bg-slate-50 text-slate-500 border-slate-100",
    description: "Clínicas estéticas y servicios premium ya optimizados. Demandan soluciones CRM e integraciones de flujos de trabajo premium."
  },
  {
    name: "Lo Barnechea",
    level: "low",
    score: 28,
    label: "Consolidado",
    obsolescenceRate: 25,
    badgeStyle: "bg-slate-50 text-slate-500 border-slate-100",
    description: "Servicios comerciales de alta gama, centros médicos y consultas odontológicas boutique. Precisan automatización y agendamiento conversacional."
  }
];

export function extractComuna(locationStr: string): string {
  if (!locationStr) return "Santiago Centro";
  const str = locationStr.toLowerCase();
  
  for (const c of CHILE_COMUNAS) {
    if (str.includes(c.name.toLowerCase())) {
      return c.name;
    }
  }
  
  // Try to find if region matches
  if (str.includes("puente") || str.includes("alto")) return "Puente Alto";
  if (str.includes("maip")) return "Maipú";
  if (str.includes("condes")) return "Las Condes";
  if (str.includes("florida")) return "La Florida";
  if (str.includes("providencia")) return "Providencia";
  if (str.includes("centro") || str.includes("santiago")) return "Santiago Centro";
  if (str.includes("estacion") || str.includes("estación")) return "Estación Central";
  if (str.includes("recoleta")) return "Recoleta";
  if (str.includes("ñuñoa") || str.includes("nunoa")) return "Ñuñoa";
  if (str.includes("vitacura")) return "Vitacura";
  if (str.includes("barnechea") || str.includes("lo barnechea")) return "Lo Barnechea";
  
  return "Santiago Centro"; // default fallback for clean demos
}
