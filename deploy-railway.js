const RAILWAY_TOKEN = '254557d6-28cd-4ea2-aacd-f49e5cb768d7';
const RAILWAY_API = 'https://backboard.railway.app/graphql/v2';

// GraphQL mutation para crear proyecto
const createProject = async () => {
  console.log('🚀 Creando proyecto en Railway...\n');
  
  const query = `
    mutation {
      projectCreate(input: {
        name: "libro-memorias-pdf-service"
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
    console.error('❌ Error:', data.errors);
    return null;
  }
  
  console.log('✅ Proyecto creado:', data.data.projectCreate.name);
  console.log('   ID:', data.data.projectCreate.id);
  
  return data.data.projectCreate.id;
};

// Obtener proyectos existentes
const getProjects = async () => {
  console.log('📋 Obteniendo proyectos...\n');
  
  const query = `
    query {
      projects {
        edges {
          node {
            id
            name
            createdAt
          }
        }
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
    console.error('❌ Error:', data.errors);
    return;
  }
  
  const projects = data.data.projects.edges;
  console.log(`✅ ${projects.length} proyectos encontrados:\n`);
  
  projects.forEach(p => {
    console.log(`- ${p.node.name} (${p.node.id})`);
  });
};

await getProjects();
await createProject();

