// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const dateForm = document.getElementById('dateForm');
const gallery = document.getElementById('gallery');
const statusMessage = document.getElementById('status');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const closeModalButton = document.getElementById('closeModal');
const submitButton = dateForm.querySelector('button');

// NASA provides a shared demo key for trying out the APOD API.
const apiKey = 'cPmhwjGKKCqR69MjnF8pnk7Q9mTLhgLjHCpM66Jf';
const apodUrl = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic';

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

function formateDate(date) {
  return date.replaceAll('-', '').slice(2);
}

// Fill the modal with the selected APOD and open it.
function openImageModal(item) {
  modalImage.onerror = () => {
    if (item.highResolutionUrl && modalImage.src !== item.imageUrl) {
      modalImage.src = item.imageUrl;
      return;
    }

    modalImage.alt = 'Image unavailable';
  };
  modalImage.src = item.highResolutionUrl || item.imageUrl;
  modalImage.alt = item.title;
  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation;
  imageModal.showModal();
}

// Add one gallery item without inserting API text as HTML.
function addGalleryItem(item) {
  const card = document.createElement('article');
  card.className = 'gallery-item';

  if (item.imageUrl) {
    const imageButton = document.createElement('button');
    imageButton.type = 'button';
    imageButton.className = 'gallery-image-button';
    imageButton.setAttribute('aria-label', `View details for ${item.title}`);
    imageButton.addEventListener('click', () => openImageModal(item));

    const image = document.createElement('img');
    image.src = item.imageUrl;
    image.alt = item.title;
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      if (item.highResolutionUrl && image.src !== item.highResolutionUrl) {
        image.src = item.highResolutionUrl;
        return;
      }

      const unavailableMessage = document.createElement('span');
      unavailableMessage.className = 'image-unavailable';
      unavailableMessage.textContent = 'Image unavailable';
      imageButton.replaceWith(unavailableMessage);
    });
    imageButton.appendChild(image);
    card.appendChild(imageButton);
  }

  const title = document.createElement('h2');
  title.textContent = item.title;
  card.appendChild(title);

  const date = document.createElement('p');
  date.textContent = item.date;
  card.appendChild(date);

  gallery.appendChild(card);
}

closeModalButton.addEventListener('click', () => imageModal.close());
imageModal.addEventListener('click', (event) => {
  if (event.target === imageModal) {
    imageModal.close();
  }
});

// Fetch and display every APOD entry in the selected date range.
dateForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (startInput.value > endInput.value) {
    statusMessage.textContent = 'The start date must be on or before the end date.';
    return;
  }

  const params = new URLSearchParams({
    date_from: formateDate(startInput.value),
    date_to: formateDate(endInput.value),
    per_page: 9,
    page: 1
  });

  submitButton.disabled = true;
  statusMessage.textContent = 'Loading space images...';
  gallery.replaceChildren();

  try {
    const response = await fetch(`${apodUrl}?${params}`);
    const data = await response.json();
    console.log("Nasa return, ", data);
    console.log("Number of entries:", data.length);

    if (!response.ok) {
      const apiError = data.error && data.error.message;
      throw new Error(apiError || data.msg || data.message || 'NASA could not load the selected dates.');
    }

    const apodItems = (Array.isArray(data) ? data : [data]).map((item) => ({
      title: item.title,
      date: item.date,
      explanation: item.explanation,
      imageUrl: item.url || item.hdurl || null,
      highResolutionUrl: item.media_type === 'image' ? item.hdurl : null
    }));
    apodItems.forEach(addGalleryItem);
    statusMessage.textContent = `Showing ${apodItems.length} APOD ${apodItems.length === 1 ? 'entry' : 'entries'}.`;
  } catch (error) {
    statusMessage.textContent = `Unable to load APOD images: ${error.message}`;
  } finally {
    submitButton.disabled = false;
  }

});
