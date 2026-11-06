// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const dateForm = document.getElementById('dateForm');
const gallery = document.getElementById('gallery');
const statusMessage = document.getElementById('status');
const submitButton = dateForm.querySelector('button');

// NASA provides a shared demo key for trying out the APOD API.
const apiKey = 'DEMO_KEY';
const apodUrl = 'https://api.nasa.gov/planetary/apod';

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Add one gallery item without inserting API text as HTML.
function addGalleryItem(item) {
  const card = document.createElement('article');
  card.className = 'gallery-item';

  const title = document.createElement('h2');
  title.textContent = item.title;
  card.appendChild(title);

  const date = document.createElement('p');
  date.textContent = item.date;
  card.appendChild(date);

  if (item.imageUrl) {
    const image = document.createElement('img');
    image.src = item.imageUrl;
    image.alt = item.title;
    image.loading = 'lazy';
    card.appendChild(image);
  } else if (item.mediaType === 'video') {
    const videoLink = document.createElement('a');
    videoLink.href = item.videoUrl;
    videoLink.target = '_blank';
    videoLink.rel = 'noopener noreferrer';
    videoLink.textContent = 'Watch this APOD video';
    card.appendChild(videoLink);
  }

  const explanation = document.createElement('p');
  explanation.textContent = item.explanation;
  card.appendChild(explanation);

  if (item.copyright) {
    const credit = document.createElement('p');
    credit.textContent = `Image credit: ${item.copyright}`;
    card.appendChild(credit);
  }

  gallery.appendChild(card);
}

// Fetch and display every APOD entry in the selected date range.
dateForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (startInput.value > endInput.value) {
    statusMessage.textContent = 'The start date must be on or before the end date.';
    return;
  }

  const params = new URLSearchParams({
    start_date: startInput.value,
    end_date: endInput.value,
    api_key: apiKey
  });

  submitButton.disabled = true;
  statusMessage.textContent = 'Loading space images...';
  gallery.replaceChildren();

  try {
    const response = await fetch(`${apodUrl}?${params}`);
    const data = await response.json();

    if (!response.ok) {
      const apiError = data.error && data.error.message;
      throw new Error(apiError || data.msg || data.message || 'NASA could not load the selected dates.');
    }

    const apodItems = (Array.isArray(data) ? data : [data]).map((item) => ({
      title: item.title,
      date: item.date,
      explanation: item.explanation,
      imageUrl: item.hdurl,
      mediaType: item.media_type,
      videoUrl: item.media_type === 'video' ? item.url : null,
      copyright: item.copyright
    }));
    apodItems.forEach(addGalleryItem);
    statusMessage.textContent = `Showing ${apodItems.length} APOD ${apodItems.length === 1 ? 'entry' : 'entries'}.`;
  } catch (error) {
    statusMessage.textContent = `Unable to load APOD images: ${error.message}`;
  } finally {
    submitButton.disabled = false;
  }
});
