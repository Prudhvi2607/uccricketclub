// GALLERY SLIDESHOW
let galleryIndex = 0;
let gallerySlides = document.querySelectorAll('#gallery .slides');
let galleryTimer;

function showGallerySlide(n) {
  if (n >= gallerySlides.length) galleryIndex = 0;
  else if (n < 0) galleryIndex = gallerySlides.length - 1;
  else galleryIndex = n;

  gallerySlides.forEach(slide => slide.style.display = 'none');
  gallerySlides[galleryIndex].style.display = 'block';
}

function autoGallerySlides() {
  showGallerySlide(galleryIndex + 1);
  galleryTimer = setTimeout(autoGallerySlides, 5000);
}

function plusSlides(n) {
  clearTimeout(galleryTimer);
  showGallerySlide(galleryIndex + n);
  galleryTimer = setTimeout(autoGallerySlides, 5000);
}

// SPONSOR SLIDESHOW
let sponsorIndex = 0;
let sponsorSlides = document.querySelectorAll('#sponsors .slides');
let sponsorTimer;

function showSponsorSlide(n) {
  if (n >= sponsorSlides.length) sponsorIndex = 0;
  else if (n < 0) sponsorIndex = sponsorSlides.length - 1;
  else sponsorIndex = n;

  sponsorSlides.forEach(slide => slide.style.display = 'none');
  sponsorSlides[sponsorIndex].style.display = 'block';
}

function autoSponsorSlides() {
  showSponsorSlide(sponsorIndex + 1);
  sponsorTimer = setTimeout(autoSponsorSlides, 5000);
}

function plusSponsorSlides(n) {
  clearTimeout(sponsorTimer);
  showSponsorSlide(sponsorIndex + n);
  sponsorTimer = setTimeout(autoSponsorSlides, 5000);
}

// INIT
window.addEventListener('load', function () {
  showGallerySlide(galleryIndex);
  autoGallerySlides();

  showSponsorSlide(sponsorIndex);
  autoSponsorSlides();
});
