import axios from 'axios';

async function fetchCollections() {
  try {
    const response = await axios.get('https://smartschool-project-python.onrender.com/collections');
    console.log('Collections from FastAPI:', response.data.collections);
  } catch (error) {
    console.error('Error fetching collections from FastAPI:', error.message);
  }
}

// מפעילים את הפונקציה
fetchCollections();
