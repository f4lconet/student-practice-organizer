import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

// Minimal docx with docxtemplater tags
function createMinimalDocx(tags) {
  const zip = new PizZip();
  
  // [Content_Types].xml — required for a docx to be valid
  zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '</Types>');

  // _rels/.rels
  zip.file('_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>');

  // word/_rels/document.xml.rels
  zip.file('word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>');

  // word/styles.xml
  zip.file('word/styles.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">' +
    '<w:name w:val="Normal"/>' +
    '</w:style>' +
    '</w:styles>');

  // Build document body with tags
  const paragraphs = tags.map(tag =>
    `<w:p><w:r><w:t>{${tag}}</w:t></w:r></w:p>`
  ).join('');

  zip.file('word/document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + paragraphs + '</w:body></w:document>');

  return zip.generate({ type: 'nodebuffer' });
}

const templates = {
  'individual-task.docx': ['studentFio', 'group', 'directionCode', 'directionName', 'programName', 'specialty', 'practiceTopic', 'mainStageTasks', 'practiceStart', 'practiceEnd'],
  'title-page.docx': ['studentFio', 'group', 'specialty', 'practiceTopic'],
  'review.docx': ['studentFio', 'group', 'reviewActivities', 'reviewCharacteristic', 'reviewEmployed', 'reviewNextPractice', 'reviewEmploymentOffer', 'reviewSuggestions', 'reviewGrade'],
};

for (const [name, tags] of Object.entries(templates)) {
  const buf = createMinimalDocx(tags);
  fs.writeFileSync(path.join(TEMPLATES_DIR, name), buf);
  console.log(`Created: ${name} (${buf.length} bytes)`);
}

console.log('All templates created in', TEMPLATES_DIR);