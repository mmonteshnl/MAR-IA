
import {NextRequest, NextResponse} from 'next/server';
import {Client} from '@googlemaps/google-maps-services-js';

const client = new Client({});
const GOOGLE_PLACES_API_KEY = "AIzaSyCdAibVnXQdNG4oRizcWCI1fXijx4mBLGY";

export async function GET(request: NextRequest) {
  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ message: 'La clave API para Google Places no está configurada.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const place = searchParams.get('place');
  const businessApiType = searchParams.get('type'); // Tipo de negocio
  const keywords = searchParams.get('keywords');

  // Validación: Se requiere al menos palabras clave, tipo de negocio o lugar.
  if (!keywords && !businessApiType && !place) {
    return NextResponse.json({ message: 'Se requiere al menos palabras clave, tipo de negocio o lugar para la búsqueda.' }, { status: 400 });
  }

  let queryForApi = '';
  if (keywords) queryForApi += `${keywords} `;
  if (place) queryForApi += `in ${place} `;
  // El país se añade a la query si no se usa como 'region' o si es un nombre completo.
  // 'region' (si es ccTLD) se usa para sesgar resultados, 'in country' en la query es para búsqueda textual.
  if (country) queryForApi += `in ${country} `;
  
  queryForApi = queryForApi.trim();

  // El parámetro 'query' es obligatorio para TextSearch de Google Places API.
  // Preparamos los parámetros para la API.
  const apiParams: { query?: string; key: string; type?: string; region?: string } = {
    key: GOOGLE_PLACES_API_KEY,
  };

  if (queryForApi) {
    apiParams.query = queryForApi;
  }

  // Si queryForApi está vacía (ej: solo se proporcionó 'type'), usar 'type' como la query.
  if (!apiParams.query && businessApiType) {
    apiParams.query = businessApiType; 
  } else if (!apiParams.query) {
    // Este caso debería ser capturado por la validación inicial.
    return NextResponse.json({ message: 'Se requiere al menos palabras clave, tipo de negocio o lugar para la búsqueda.' }, { status: 400 });
  }

  // Añadir el parámetro 'type' si se proporcionó.
  if (businessApiType) {
    // Los tipos de Google Places suelen ser en minúsculas y específicos (ej: "restaurant", "store").
    apiParams.type = businessApiType.toLowerCase();
  }

  // Añadir 'region' para sesgar resultados si 'country' es un código de 2 caracteres (ccTLD).
  if (country && country.length === 2) {
    apiParams.region = country.toUpperCase();
  }
  
  // Log para depuración: muestra los parámetros que se envían a Google Places API.
  console.log('Parámetros para Google Places API:', apiParams);

  try {
    const apiResponse = await client.textSearch({ params: apiParams });

    if (apiResponse.data.status === 'OK') {
      return NextResponse.json({ results: apiResponse.data.results }, { status: 200 });
    } else if (apiResponse.data.status === 'ZERO_RESULTS') {
      return NextResponse.json({ results: [] }, { status: 200 });
    } else {
      // Errores específicos de la API de Google Places.
      console.error('Error de Google Places API:', apiResponse.data.status, apiResponse.data.error_message);
      return NextResponse.json({ message: apiResponse.data.error_message || `Error de Google Places API: ${apiResponse.data.status}` }, { status: 500 });
    }
  } catch (error: any) {
    // Otros errores, como problemas de red o errores en la librería cliente.
    console.error('Error al llamar a Google Places API:', error);
    return NextResponse.json({ message: 'Falló la obtención de datos de Google Places API.', error: error.message }, { status: 500 });
  }
}
