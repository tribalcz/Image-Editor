let photo = document.getElementById('edited-photo');
    let fileInput = document.getElementById('file-input');
    let photoContainer = document.getElementById('photo-container');
    let cropRectangle = document.getElementById('crop-rectangle');
    let resetButton = document.getElementById('reset-button');
    let downloadButton = document.getElementById('download-button');
    let cropButton = document.getElementById('crop-button');
    let zoomElement = document.getElementById('image-zoom');
    let isDragging = false;
    let startX, startY, endX, endY;
    let clickCounter = 0;
    let zoomLevel = 1;
    let maximalZoomLevel = 2;
    let minimalZoomLevel = 0.2;
    let zoomOffsetX = 0;
    let zoomOffsetY = 0;
    let zoomKey = 'z';
    let isEffectApplied = false;
    let isCropSelected = false;
    let isCroped = false;
    let isZoomEnabled = false;

    fileInput.addEventListener('change', function() {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = function() {
        photo.src = reader.result;
        resetButton.style.display = 'none';
        downloadButton.style.display = 'none';
        downloadButton.disabled = true;
        showImageInfoPanel();
      }

      if (file) {
        reader.readAsDataURL(file);
      }
    });

    photoContainer.addEventListener('click', function(e) {
      clickCounter++;

      if (clickCounter === 1) {
        isDragging = true;
        startX = e.pageX - photoContainer.offsetLeft;
        startY = e.pageY - photoContainer.offsetTop;

        cropRectangle.style.left = `${startX}px`;
        cropRectangle.style.top = `${startY}px`;
        cropRectangle.style.width = '0';
        cropRectangle.style.height = '0';
        cropRectangle.style.display = 'block';
      } else if (clickCounter === 2) {
        isDragging = false;
        clickCounter = 0;
        isCropSelected = true;
        updateButtons();
      }
    });
    
    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;

      endX = e.pageX - photoContainer.offsetLeft;
      endY = e.pageY - photoContainer.offsetTop;

      updateCropRectangle();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        isDragging = false;
        clickCounter = 0;
        cropRectangle.style.display = 'none';
        isCropSelected = false;
        updateButtons();
      }
    });

    document.addEventListener('keydown', function(e) {
      if(event.key.toLowerCase() === zoomKey) {
        isZoomEnabled = true;
        document.body.classList.add("stop-scrolling");
      }
    });

    document.addEventListener('keyup', function(e) {
      if(event.key.toLowerCase() === zoomKey) {
        isZoomEnabled = false;
        document.body.classList.remove("stop-scrolling");
      }
    });

    photoContainer.addEventListener('wheel', function(e){
      if(!isZoomEnabled) {
        return;
      }
      
      const zoomIntesity = 0.1;

      if(e.deltaY < maximalZoomLevel) {
        if(zoomLevel < 2) {
          zoomLevel += zoomIntesity
          applyZoom();
        }
      } else {
        if (zoomLevel > minimalZoomLevel) {
          zoomLevel -= zoomIntesity;
          applyZoom();
        }
      }
    });

    function applyZoom() {
      const originalWidth = photo.naturalWidtht;
      const originalHeight = photo.naturalHeight;
      const newWidth = originalWidth * zoomLevel;
      const newHeight = originalHeight * zoomLevel;
      
      photo.style.width = `${newWidth}px`;
      photo.style.height = `${newHeight}px`;

      zoomElement.textContent = `${zoomLevel}x`;
    }

    function updateCropRectangle() {
      let width = Math.abs(endX - startX);
      let height = Math.abs(endY - startY);
      let left = Math.min(startX, endX);
      let top = Math.min(startY, endY);

      cropRectangle.style.width = `${width}px`;
      cropRectangle.style.height = `${height}px`;
      cropRectangle.style.left = `${left}px`;
      cropRectangle.style.top = `${top}px`;
    }

    function updateButtons() {
      if(isEffectApplied || isCropSelected || isCroped) {
        resetButton.style.display = 'block';
        downloadButton.style.display = 'block';
        downloadButton.disabled = false;
        cropButton.disabled = !isCropSelected;
      } else {
        resetButton.style.display = 'none';
        downloadButton.style.display = 'none';
        downloadButton.disabled = true;
        cropButton.disabled = !isCropSelected;
      }
    }

    function cropAndResize() {
      if (isCropSelected == false) {
        return;
      }            
      let rect = cropRectangle.getBoundingClientRect();
      let x = rect.left - photoContainer.offsetLeft + 2;
      let y = rect.top - photoContainer.offsetTop + 2;
      let width = rect.width - 4; //Odečtení tloušťky výběrového nástroje
      let height = rect.height - 4; //Odečtení tloušťky výběrového nástroje

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = width / zoomLevel;
      canvas.height = height / zoomLevel;

      ctx.drawImage(photo, x / zoomLevel, y / zoomLevel, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

      photo.src = canvas.toDataURL();
      cropRectangle.style.display = 'none';
      resetButton.style.display = 'block';
      isEffectApplied = false;
      isCropSelected = false;
      isCroped = true;
      updateButtons();
    }

    function applyGrayscaleEffect() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = photo.width;
      canvas.height = photo.height;

      ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];

        const gray = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(imageData, 0, 0);

      photo.src = canvas.toDataURL();
      resetButton.style.display = 'block';
      isEffectApplied = true;
      isCropSelected = false;
      isCroped = false;
      updateButtons();
      showImageInfoPanel();
    }

    function applySepiaEffect() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = photo.width;
      canvas.height = photo.height;

      ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];

        const sepiaRed = (0.393 * red + 0.769 * green + 0.189 * blue);
        const sepiaGreen = (0.349 * red + 0.686 * green + 0.168 * blue);
        const sepiaBlue = (0.272 * red + 0.534 * green + 0.131 * blue);

        data[i] = sepiaRed;
        data[i + 1] = sepiaGreen;
        data[i + 2] = sepiaBlue;
      }

      ctx.putImageData(imageData, 0, 0);

      photo.src = canvas.toDataURL();
      resetButton.style.display = 'block';
      isEffectApplied = true;
      isCropSelected = false;
      isCroped = false;
      updateButtons();
      showImageInfoPanel();
    }

    function showImageInfoPanel() {
      const imageInfoPanel = document.getElementById('image-info-panel');
      const imageNameElement = document.getElementById('image-name');
      const imageSizeElement = document.getElementById('image-size');
      const imageDimensionsElement = document.getElementById('image-dimensions');
      const imageTypeElement = document.getElementById('image-mime-type');
      const removeButton = document.getElementById('remove-button');
      const file = fileInput.files[0];

      if(photo.src) {
        const imageName = file.name;
        const imageSize = Math.round(file.size * 3 / 4 / 1024);
        const imageDimensons = photo.width + 'x' + photo.height;
        const imageType = file.type;

        document.title = 'Editace obrázku: ' + imageName;

        imageNameElement.textContent = imageName;
        imageSizeElement.textContent = imageSize + 'KB';
        imageDimensionsElement.textContent = imageDimensons;
        imageTypeElement.textContent = imageType;
        zoomElement.textContent = zoomLevel;

        imageInfoPanel.style.display = 'block';
        removeButton.style.display = 'block';
        removeButton.disabled = false
      } else {
        imageInfoPanel.style.display = 'none';
        removeButton.style.display = 'none';
        removeButton.disabled = true
      }
    }

    function removeImage() {
      const imageInfoPanel = document.getElementById('image-info-panel');
      const removeButton = document.getElementById('remove-button');

      const confirmed = confirm('Opravdu chcete odstranit tento obrázek? Tuto akci nelze vrátit');
      
      if (confirmed) {
        const imageNameElement = document.getElementById('image-name');
        const imageSizeElement = document.getElementById('image-size');
        const imageDimensionsElement = document.getElementById('image-dimensions');
        const imageTypeElement = document.getElementById('image-mime-type');

        imageNameElement.textContent = '';
        imageSizeElement.textContent = '';
        imageDimensionsElement.textContent = '';
        imageTypeElement.textContent = '';

        imageInfoPanel.style.display = 'none';

        removeButton.style.display = 'none';
        removeButton.disabled = true;
        zoomElement.style.display = 'none';

        photo.src = '';
        fileInput.value = '';
        document.title = 'Editor obrázků'
        if(zoomLevel > 1 || zoomLevel < 1) {
          zoomLevel = 1;
        }

        isEffectApplied = false;
        isCropSelected = false;
        isCroped = false
        updateButtons();
      }
    }

    function resetImage() {   
      photo.src = fileInput.files.length ? URL.createObjectURL(fileInput.files[0]) : '';
      resetButton.style.display = 'none';
      zoomElement.style.display = 'none';
      isEffectApplied = false;
      isCropSelected = false;
      isCroped = false;
      if(zoomLevel > 1 || zoomLevel < 1) {
          zoomLevel = 1;
      }
      updateButtons();
      showImageInfoPanel();
    }

    function downloadImage() {
      const link = document.createElement('a');
      link.download = 'upraveny_obrazek.png';
      link.href = photo.src;
      link.click();
    }