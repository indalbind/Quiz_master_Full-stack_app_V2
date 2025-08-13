export default 
    {
      data() {
          return {
              username: '',
              password: '',
              error: '',
              showPopup: false
          };
      },
      methods: {
          async loginUser() {
              try {
                  const response = await fetch('/api/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          username: this.username,
                          password: this.password
                      })
                  });

                  const data = await response.json();

                  if (!response.ok) {
                      this.error = data.msg || 'Login failed';
                      this.showPopup = true;
                      setTimeout(() => this.showPopup = false, 3000);
                      return;
                  }

                  const token = data.access_token;
                  localStorage.setItem('token', token);

                  const payload = JSON.parse(atob(token.split('.')[1]));
                  const role = payload.is_admin ? 'admin' : 'user';

                  // Update root Vue instance 
                  this.$root.usertype = role;

                  //  Navigate based on role 
                  this.$router.replace(role === 'admin' ? '/admin/home' : '/user/home');

              } catch (err) {
                  this.error = 'Something went wrong. Try again.';
                  this.showPopup = true;
                  setTimeout(() => this.showPopup = false, 3000);
              }
          }
      },

    template: `
      <div class="login">
    <!-- Floating popup message -->
    <div v-if="showPopup" class="popup-alert">
      {{ error }}
    </div>

    <!-- Form container -->
    <div class="form-container">
      <form @submit.prevent="loginUser" class="mt-5">
        <h2 class="text-center mb-4">Sign in</h2>

        <div class="mb-5">
          <input v-model="username" type="text" class="form-control line-input" placeholder="Enter your username" required>
        </div>

        <div class="mb-5">
          <input v-model="password" type="password" class="form-control line-input" placeholder="Enter your password" required>
        </div>

        <div class="login-actions mb-5">
        <button type="submit" class="btn btn-success ">Login</button>
        <div style="color: rgb(27, 122, 79);">Practice make perfect</div>
        </div>


        <p class="position">
          Don’t have an account?
          <router-link to="/signup" class="signup textspace">Sign up</router-link>
        </p>
      </form>
    </div>
    <div class="loginimage"> </div>
  </div>
    `
};

