const fs = require('fs');
const path = require('path');

function findFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, files);
    } else if (fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = [...findFiles('app/api'), ...findFiles('lib')];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace session.user as any
  content = content.replace(/\(session\.user as any\)\.id/g, 'session.user.id');
  
  // Replace catch error: any
  content = content.replace(/catch \(error: any\)/g, 'catch (error: unknown)');
  content = content.replace(/catch \(err: any\)/g, 'catch (err: unknown)');
  
  // Replace todo.userId as any
  content = content.replace(/\(todo\.userId as any\)\.email/g, '(todo.userId as unknown as { email: string }).email');
  
  // Replace updateData: any
  content = content.replace(/const updateData: any =/g, 'const updateData: Record<string, unknown> =');
  
  // Replace lib/validateEdges any[]
  content = content.replace(/nodes: any\[\], edges: any\[\]/g, 'nodes: { id: string; [key: string]: unknown }[], edges: { id: string; source: string; target: string; [key: string]: unknown }[]');
  
  fs.writeFileSync(file, content);
}
console.log('Refactored all any types successfully.');
