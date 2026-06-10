import { getAllPaymentRequests } from './backend/db.js';

try {
  const reqs = getAllPaymentRequests();
  console.log("length:", reqs.length);
  console.log(JSON.stringify(reqs));
} catch(e) {
  console.log("ERROR!", e);
}
