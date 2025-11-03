import axios from 'axios';

async function fetchCollections() {
  try {
    // קריאה ל-FastAPI שרץ על localhost:5002
    const response = await axios.get('http://127.0.0.1:5002/collections');
    console.log('Collections from FastAPI:', response.data.collections);
  } catch (error) {
    console.error('Error fetching collections from FastAPI:', error.message);
  }
}

// מפעילים את הפונקציה
fetchCollections();
