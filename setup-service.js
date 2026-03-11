const RAILWAY_TOKEN = '254557d6-28cd-4ea2-aacd-f49e5cb768d7';
const RAILWAY_API = 'https://backboard.railway.app/graphql/v2';
const PROJECT_ID = '56225beb-e7d9-4e2b-b14d-f779d2e34a67';

// Crear servicio desde GitHub repo
const createService = async () => {
  console.log('🔧 Creando servicio desde GitHub...\n');
  
  const query = `
    mutation {
      serviceCreate(input: {
        projectId: "${PROJECT_ID}"
        name: "pdf-service"
        source: {
          repo: "jairogarba-web-fitbymila/libro-memorias-pdf-service"
          branch: "main"
        }
      }) {
        id
        name
      }
    }
  `;
  
  const response = await fetch(RAILWAY_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  const data = await response.json();
  
  if (data.errors) {
    console.error('❌ Error:', JSON.stringify(data.errors, null, 2));
    return null;
  }
  
  console.log('✅ Servicio creado:', data.data.serviceCreate.name);
  console.log('   ID:', data.data.serviceCreate.id);
  
  return data.data.serviceCreate;
};

await createService();

