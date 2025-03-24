import { writeFileSync } from 'fs';
import { dump } from 'js-yaml';
import { openApiDocument } from '../src/lib/server/api/schema';

// Generate OpenAPI YAML
const openApiYaml = dump(openApiDocument);

// Write to file
writeFileSync('src/lib/openapi/openapi.yaml', openApiYaml);

console.log('OpenAPI specification generated successfully!');
