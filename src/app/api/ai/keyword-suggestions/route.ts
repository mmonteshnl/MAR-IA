import { NextRequest, NextResponse } from 'next/server';

// Sugerencias inteligentes predefinidas por tipo de negocio
const keywordDatabase = {
  restaurante: {
    characteristics: ["vegano", "gourmet", "familiar", "económico", "buffet", "comida rápida", "mariscos", "carnes", "internacional"],
    services: ["delivery", "24h", "reservas", "terraza", "estacionamiento", "wifi", "aire acondicionado", "música en vivo"],
    ambiance: ["romántico", "casual", "elegante", "ruidoso", "tranquilo", "moderno", "tradicional", "acogedor"],
    target: ["parejas", "familias", "estudiantes", "ejecutivos", "turistas", "grupos", "celebraciones"]
  },
  café: {
    characteristics: ["artesanal", "orgánico", "especializados", "postres", "desayunos", "brunch", "pastelería"],
    services: ["wifi", "para llevar", "estudio", "trabajo", "reuniones", "delivery", "terraza"],
    ambiance: ["tranquilo", "acogedor", "moderno", "vintage", "literario", "bohemio"],
    target: ["estudiantes", "freelancers", "parejas", "amigos", "familias"]
  },
  hotel: {
    characteristics: ["boutique", "resort", "económico", "lujo", "familiar", "negocios", "histórico"],
    services: ["piscina", "spa", "gym", "wifi", "estacionamiento", "restaurante", "bar", "eventos"],
    ambiance: ["elegante", "moderno", "clásico", "tropical", "urbano", "romántico"],
    target: ["turistas", "parejas", "familias", "ejecutivos", "lunamiel", "grupos"]
  },
  gimnasio: {
    characteristics: ["completo", "crossfit", "yoga", "pilates", "funcional", "boxeo", "spinning"],
    services: ["personal trainer", "clases grupales", "vestuarios", "estacionamiento", "nutrición"],
    ambiance: ["motivador", "limpio", "espacioso", "moderno", "profesional"],
    target: ["principiantes", "avanzados", "mujeres", "hombres", "seniors", "jóvenes"]
  },
  farmacia: {
    characteristics: ["24h", "especializada", "homeopática", "veterinaria", "dermatológica"],
    services: ["delivery", "consultas", "inyecciones", "presión arterial", "diabetes"],
    ambiance: ["confiable", "limpia", "profesional", "cercana"],
    target: ["familias", "seniors", "pacientes crónicos", "emergencias"]
  },
  banco: {
    characteristics: ["digital", "cooperativo", "internacional", "local", "especializado"],
    services: ["cajeros", "préstamos", "inversiones", "seguros", "empresarial", "hipotecas"],
    ambiance: ["seguro", "profesional", "moderno", "eficiente"],
    target: ["particulares", "empresas", "estudiantes", "seniors", "emprendedores"]
  },
  supermercado: {
    characteristics: ["orgánico", "gourmet", "económico", "24h", "familiar", "pequeño", "grande"],
    services: ["delivery", "estacionamiento", "farmacia", "panadería", "carnicería", "autoservicio"],
    ambiance: ["limpio", "organizado", "espacioso", "moderno", "tradicional"],
    target: ["familias", "oficinistas", "estudiantes", "seniors", "vecinos"]
  },
  tienda: {
    characteristics: ["ropa", "electrónicos", "hogar", "deportes", "libros", "juguetes", "artesanías"],
    services: ["probadores", "delivery", "gift cards", "devoluciones", "layaway"],
    ambiance: ["moderno", "acogedor", "organizado", "trendy", "clásico"],
    target: ["jóvenes", "familias", "profesionales", "coleccionistas", "turistas"]
  },
  barbería: {
    characteristics: ["tradicional", "moderna", "unisex", "especializada", "vintage", "premium"],
    services: ["corte", "barba", "afeitado", "tratamientos", "productos", "citas"],
    ambiance: ["masculino", "retro", "limpio", "relajado", "profesional"],
    target: ["hombres", "mujeres", "niños", "profesionales", "estudiantes"]
  },
  spa: {
    characteristics: ["relajante", "terapéutico", "lujo", "natural", "holístico", "médico"],
    services: ["masajes", "faciales", "manicure", "pedicure", "sauna", "tratamientos"],
    ambiance: ["tranquilo", "elegante", "zen", "limpio", "aromático"],
    target: ["mujeres", "parejas", "ejecutivos", "atletas", "seniors"]
  },
  clínica: {
    characteristics: ["especializada", "general", "dental", "estética", "pediátrica", "geriátrica"],
    services: ["consultas", "urgencias", "laboratorio", "radiología", "cirugía", "chequeos"],
    ambiance: ["limpio", "profesional", "moderno", "confiable", "cómodo"],
    target: ["familias", "adultos", "niños", "seniors", "pacientes crónicos"]
  },
  escuela: {
    characteristics: ["bilingüe", "privada", "pública", "técnica", "artística", "deportiva"],
    services: ["transporte", "comedor", "actividades", "tutorías", "biblioteca", "laboratorios"],
    ambiance: ["seguro", "educativo", "moderno", "tradicional", "innovador"],
    target: ["niños", "adolescentes", "padres", "profesionales", "comunidad"]
  }
};

// Función para generar sugerencias inteligentes
function generateSmartSuggestions(businessType: string, location?: string): string[] {
  const suggestions: string[] = [];
  const businessData = keywordDatabase[businessType.toLowerCase()];
  
  if (businessData) {
    // Agregar algunas sugerencias de cada categoría
    Object.values(businessData).forEach(category => {
      suggestions.push(...category.slice(0, 3)); // Tomar las primeras 3 de cada categoría
    });
  } else {
    // Sugerencias genéricas para tipos de negocio no definidos
    const genericSuggestions = [
      "profesional", "confiable", "cerca", "recomendado", "popular", "moderno", 
      "tradicional", "económico", "calidad", "servicio", "rápido", "amigable",
      "limpio", "organizado", "especializado", "experiencia"
    ];
    suggestions.push(...genericSuggestions.slice(0, 8));
  }
  
  // Agregar sugerencias generales de ubicación
  const generalKeywords = ["centro", "zona norte", "zona sur", "cerca del mall", "accesible", "popular", "recomendado"];
  suggestions.push(...generalKeywords.slice(0, 3));
  
  // Si hay ubicación, agregar sugerencias específicas
  if (location) {
    suggestions.push(`en ${location}`, `cerca de ${location}`, `${location} centro`);
  }
  
  // Eliminar duplicados y mezclar
  return [...new Set(suggestions)].slice(0, 15);
}

// Función para corregir y mejorar palabras clave
function correctKeywords(keywords: string, businessType: string): string {
  const words = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
  const corrected: string[] = [];
  
  // Diccionario de correcciones comunes
  const corrections = {
    'veganao': 'vegano',
    'deliveri': 'delivery',
    '24hr': '24h',
    'familliar': 'familiar',
    'romantico': 'romántico',
    'economico': 'económico',
    'estacionaminto': 'estacionamiento',
    'tranquillo': 'tranquilo'
  };
  
  words.forEach(word => {
    // Aplicar correcciones
    const correctedWord = corrections[word] || word;
    
    // Evitar palabras muy genéricas
    if (!['bueno', 'malo', 'cosa', 'lugar', 'sitio'].includes(correctedWord)) {
      corrected.push(correctedWord);
    }
  });
  
  // Eliminar duplicados
  return [...new Set(corrected)].join(', ');
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Keyword suggestions API called');
    const { action, businessType, location, context, keywords } = await request.json();
    
    console.log('📥 Request data:', { action, businessType, location, keywords });

    if (action === 'suggest') {
      // Generar nuevas sugerencias
      if (!businessType) {
        return NextResponse.json(
          { error: 'businessType es requerido para generar sugerencias' },
          { status: 400 }
        );
      }

      const suggestions = generateSmartSuggestions(businessType, location);
      console.log('✨ Generated suggestions:', suggestions);

      return NextResponse.json({
        suggestions,
        categories: keywordDatabase[businessType.toLowerCase()] || {},
        businessType,
        location
      });

    } else if (action === 'correct') {
      // Corregir palabras clave existentes
      if (!keywords || !businessType) {
        return NextResponse.json(
          { error: 'keywords y businessType son requeridos para corrección' },
          { status: 400 }
        );
      }

      const corrected = correctKeywords(keywords, businessType);
      const suggestions = generateSmartSuggestions(businessType, location).slice(0, 5);
      
      console.log('🔧 Corrected keywords:', corrected);

      return NextResponse.json({
        corrected,
        suggestions,
        improvements: `Se corrigieron errores ortográficos y se eliminaron términos genéricos. Se sugieren ${suggestions.length} palabras adicionales.`
      });

    } else {
      return NextResponse.json(
        { error: 'Acción no válida. Usa "suggest" o "correct"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('💥 Error en keyword suggestions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}