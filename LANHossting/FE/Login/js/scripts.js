
    // Xử lý ẩn hiện mật khẩu
    function togglePassword() {
      const passwordInput = document.getElementById('password');
      const toggleIcon = document.getElementById('toggleIcon');

      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('bi-eye-slash');
        toggleIcon.classList.add('bi-eye');
      } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('bi-eye');
        toggleIcon.classList.add('bi-eye-slash');
      }
    }

    // Submit Form
    document.getElementById('loginForm').addEventListener('submit', function (event) {
      event.preventDefault();
      const form = event.target;
      // Custom validation để hiển thị lỗi đúng chỗ
      let isValid = true;
      const username = document.getElementById('username');
      const password = document.getElementById('password');

      if (!username.value) {
        username.parentElement.classList.add('is-invalid');
        document.getElementById('usernameFeedback').style.display = 'block';
        isValid = false;
      } else {
        username.parentElement.classList.remove('is-invalid');
        document.getElementById('usernameFeedback').style.display = 'none';
      }

      if (!password.value) {
        password.parentElement.classList.add('is-invalid');
        document.getElementById('passwordFeedback').style.display = 'block';
        isValid = false;
      } else {
        password.parentElement.classList.remove('is-invalid');
        document.getElementById('passwordFeedback').style.display = 'none';
      }


      if (isValid) {
        // Giả lập login thành công
        const btn = document.querySelector('.btn-primary-modern');
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';
        setTimeout(() => {
          alert('Đăng nhập thành công! Chuyển hướng về Dashboard...');
          // window.location.href = '/dashboard';
          btn.innerHTML = 'Đăng Nhập';
        }, 1000);
      }
    });

    // Xóa lỗi khi người dùng bắt đầu nhập
    const inputs = document.querySelectorAll('.custom-input');
    inputs.forEach(input => {
      input.addEventListener('input', function () {
        this.parentElement.classList.remove('is-invalid');
        const feedbackId = this.id + 'Feedback';
        document.getElementById(feedbackId).style.display = 'none';
      });
    });

    // Phát hiện autofill và thay đổi màu
    function checkAutofill() {
      inputs.forEach(input => {
        try {
          const isAutofilled = input.matches(':-webkit-autofill');
          if (isAutofilled) {
            input.parentElement.classList.add('has-autofill');
          } else {
            input.parentElement.classList.remove('has-autofill');
          }
        } catch (e) {
          // Fallback cho trình duyệt không hỗ trợ :-webkit-autofill selector
        }
      });
    }

    // Kiểm tra autofill ngay khi load trang
    setTimeout(checkAutofill, 100);
    setTimeout(checkAutofill, 500);
    
    // Kiểm tra khi có thay đổi
    inputs.forEach(input => {
      input.addEventListener('change', checkAutofill);
      input.addEventListener('input', checkAutofill);
      input.addEventListener('animationstart', function(e) {
        if (e.animationName === 'onAutoFillStart') {
          this.parentElement.classList.add('has-autofill');
        }
      });
    });