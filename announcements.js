const SHEET_ID = '2PACX-1vQAxdBQkKn-sl_Zohvc_zpbxpH94lYo7X1L1prZeDM3tw-e42kGNmS27RAnKzBuhVRgJ_0unzErvyP4';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseCsv(data) {
  const rows = [];
  let currentRow = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    const nextChar = data[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }

      currentRow.push(currentValue);
      if (currentRow.some(value => value !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  currentRow.push(currentValue);
  if (currentRow.some(value => value !== '')) {
    rows.push(currentRow);
  }

  return rows.map(row => row.map(value => value.trim()));
}

function loadAnnouncements() {
  const url = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?output=csv`;

  fetch(url)
    .then(response => response.text())
    .then(data => {
      const rows = parseCsv(data);
      
      let html = '';
      rows.slice(1).forEach((row, index) => {
        const [title = '', message = '', date = '', imageUrl = ''] = row;
        
        if (title && title.trim()) {
          const safeTitle = escapeHtml(title.trim());
          const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
          const safeDate = escapeHtml(date.trim());
          const safeImageUrl = escapeHtml(imageUrl.trim());

          let imageHtml = '';
          if (imageUrl && imageUrl.trim()) {
            imageHtml = `<img src="${safeImageUrl}" alt="${safeTitle}" class="announcement-image" data-modal-trigger="${index}">`;
          }

          html += `
            <div class="announcement">
              <div class="announcement-header">
                <h3>${safeTitle}</h3>
                <small class="announcement-date">${safeDate}</small>
              </div>
              <p class="announcement-message">${safeMessage}</p>
              ${imageHtml}
            </div>
          `;
        }
      });

      document.getElementById('announcements-container').innerHTML = html;
      
      // Add modal to page if it doesn't exist
      if (!document.getElementById('announcement-modal')) {
        const modal = document.createElement('div');
        modal.id = 'announcement-modal';
        modal.className = 'image-modal';
        modal.innerHTML = `
          <div class="image-modal__content">
            <img id="modal-image" src="" alt="">
            <button class="image-modal__close" aria-label="Close">&times;</button>
          </div>
        `;
        document.body.appendChild(modal);
      }

      // Set up event listeners
      setupImageListeners();
    })
    .catch(error => console.log('Error loading announcements:', error));
}

function setupImageListeners() {
  const modal = document.getElementById('announcement-modal');
  const closeBtn = modal.querySelector('.image-modal__close');
  const images = document.querySelectorAll('.announcement-image');

  images.forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      document.getElementById('modal-image').src = img.src;
      modal.classList.add('is-open');
    });
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('is-open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('is-open');
    }
  });
}

document.addEventListener('DOMContentLoaded', loadAnnouncements);
