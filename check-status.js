const RAILWAY_TOKEN = '254557d6-28cd-4ea2-aacd-f49e5cb768d7';
const RAILWAY_API = 'https://backboard.railway.app/graphql/v2';
const PROJECT_ID = '56225beb-e7d9-4e2b-b14d-f779d2e34a67';

// Ver estado actual del proyecto
const checkProject = async () => {
  console.log('🔍 Verificando estado del proyecto...\n');
  
  const query = `
    query {
      project(id: "${PROJECT_ID}") {
        id
        name
        services {
          edges {
            node {
              id
              name
              serviceInstances {
                edges {
                  node {
                    id
                    domains {
                      serviceDomains {
                        domain
                      }
                      customDomains {
                        domain
                      }
                    }
                  }
                }
              }
            }
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
    console.error('❌ Error:', JSON.stringify(data.errors, null, 2));
    return;
  }
  
  console.log('📦 Proyecto:', data.data.project.name);
  console.log('📋 Servicios encontrados:', data.data.project.services.edges.length);
  console.log('\n' + JSON.stringify(data.data, null, 2));
};

await checkProject();
