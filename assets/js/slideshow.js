function initSlideshow(sectionId, dotsContainerId, prevFnName, nextFnName) {
  const slides = document.querySelectorAll(`#${sectionId} .slides`);
  const dotsContainer = document.getElementById(dotsContainerId);
  let index = 0;
  let timer;

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    dot.addEventListener('click', () => {
      clearTimeout(timer);
      show(i);
      timer = setTimeout(auto, 5000);
    });
    dotsContainer.appendChild(dot);
  });

  function updateDots() {
    dotsContainer.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
  }

  function show(n) {
    if (n >= slides.length) index = 0;
    else if (n < 0) index = slides.length - 1;
    else index = n;
    slides.forEach(s => s.style.display = 'none');
    slides[index].style.display = 'block';
    updateDots();
  }

  function auto() {
    show(index + 1);
    timer = setTimeout(auto, 5000);
  }

  function prev() {
    clearTimeout(timer);
    show(index - 1);
    timer = setTimeout(auto, 5000);
  }

  function next() {
    clearTimeout(timer);
    show(index + 1);
    timer = setTimeout(auto, 5000);
  }

  show(0);
  timer = setTimeout(auto, 5000);

  return { prev, next };
}

window.addEventListener('load', function () {
  const gallery = initSlideshow('gallery', 'gallery-dots');
  const sponsors = initSlideshow('sponsors', 'sponsor-dots');

  window.plusSlides = (n) => n < 0 ? gallery.prev() : gallery.next();
  window.plusSponsorSlides = (n) => n < 0 ? sponsors.prev() : sponsors.next();
});
