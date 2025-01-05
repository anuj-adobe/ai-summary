// Import necessary libraries using ES Module syntax
import 'dotenv/config'; // Automatically loads environment variables
import axios from 'axios'; // HTTP requests
import { load } from 'cheerio'; // HTML parsing

// Define custom headers for the request
const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
};

// A class to represent a Webpage
class Website {
  constructor(url) {
    this.url = url;
    this.title = '';
    this.text = '';
  }

  // Fetch and parse the website
  async fetchWebsite() {
    try {
      console.log('🔗 Fetching Website:', this.url);
      const response = await axios.get(this.url, { headers });
      const $ = load(response.data);

      // Extract the title
      this.title = $('title').text() || "No title found";

      // Remove irrelevant tags
      $('script, style, img, input, textarea, button, label').remove();

      // Extract text content
      this.text = $('body').text()
        .replace(/([.!?])\s*/g, '$1\n')
        .replace(/\n{2,}/g, '\n')
        .trim();
    } catch (error) {
      console.error('Error fetching the website:', error.message);
    }
  }

  // Display website details
  displayInfo() {
    console.log('Title:', this.title);
    console.log('Text:', this.text);
  }
}

export default Website;
