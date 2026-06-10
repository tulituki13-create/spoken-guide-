import { db } from './backend/db.js';
console.log('Running quick fix for course_subtopics...');
try {
  let count = db.prepare('SELECT COUNT(*) as count FROM course_subtopics').get().count;
  console.log(`Before: ${count} subtopics.`);

  db.exec('DELETE FROM course_subtopics;');

  count = db.prepare('SELECT COUNT(*) as count FROM course_subtopics').get().count;
  console.log(`After: ${count} subtopics. They will be regenerated gracefully.`);
} catch (e) {
  console.error(e);
}
