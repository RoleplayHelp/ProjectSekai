/**
 * Quản lý điều hướng trang (Single Responsibility)
 */
class Navigator {
  static goTo(page) {
    switch (page) {
      case "profile":
        window.location.href = "./Profile/index.html";
        break;
      case "calculator":
        window.location.href = "./Calc/index.html";
        break;
      default:
        console.error("Trang không tồn tại:", page);
    }
  }
}

/**
 * Khởi tạo event listener (Dependency Inversion - chỉ phụ thuộc vào DOM interface)
 */
document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.querySelector("button[onclick*='profile']");
  const calcBtn = document.querySelector("button[onclick*='calculator']");

  if (profileBtn) {
    profileBtn.addEventListener("click", () => Navigator.goTo("profile"));
  }
  if (calcBtn) {
    calcBtn.addEventListener("click", () => Navigator.goTo("calculator"));
  }
});
