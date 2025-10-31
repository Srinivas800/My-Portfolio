function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
  }
  /* --- Image Modal Functions --- */
var modal = document.getElementById("imageModal");
var modalImages = document.querySelectorAll(".modal-image");

// Function to open the modal
function openImageModal(modalId) {
  // Hide all images
  modalImages.forEach(img => {
    img.style.display = "none";
  });
  
  // Show the specific image
  var imgToShow = document.getElementById(modalId);
  if (imgToShow) {
    imgToShow.style.display = "block";
  }
  
  modal.style.display = "flex"; // Show the modal overlay
}

// Function to close the modal
function closeImageModal() {
  modal.style.display = "none"; // Hide the modal
}

// Close the modal if the user clicks on the backdrop
window.onclick = function(event) {
  if (event.target == modal) {
    closeImageModal();
  }
}